import { Siringo } from '../Siringo.js'
import { ActivitiesOptions, PresenceData, PresenceStatusData } from 'discord.js'

export class PresenceManager {
    private presences: Omit<PresenceData, 'shardId'>[]

    constructor(public client: Siringo) {
        this.presences = []
    }

    add(status: PresenceStatusData, activity: ActivitiesOptions) {
        return this.presences.push({ activities: [activity], status })
    }

    async update(presence: PresenceData) {
        const isActivityValid = presence?.activities?.length && presence.activities[0].name
        if (!isActivityValid) return

        const guilds = await this.client.guilds.fetch()
        const guildDeclensions = this.client.locales.default!.declensions.guild
        const guildDeclension = this.client.utils.declension(guilds.size, guildDeclensions)
        const name = presence.activities![0]!.name!.replace('{GUILDS}', `${guilds.size.toString()} ${guildDeclension}`)

        return this.client.user.presence.set({ ...presence, activities: [{ name }] })
    }

    setUpdateLoop(ms: number) {
        if (!this.presences.length) return
        this.update(this.presences[0])

        if (this.presences.length < 2) return
        if (ms < 5000) ms = 5000

        let i = 1
        const interval = setInterval(async () => {
            if (i == this.presences.length) i = 0

            const presence = this.presences.at(i)

            if (!presence) clearInterval(interval)

            this.update(presence!)

            i++
        }, ms)
    }
}
