import { ApplicationCommandOptionType } from 'discord-api-types/v10'
import type { Role, TextChannel } from 'discord.js'
import type { ICommand, ICommandBuildOptions } from '../../typings/index.js'

export const buildCommand = (buildOptions: ICommandBuildOptions): ICommand => {
    return {
        name: 'remove-reaction-role',
        category: 'admin',
        description: 'RM_REACTION_ROLE_DESCRIPTION',
        options: [
            {
                name: 'message-id',
                description: 'RM_REACTION_ROLE_MESSAGE_OPTION',
                type: ApplicationCommandOptionType.String,
                required: true
            },
            {
                name: 'emoji',
                description: 'RM_REACTION_ROLE_EMOJI_OPTION',
                type: ApplicationCommandOptionType.String,
                required: true
            }
        ],
        run: async ({ client, interaction, translate, respond }) => {
            const messageIdString = interaction.options.getString('message-id')!
            const emojiString = interaction.options.getString('emoji')!
            const channel = interaction.channel as TextChannel
            const data = await client.database.get(interaction.guild!.id)

            await interaction.deferReply()

            if (!/\d{18}/.test(messageIdString)) {
                await respond({
                    embeds: [
                        {
                            color: 0xff1f4f,
                            description: translate('INVALID_MESSAGE_ID').replace('{MESSAGE_ID}', messageIdString)
                        }
                    ]
                })

                return
            }

            await channel.messages.fetch()
            const message = channel.messages.resolve(messageIdString)

            if (!message) {
                await respond({
                    embeds: [
                        {
                            color: 0xff1f4f,
                            description: translate('MESSAGE_NOT_FOUND').replace('{MESSAGE_ID}', messageIdString)
                        }
                    ]
                })
                return
            }

            const reactionRolesOnMessage = data?.reactionRoles.filter((rr) => rr.messageId === message.id)
            if (!reactionRolesOnMessage?.length) {
                await respond({
                    embeds: [
                        {
                            color: 0xff1f4f,
                            description: translate('RM_REACTION_ROLE_NO_REACTION_ROLES')
                        }
                    ]
                })

                return
            }

            if (!client.utils.isEmoji(emojiString)) {
                await respond({
                    embeds: [
                        {
                            color: 0xff1f4f,
                            description: translate('INVALID_EMOJI').replace('{EMOJI}', emojiString)
                        }
                    ]
                })
                return
            }

            const emojiId = client.utils.resolveEmojiId(emojiString)!

            if (client.utils.isGuildEmoji(emojiString) && !interaction.guild!.emojis.cache.has(emojiId)) {
                await respond({
                    embeds: [
                        {
                            color: 0xff1f4f,
                            description: translate('EMOJI_NOT_FOUND').replace('{EMOJI}', emojiString)
                        }
                    ]
                })
                return
            }

            const reactionRoleWithEmoji = reactionRolesOnMessage.find((rr) => rr.emojiId === emojiString)
            if (!reactionRoleWithEmoji) {
                await respond({
                    embeds: [
                        {
                            color: 0xff1f4f,
                            description: translate('RM_REACTION_ROLE_NO_SAME_REACTION').replace('{EMOJI}', emojiString)
                        }
                    ]
                })
                return
            }

            await client.reactionRoles.remove(message, emojiString)

            await respond({
                embeds: [
                    {
                        color: 0x39ff84,
                        description: translate('RM_REACTION_ROLE_SUCCESS').replace('{EMOJI}', emojiString)
                    }
                ]
            })
        }
    }
}
