import { Collection, Events } from 'discord.js'
import type { GuildIdResolvable } from 'distube'
import { resolveGuildId } from 'distube'
import Keyv from 'keyv'
import { set, get, unset } from 'lodash-es'
import type { Siringo } from '../Siringo.js'

export class Database<V extends object> {
    private readonly _keyv: Keyv

    private readonly _cache: Collection<string, V>

    public constructor(public client: Siringo, private readonly url: string, public defaults: V) {
        this._keyv = new Keyv<V>(url)
        this._cache = new Collection<string, V>()
        this.client.once(Events.ClientReady, async () => this.update())
    }

    public async set(key: string, value: V, ttl?: number) {
        if (this._isDotNotationPath(key)) {
            const pathParts = this._fixDotNotationPath(key).split('.')
            const objectKey = pathParts.at(0) as string
            const objectValuePath = pathParts.slice(1).join('.')

            const data = this._cache.get(objectKey) ?? (await this._keyv.get(objectKey))
            set(data, objectValuePath, value)
            this._cache.set(objectKey, data)
            void this._keyv.set(objectKey, data, ttl)
            if (ttl && !Number.isNaN(ttl) && ttl >= 0) {
                setTimeout(() => {
                    this._cache.delete(objectKey)
                }, ttl)
            }
        }

        this._cache.set(key, value)
        void this._keyv.set(key, value, ttl)
        if (ttl && !Number.isNaN(ttl) && ttl >= 0) {
            setTimeout(() => {
                this._cache.delete(key)
            }, ttl)
        }
    }

    public async get<T = V>(key: string): Promise<T> {
        if (this._isDotNotationPath(key)) {
            const pathParts = this._fixDotNotationPath(key).split('.')
            const objectKey = pathParts.at(0) as string
            const objectValuePath = pathParts.slice(1).join('.')

            const data = this._cache.get(objectKey) ?? (await this._keyv.get(objectKey))
            return get(data, objectValuePath)
        }

        return this._cache.get(key) ?? (await this._keyv.get(key))
    }

    public async getAll() {
        if (this._cache.size) {
            return this._cache
        } else {
            const databaseCollection = new Collection<string, V>()
            for await (const [guildId, guildData] of this._keyv.iterator()) {
                databaseCollection.set(guildId, guildData)
            }

            return databaseCollection
        }
    }

    public async setDefaults(guildIdResolvable: GuildIdResolvable) {
        const guildId = resolveGuildId(guildIdResolvable)
        if (!guildId) return

        const guild = this.client.guilds.cache.get(guildId)
        if (guild) return this.set(guild.id, this.defaults)
    }

    public async update(): Promise<void> {
        const updatingMessage = this.client.locales.default!.get('DATABASE_UPDATING')
        const updatedMessage = this.client.locales.default!.get('DATABASE_UPDATED')
        this.client.logger.info(updatingMessage)

        const allDatabaseGuildSettings = await this.getAll()

        for (const guild of this.client.guilds.cache.values()) {
            if (allDatabaseGuildSettings.has(guild.id)) {
                const currentSettings = allDatabaseGuildSettings.get(guild.id)
                const repairedSettings = this._repairSettings(currentSettings)
                if (currentSettings !== repairedSettings) void this.set(guild.id, repairedSettings)
            } else {
                void this.set(guild.id, this.defaults)
            }
        }

        this.client.logger.info(updatedMessage)
    }

    public async delete(guildIdResolvable: GuildIdResolvable) {
        const guildId = resolveGuildId(guildIdResolvable)
        if (!this.client.guilds.cache.has(guildId)) return

        this._cache.delete(guildId)
        return this._keyv.delete(guildId)
    }

    private _isDotNotationPath(path: string): boolean {
        const fixedPath = this._fixDotNotationPath(path)
        const pathSegments = fixedPath.split('.')
        if (pathSegments.length <= 1) return false
        return pathSegments.every((segment) => /^[A-Z_a-z]\w*$/.test(segment))
    }

    private _fixDotNotationPath(path: string): string {
        return path.startsWith('.') ? path.slice(0, 1) : path.endsWith('.') ? path.slice(0, -1) : path
    }

    private _repairSettings(settings?: Partial<V>): V {
        if (!settings) return this.defaults

        const defaultKeys = Object.keys(this.defaults)
        const customKeys = Object.keys(settings)

        const missingKeys = defaultKeys.filter((key) => !customKeys.includes(key))
        const additionalKeys = customKeys.filter((key) => !defaultKeys.includes(key))

        const repairedObj: any = { ...settings }

        for (const key of missingKeys) {
            repairedObj[key] = this.defaults[key as keyof V]
        }

        for (const key of additionalKeys) {
            unset(repairedObj, key)
        }

        return repairedObj
    }
}
