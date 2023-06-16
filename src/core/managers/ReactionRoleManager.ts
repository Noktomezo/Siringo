import type {
    ChannelResolvable,
    GuildEmoji,
    GuildMember,
    Message,
    MessageReaction,
    MessageResolvable,
    Role,
    RoleResolvable,
    Snowflake,
    TextChannel,
    User,
    UserResolvable
} from 'discord.js'
import { Collection } from 'discord.js'
import type { IDatabaseGuildSettings, IReactionRoleOptions } from '../../types.js'
import type { Siringo } from '../Siringo.js'

export class ReactionRoleManager {
    private readonly timeouts: Collection<Snowflake, NodeJS.Timeout>

    public constructor(public client: Siringo) {
        this.timeouts = new Collection<Snowflake, NodeJS.Timeout>()
    }

    /**
     * Adds a reaction to the specified message, by clicking on which the specified role will be issued.
     * Saves the specified data to the database
     *
     * @param message - Message to which the reaction will be attached
     * @param emoji - Emoji to be attached to the specified message as a reaction
     * @param role - Role that will be issued by clicking on the reaction
     * @param type - Type of reaction role (1 - normal, by default, 2 - only 1 role can be taken)
     */
    public async add(message: Message, emoji: string, role: RoleResolvable, type: number = 1) {
        const foundMessage = await this._findMessage(message, message.channel)
        if (!foundMessage) return

        const emojiId = this.client.utils.resolveEmojiId(emoji)
        if (!emojiId) return

        const roleId = foundMessage.guild.roles.resolve(role)?.id
        if (!roleId) return

        await foundMessage.react(emojiId)

        const data = (await this.client.database.get(foundMessage.guild.id)) as IDatabaseGuildSettings
        data.reactionRoles.push({
            messageId: foundMessage.id,
            channelId: foundMessage.channel.id,
            roleId,
            emojiId,
            type
        })

        return this.client.database.set(foundMessage.guild.id, data)
    }

    /**
     * Removes the reaction from the message and removes the corresponding role from all members who clicked on it.
     * Deletes data from the database
     *
     * @param message - Message to which the reaction is attached
     * @param emoji - Emoji of the reaction that is attached to the above message
     */
    public async remove(message: Message, emoji: string) {
        const foundMessage = await this._findMessage(message, message.channel)
        if (!foundMessage) return

        const emojiId = this.client.utils.resolveEmojiId(emoji)
        if (!emojiId) return

        const data = await this.client.database.get(foundMessage.guild.id)
        if (!data?.reactionRoles?.length) return

        const filter = (rr: IReactionRoleOptions) => rr.messageId !== foundMessage.id && rr.emojiId !== emojiId
        data.reactionRoles = data.reactionRoles.filter(filter)

        const reaction = foundMessage.reactions.cache.find((rr) => (rr.emoji.id ?? rr.emoji.name) === emojiId)
        if (!reaction) return

        await reaction.users.remove()

        return this.client.database.set(foundMessage.guild.id, data)
    }

    public async handleEmojiDelete(emoji: GuildEmoji) {
        const data = await this.client.database.get(emoji.guild.id)
        if (!data?.reactionRoles?.length) return

        const reactionRoles = data.reactionRoles.filter((rr) => rr.emojiId === emoji.identifier)
        for (const rr of reactionRoles) {
            const message = await this._findMessage(rr.messageId, rr.channelId)
            if (message) await this.remove(message, rr.emojiId)
        }
    }

    public async handleMessageDelete(message: Message) {
        const data = await this.client.database.get(message.guild!.id)
        if (!data?.reactionRoles?.length) return

        const filteredReactionRoles = data.reactionRoles.filter((rr) => rr.messageId === message.id)
        for (const reactionRole of filteredReactionRoles) {
            const reaction = message.reactions.cache.get(reactionRole.emojiId)
            if (reaction) await this._removeAssociatedRoles(reaction)
        }

        data.reactionRoles = data.reactionRoles.filter((rr) => rr.messageId !== message.id)

        return this.client.database.set(message.guild!.id, data)
    }

