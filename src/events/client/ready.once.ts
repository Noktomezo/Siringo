import { ActivityType } from 'discord-api-types/v10'
import type { Siringo } from '../../core/Siringo.js'

export const event = async (client: Siringo) => {
    await client.database.update()
    await client.locales.updateGuildLocales()

    const loggedInMessage = client.locales.get('LOGGED_IN', client.locales.defaultLocale)
    client.logger.info(loggedInMessage.replace('{BOT_TAG}', client.user.tag))

    client.presences.add('dnd', { name: '/help', type: ActivityType.Watching })
    client.presences.add('dnd', { name: '/play', type: ActivityType.Listening })
    client.presences.add('dnd', { name: '{GUILDS}', type: ActivityType.Listening })

    await client.presences.setUpdateLoop(5_000)
}
