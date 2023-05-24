import type { MessageReaction, User } from 'discord.js'
import type { Siringo } from '../../core/Siringo.js'

export const event = async (client: Siringo, reaction: MessageReaction, user: User) => {
    return client.reactionRoles.handleMessageReactionAdd(reaction, user)
}
