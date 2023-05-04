import { Siringo } from '../Siringo.js'
import { TaskQueue } from '../utils/TaskQueue.js'
import {
    ChannelType,
    Collection,
    type EmojiIdentifierResolvable,
    type GuildBasedChannel,
    type GuildEmoji,
    type GuildMember,
    type Message,
    type MessageReaction,
    type MessageResolvable,
    type Role,
    type RoleResolvable,
    type Snowflake,
    type TextChannel,
    type User
} from 'discord.js'

export class ReactionRoleManager {
    private timeouts: Collection<Snowflake, NodeJS.Timeout>

    constructor(public client: Siringo) {
        this.timeouts = new Collection<Snowflake, NodeJS.Timeout>()
    }

    async add(message: MessageResolvable, emoji: EmojiIdentifierResolvable, role: RoleResolvable, type: number = 1) {
        const foundMessage = await this._findMessage(message)
        if (!foundMessage) return

        const emojiId = this.client.emojis.resolveIdentifier(emoji)
        if (!emojiId) return

        const roleId = foundMessage.guild.roles.resolve(role)?.id
        if (!roleId) return

        const data = await this.client.database.get(foundMessage.guild.id)
        if (!data?.reactionRoles?.length) return
        data!.reactionRoles.push({ messageId: foundMessage.id, roleId, emojiId, type })

        await foundMessage.react(emojiId)

        return this.client.database.set(foundMessage.guild.id, data)
    }

    async remove(message: MessageResolvable, emoji: EmojiIdentifierResolvable) {
        const foundMessage = await this._findMessage(message)
        if (!foundMessage) return

        const emojiId = this.client.emojis.resolveIdentifier(emoji)
        if (!emojiId) return

        const data = await this.client.database.get(foundMessage.guild.id)
        if (!data?.reactionRoles?.length) return

        const filter = (r: Siringo.ReactionRoleOptions) => r.messageId != foundMessage.id && r.emojiId != emojiId
        data.reactionRoles = data.reactionRoles.filter(filter)

        const reaction = foundMessage.reactions.cache.get(emojiId)
        if (!reaction) return

        await this._removeAssociatedRoles(reaction)

        return this.client.database.set(foundMessage.guild.id, data)
    }

    async handleEmojiDelete(emoji: GuildEmoji) {
        const data = await this.client.database.get(emoji.guild.id)
        if (!data?.reactionRoles?.length) return

        const reactionRoles = data.reactionRoles.filter((r) => r.emojiId == emoji.identifier)
        for (const reactionRole of reactionRoles) {
            const message = await this._findMessage(reactionRole.messageId)
            if (message) await this.remove(message, reactionRole.emojiId)
        }
    }

    handleMessageDelete(message: Message<true>) {
        const messageProcessingQueue = new TaskQueue(500)
        const messageProcessing = async () => {
            const data = await this.client.database.get(message.guild.id)
            if (!data?.reactionRoles?.length) return

            data.reactionRoles = data.reactionRoles.filter((r) => r.messageId != message.id)
            return await this.client.database.set(message.guild.id, data)
        }

        return messageProcessingQueue.add(messageProcessing)
    }

    async handleMessageReactionAdd(reaction: MessageReaction, user: User) {
        const member = reaction.message.guild?.members.resolve(user)

        const data = await this.client.database.get(member!.guild.id)
        if (!data?.reactionRoles.length) return
    }

    handleMessageReactionRemove(reaction: MessageReaction, user: User) {}

    handleRoleDelete(role: Role) {}

    private async _removeAssociatedRoles(reaction: MessageReaction) {
        const data = await this.client.database.get(reaction.message.guild!.id)
        if (!data?.reactionRoles?.length) return

        const emojiId = this.client.emojis.resolveIdentifier(reaction.emoji)

        const filter = (r: Siringo.ReactionRoleOptions) => r.emojiId == emojiId && r.messageId == reaction.message.id
        const reactionRole = data?.reactionRoles.find(filter)

        const role = reaction.message.guild?.roles.resolve(reactionRole!.roleId)
        if (!role) return

        for (const user of reaction.users.cache.map((u) => u)) {
            const member = reaction.message.guild?.members.resolve(user)
            if (member) member.roles.remove(role)
        }
    }

    private async _findMessage(message: MessageResolvable) {
        await this.client.guilds.fetch()

        const filter = (c: GuildBasedChannel) => c.type == ChannelType.GuildText

        for (const guild of this.client.guilds.cache.map((g) => g)) {
            for (const channel of guild.channels.cache.filter(filter).map((c) => c)) {
                const msg = (channel as TextChannel).messages.resolve(message)
                if (msg) return msg
            }
        }

        return null
    }

    private _getPickedReactionRoles(rolesToCompare: RoleResolvable[], member: GuildMember) {
        const pickedReactionRoles = []

        for (const roleToCompare of rolesToCompare) {
            const resolvedRole = member.guild.roles.resolve(roleToCompare)
            if (!resolvedRole) continue

            if ([...member.roles.cache.values()].includes(resolvedRole)) pickedReactionRoles.push(resolvedRole)
        }

        return pickedReactionRoles
    }
}
