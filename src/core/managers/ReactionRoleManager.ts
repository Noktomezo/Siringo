import type { Message, MessageReaction, Role, RoleResolvable, Snowflake, TextChannel, User } from 'discord.js'
import { Collection, Events } from 'discord.js'
import type { IDatabaseGuildSettings, IReactionRoleOptions } from '../../types.js'
import type { Siringo } from '../Siringo.js'

export class ReactionRoleManager {
    private readonly _reactionRoles: Collection<Snowflake, IReactionRoleOptions[]>

    private readonly _messagesFetched: Collection<Snowflake, boolean>

    public constructor(public client: Siringo) {
        this._reactionRoles = new Collection<string, IReactionRoleOptions[]>()
        this._messagesFetched = new Collection<Snowflake, boolean>()
        this.client.once(Events.ClientReady, () => void this.update())
    }

    public async update() {
        const allGuildSettings = await this.client.database.getAll()
        for (const guild of this.client.guilds.cache.values()) {
            const guildSettings = allGuildSettings.get(guild.id) as IDatabaseGuildSettings
            this._reactionRoles.set(guild.id, guildSettings.reactionRoles)
        }
    }

    public async handleMessageReactionAdd(reaction: MessageReaction, user: User): Promise<void> {
        const data = await this._parseReactionRoleData(reaction, user)
        if (data) void data.member.roles.add(data.role)
    }

    public async handleMessageReactionRemove(reaction: MessageReaction, user: User) {
        const data = await this._parseReactionRoleData(reaction, user)
        if (data) void data.member.roles.remove(data.role)
    }

    public async handleMessageDelete(message: Message<true>) {
        const guildReactionRoles = this._reactionRoles.get(message.guild.id)
        if (!guildReactionRoles?.length) return

        const messageRRs = guildReactionRoles.filter((rr) => rr.messageId === message.id)
        if (!messageRRs.length) return

        const roles = messageRRs.map((mrr) => message.guild.roles.cache.get(mrr.roleId)).filter(Boolean)
        if (!roles.length) return

        const members = message.guild.members.cache.filter((mem) => roles.some((rtr) => mem.roles.cache.has(rtr.id)))
        if (!members.size) return

        for (const member of members.values()) {
            void member.roles.remove(roles)
        }

        const newGuildReactionRoles = guildReactionRoles.filter((rr) => rr.messageId !== message.id)
        this._reactionRoles.set(message.guild.id, newGuildReactionRoles)
        void this.client.database.set(message.guild.id, {
            ...(await this.client.database.get(message.guild.id)),
            reactionRoles: newGuildReactionRoles
        })
    }

    public async add(message: Message, emoji: string, role: Role, type: number) {}

    public async remove(message: Message, emoji: string) {}

    private async _parseReactionRoleData(reaction: MessageReaction, user: User) {
        const emojiResolver = reaction.emoji.id ?? reaction.emoji.name ?? ''
        const emojiId = this.client.utils.resolveEmojiId(emojiResolver)
        if (!emojiId) return null

        const guildRRs = this._reactionRoles.get(reaction.message.guild!.id)
        if (!guildRRs?.length) return null

        const messageRR = guildRRs.find((rr) => rr.messageId === reaction.message.id && rr.emojiId === emojiId)
        if (!messageRR) return null

        const reactionChannel = this.client.channels.cache.get(messageRR.channelId) as TextChannel
        if (!reactionChannel?.guild) return null

        if (reaction.message.partial) await reaction.message.fetch()

        const roleToInteract = reactionChannel.guild.roles.cache.get(messageRR.roleId)
        if (!roleToInteract) return null

        const memberToInteract = reactionChannel.guild.members.cache.get(user.id)
        if (!memberToInteract) return null

        return {
            message: reaction.message,
            channel: reactionChannel,
            role: roleToInteract,
            member: memberToInteract
        }
    }
}