    public async handleMessageReactionAdd(reaction: MessageReaction, user: User) {
        if (user.bot) return
        if (reaction.message.partial) await reaction.message.fetch()

        const member = reaction.message.guild?.members.resolve(user)
        if (!member) return

        if (!this._hasPermissionForRoleManagement(member)) return

        const data = await this.client.database.get(member!.guild.id)
        if (!data?.reactionRoles.length) return

        const emojiId = reaction.emoji.id ?? reaction.emoji.name
        const rr = data.reactionRoles.find((rr) => rr.emojiId === emojiId && rr.messageId === reaction.message.id)
        if (!rr) return

        const role = member!.guild.roles.resolve(rr.roleId)
        if (!role) return

        await member.roles.add(role)

        if (rr.type === 2) {
            if (reaction.message.partial) await reaction.message.fetch()
            const userReactions = await this._getUserReactions(reaction.message as Message, user)
            let neededReactions = userReactions.filter((rct) => rct.emoji.id ?? rct.emoji.name !== emojiId)
            if (!neededReactions.size) return

            const lastReaction = userReactions.at(-1)
            if (lastReaction?.emoji.id ?? lastReaction?.emoji.name === reaction.emoji.id ?? reaction.emoji.name) {
                neededReactions = neededReactions.reverse()
            }

            for (const reaction of neededReactions.values()) {
                const previousTimeout = this.timeouts.get(reaction.message.id)
                if (previousTimeout) clearTimeout(previousTimeout)

                const timeout = setTimeout(async () => {
                    await reaction.users.remove(user)
                }, 500)

                this.timeouts.set(reaction.message.id, timeout)
            }
        }
    }

    public async handleMessageReactionRemove(reaction: MessageReaction, user: User) {
        const member = reaction.message.guild?.members.resolve(user)
        if (!member) return

        if (!this._hasPermissionForRoleManagement(member)) return

        const data = await this.client.database.get(member!.guild.id)
        if (!data?.reactionRoles.length) return

        const emojiId = reaction.emoji.id ?? reaction.emoji.name
        const rr = data.reactionRoles.find((rr) => rr.emojiId === emojiId && rr.messageId === reaction.message.id)
        if (!rr) return

        const role = member!.guild.roles.resolve(rr.roleId)
        if (!role) return

        void member.roles.remove(role)
    }

    public async handleRoleDelete(role: Role) {
        const data = await this.client.database.get(role.guild.id)
        const filteredRRs = data?.reactionRoles.filter((rr) => rr.roleId === role.id)
        if (!filteredRRs) return

        for (const rr of filteredRRs) {
            const message = this._findMessage(rr.messageId, rr.channelId)
            console.log(message)
        }
    }

    private async _removeAssociatedRoles(reaction: MessageReaction) {
        const data = await this.client.database.get(reaction.message.guild!.id)
        if (!data?.reactionRoles?.length) return

        const emojiId = reaction.emoji.id ?? reaction.emoji.name

        const filter = (rr: IReactionRoleOptions) => rr.emojiId === emojiId && rr.messageId === reaction.message.id
        const reactionRole = data?.reactionRoles.find(filter)
        if (!reactionRole) return

        const role = reaction.message.guild?.roles.resolve(reactionRole!.roleId)
        if (!role) return

        for (const user of reaction.users.cache.map((user) => user)) {
            const member = reaction.message.guild?.members.resolve(user)
            if (!member) continue

            await member.roles.remove(role)
        }
    }

    private async _getUserReactions(message: Message, user: User) {
        for (const reacted of message.reactions.cache.values()) {
            await reacted.users.fetch()
        }

        return message.reactions.cache.filter((rct) => rct.users.cache.has(user.id))
    }

    private async _findMessage(messageResolvable: MessageResolvable, channelResolvable: ChannelResolvable) {
        const channel = this.client.channels.resolve(channelResolvable)
        if (!channel) return null

        try {
            const message = await (channel as TextChannel).messages.fetch(messageResolvable)
            return message ?? null
        } catch {
            return null
        }
    }

    private _hasPermissionForRoleManagement(member: GuildMember) {
        return member.guild.members.me!.roles.highest.comparePositionTo(member.roles.highest) > 0
    }
}
