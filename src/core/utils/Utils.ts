import { readFileSync } from 'node:fs'
import type { Interaction, InteractionReplyOptions, Message } from 'discord.js'
import type { Siringo } from '../Siringo.js'

export class Utils {
    public constructor(public client: Siringo) {}

    public async sleep(ms: number) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms)
        })
    }

    public declension(count: number, words: string[]) {
        if (!count || count < 0 || !words.length) return ''

        const number = Math.abs(count) % 100
        const counted = number % 10
        const count10to20 = number % 100

        switch (words.length) {
            // Russian, Polish, English and others with 3 declensions
            case 3: {
                if (count10to20 >= 10 && count10to20 <= 20) {
                    return words[2]
                } else if (counted === 1) {
                    return words[0]
                } else if (counted >= 2 && counted <= 4) {
                    return words[1]
                } else {
                    return words[2]
                }
            }

            // Czech, Slovenian and Lithuanian declension
            case 4: {
                if (number === 1) {
                    return words[0]
                } else if (number >= 2 && number <= 4) {
                    return words[1]
                } else if (count10to20 >= 10 && count10to20 <= 20) {
                    return words[2]
                } else {
                    return words[3]
                }
            }

            default:
                return words[0]
        }
    }

    public getMessageURL(message: Message<true>) {
        return `https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id}`
    }

    public isDefaultEmoji(emoji: string): boolean {
        return /\u00A9|\u00AE|[\u2000-\u3300]|\uD83C[\uD000-\uDFFF]|\uD83D[\uD000-\uDFFF]|\uD83E[\uD000-\uDFFF]/.test(
            emoji
        )
    }

    public isGuildEmoji(emoji: string): boolean {
        return /<a?:\w+:\d+>/.test(emoji)
    }

    public isEmoji(emoji: string) {
        return this.isDefaultEmoji(emoji) || this.isGuildEmoji(emoji)
    }

    public resolveEmojiId(emoji: string): string | null {
        if (this.isDefaultEmoji(emoji)) return emoji
        if (this.isGuildEmoji(emoji)) return emoji.replace(/<a?:\w+:(\d+)>/, '$1')
        return null
    }

    public getCurrentTime() {
        const now = new Date()
        const options: Intl.DateTimeFormatOptions = {
            timeZone: 'Europe/Moscow',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
        }

        return new Intl.DateTimeFormat(this.client.locales.defaultLocale, options).format(now)
    }

    public getRespondFunction(interaction: Interaction) {
        return async (data: InteractionReplyOptions, timeout?: number): Promise<void> => {
            if (!interaction.isAutocomplete() && interaction.deferred) {
                await interaction.editReply(data).catch((error) => this.client.logger.error(error))
                return
            }

            if (interaction.isRepliable()) {
                await interaction.reply(data).catch((error) => this.client.logger.error(error))

                if (timeout)
                    setTimeout(async () => {
                        await interaction.deleteReply().catch((error) => this.client.logger.error(error))
                    }, timeout)
            }
        }
    }

    public importJSON<T>(filePath: string): T {
        const fileContents = readFileSync(filePath, 'utf8')
        return JSON.parse(fileContents) as T
    }
}
