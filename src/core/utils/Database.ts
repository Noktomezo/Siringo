import type { GuildIdResolvable } from 'distube'
import { resolveGuildId } from 'distube'
import { QuickDB } from 'quick.db'
import { MongoDriver } from 'quick.db/MongoDriver'
import type { ICustomGuildSettings } from '../../typings/index.js'
import type { Siringo } from '../Siringo.js'

export class Database extends QuickDB<ICustomGuildSettings> {
    public defaults: ICustomGuildSettings

    public constructor(public client: Siringo, uri: string) {
        super({ driver: new MongoDriver(uri) })

        this.defaults = {
            locale: client.locales.defaultLocale,
            reactionRoles: [],
            privateChannels: []
        }
    }

    public async setDefaults(guildIdResolvable: GuildIdResolvable) {
        const guildId = resolveGuildId(guildIdResolvable)
        if (!guildId) return

        const guild = this.client.guilds.cache.get(guildId)
        if (!guild) return

        await this.set(guild.id, this.defaults)
    }

    public async update(guildIdResolvable?: GuildIdResolvable, value?: ICustomGuildSettings): Promise<void> {
        if (guildIdResolvable) {
            const guildId = resolveGuildId(guildIdResolvable)
            const guild = this.client.guilds.cache.get(guildId)
            if (!guild) return

            const guildData = (await this.get(guildId)) ?? this.defaults
            const repairedData = this._repairSettings(value ?? guildData)
            if (repairedData !== guildData) await this.set(guildId, repairedData)
        }

        const guildSettingsList = await this.all()
        if (!guildSettingsList.length) return

        for (const guildId of this.client.guilds.cache.keys()) {
            const guildData = guildSettingsList.find((gs) => gs.id === guildId)?.value ?? this.defaults
            const repairedData = this._repairSettings(guildData)
            if (repairedData !== guildData) await this.set(guildId, repairedData)
        }
    }

    private _repairSettings(settings?: Partial<ICustomGuildSettings>): ICustomGuildSettings {
        if (!settings) return this.defaults

        const defaultKeys = Object.keys(this.defaults)
        const customKeys = Object.keys(settings)

        const missingKeys = defaultKeys.filter((key) => !customKeys.includes(key))
        const additionalKeys = customKeys.filter((key) => !defaultKeys.includes(key))

        const repairedObj: any = { ...settings }

        for (const key of missingKeys) {
            repairedObj[key] = this.defaults[key as keyof ICustomGuildSettings]
        }

        for (const key of additionalKeys) {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete repairedObj[key]
        }

        return repairedObj
    }
}
