import type { Guild } from 'discord.js'
import type { Siringo } from '../../core/Siringo.js'

export const event = async (client: Siringo, guild: Guild) => {
    return client.database.setDefaults(guild)
}
