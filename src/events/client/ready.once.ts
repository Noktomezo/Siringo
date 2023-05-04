import { Siringo } from '../../core/Siringo.js'
import { ActivityType } from 'discord-api-types/v10'

export const event = async (client: Siringo) => {
    await client.locales.updateGuildLocales()

    const locale = client.locales.default!
    await client.logger.info(locale.events.ready.loggedIn.replace('{BOT_TAG}', client.user.tag))

    client.presences.add('dnd', { name: '/help', type: ActivityType.Watching })
    client.presences.add('dnd', { name: '/play', type: ActivityType.Listening })
    client.presences.add('dnd', { name: '{GUILDS}', type: ActivityType.Listening })

    await client.presences.setUpdateLoop(5000)
}
