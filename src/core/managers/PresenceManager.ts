import type { ActivitiesOptions, PresenceData, PresenceStatusData } from 'discord.js'
import type { Siringo } from '../Siringo.js'

export class PresenceManager {
    private readonly presences: Omit<PresenceData, 'shardId'>[]

    public constructor(public client: Siringo) {
        this.presences = []
    }

    public add(status: PresenceStatusData, activity: ActivitiesOptions) {
        return this.presences.push({ activities: [activity], status })
    }

    public async update(presence: PresenceData) {
        const isActivityValid = presence?.activities?.length && presence.activities[0].name
        if (!isActivityValid) return

        const guilds = await this.client.guilds.fetch()
        const guildDeclensions = this.client.locales.default!.get('DECLENSION_GUILDS')!.split(':')
        const guildDeclension = this.client.utils.declension(guilds.size, guildDeclensions)
        const name = presence.activities![0].name!.replace('{GUILDS}', `${guilds.size.toString()} ${guildDeclension}`)

        return this.client.user.presence.set({ ...presence, activities: [{ name }] })
    }

    public async setUpdateLoop(ms: number = 5_000) {
        if (!this.presences.length) return
        await this.update(this.presences[0])

        if (this.presences.length < 2) return

        let index = 1
        const interval = setInterval(async () => {
            if (index === this.presences.length) index = 0

            const presence = this.presences.at(index)

            if (!presence) clearInterval(interval)

            await this.update(presence!)

            index++
        }, ms)
    }
}
