import type { Message, MessageReaction, User } from 'discord.js'
import type { Siringo } from '../../core/Siringo.js'

export const event = async (client: Siringo, message: Message<true>) => {
    if (!message.guild || message.author?.bot) return

    return client.reactionRoles.handleMessageDelete(message)
}
