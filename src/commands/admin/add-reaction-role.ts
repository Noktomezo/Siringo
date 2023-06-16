import { ApplicationCommandOptionType } from 'discord-api-types/v10'
import type { Role, TextChannel } from 'discord.js'
import type { ICommand, ICommandBuildOptions, IReactionRoleOptions } from '../../types.js'

export const buildCommand = (buildOptions: ICommandBuildOptions): ICommand => {
    return {
        name: 'add-reaction-role',
        description: 'ADD_REACTION_ROLE_DESCRIPTION',
        category: 'admin',
        options: [
            {
                name: 'message-id',
                description: 'ADD_REACTION_ROLE_MESSAGE_OPTION',
                type: ApplicationCommandOptionType.String,
                required: true
            },
            {
                name: 'emoji',
                description: 'ADD_REACTION_ROLE_EMOJI_OPTION',
                type: ApplicationCommandOptionType.String,
                required: true
            },
            {
                name: 'role',
                description: 'ADD_REACTION_ROLE_ROLE_OPTION',
                type: ApplicationCommandOptionType.Role,
                required: true
            },
            {
                name: 'type',
                description: 'ADD_REACTION_ROLE_TYPE_OPTION',
                type: ApplicationCommandOptionType.Number,
                minValue: 1,
                maxValue: 2,
                choices: [
                    {
                        name: 'default',
                        value: 1
                    },
                    {
                        name: 'take-only-one',
                        value: 2
                    }
                ],
                required: false
            }
        ],
        run: async ({ client, interaction, translate, respond }) => {
            const messageIdString = interaction.options.getString('message-id')!
            const emojiString = interaction.options.getString('emoji')!
            const role = interaction.options.getRole('role') as Role
            const type = interaction.options.getNumber('type')
            const channel = interaction.channel as TextChannel
            const RRData = await client.database.get<IReactionRoleOptions[]>(`${interaction.guild!.id}.reactionRoles`)

            await interaction.deferReply()

            if (!/\d{18}/.test(messageIdString)) {
                await respond({
                    embeds: [
                        {
                            color: 0xff1f4f,
                            description: translate('INVALID_MESSAGE_ID').replace('{MESSAGE_ID}', messageIdString)
                        }
                    ],
                    ephemeral: true
                })
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
                    ],
                    ephemeral: true
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
                    ],
                    ephemeral: true
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
                    ],
                    ephemeral: true
                })
                return
            }

            if (RRData?.some((rr) => rr.emojiId === emojiId && rr.messageId === messageIdString)) {
                await respond({
                    embeds: [
                        {
                            color: 0xff1f4f,
                            description: translate('ADD_REACTION_ROLE_EXISTS')
                                .replace('{EMOJI}', emojiString)
                                .replace('{MESSAGE_ID}', messageIdString)
                        }
                    ],
                    ephemeral: true
                })
                return
            }

            if (type) {
                const existingType = RRData?.find((rr) => rr.messageId === messageIdString)?.type

                if (![1, 2].includes(type)) {
                    await respond({
                        embeds: [
                            {
                                color: 0xff1f4f,
                                description: translate('ADD_REACTION_ROLE_INVALID_TYPE')
                            }
                        ],
                        ephemeral: true
                    })

                    return
                } else if (existingType && existingType !== type) {
                    await respond({
                        embeds: [
                            {
                                color: 0xff1f4f,
                                description: translate('ADD_REACTION_ROLE_DIFFERENT_TYPE').replace(
                                    '{TYPE}',
                                    existingType.toString()
                                )
                            }
                        ],
                        ephemeral: true
                    })

                    return
                }
            }

            const messageURL = client.utils.getMessageURL(message)
            const successMessage = translate('ADD_REACTION_ROLE_SUCCESS')
                .replace('{EMOJI}', emojiString)
                .replace('{MESSAGE_URL}', messageURL)
                .replace('{ROLE}', role.toString())

            await client.reactionRoles.add(message, emojiString, role, type ?? 1)

            return respond({
                embeds: [
                    {
                        color: 0x39ff84,
                        description: successMessage
                    }
                ]
            })
        }
    }
}
