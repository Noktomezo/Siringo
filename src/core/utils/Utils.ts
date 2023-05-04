import { Siringo } from '../Siringo.js'

export class Utils {
    constructor(public client: Siringo) {}

    sleep(ms: number): Promise<NodeJS.Timeout> {
        return new Promise((r) => setTimeout(r, ms))
    }

    declension(count: number, words: string[]) {
        if (!count || count < 0 || !words.length) return ''

        count = Math.abs(count) % 100
        const counted = count % 10
        const count10to20 = count % 100

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
                if (count === 1) {
                    return words[0]
                } else if (count >= 2 && count <= 4) {
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

    isEmoji(emoji: string) {
        const RE_DISCORD_EMOJI = /(<a?)?:\w+:(\d{18}>)?/
        const RE_UNICODE_EMOJI = new RegExp(
            '(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])'
        )

        return RE_UNICODE_EMOJI.test(emoji) || RE_DISCORD_EMOJI.test(emoji)
    }

    getCurrentTime() {
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
        return new Intl.DateTimeFormat('ru-RU', options).format(now)
    }
}
