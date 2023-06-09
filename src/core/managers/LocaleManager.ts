import { readFileSync, existsSync, lstatSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { Collection, Locale } from 'discord.js'
import type { Snowflake } from 'discord.js'
import type { GuildIdResolvable } from 'distube'
import { resolveGuildId } from 'distube'
import type { IDatabaseGuildSettings, TLocale, TMappedLocale } from '../../types.js'
import type { Siringo } from '../Siringo.js'

export class LocaleManager {
    private readonly _locales: Collection<string, TMappedLocale>

    private readonly _cache: Collection<Snowflake, TMappedLocale>

    private _default: TMappedLocale | undefined

    public constructor(public client: Siringo, public defaultLocale: Locale = Locale.EnglishUS) {
        this._locales = new Collection<string, TMappedLocale>()
        this._cache = new Collection<Snowflake, TMappedLocale>()
    }

    public get allowed() {
        return [...this._locales.keys()]
    }

    public get default() {
        return this._default as TMappedLocale
    }

    public async load(folder: string) {
        if (!this._isFolderValid(folder)) return

        for (const localeFile of readdirSync(folder)) {
            if (!this._isLocaleFileNameValid(localeFile)) continue

            const localeFilePath = join(folder, localeFile)
            if (this._isFileEmptyOrInvalidJSON(localeFilePath)) continue
            const locale = this.client.utils.importJSON<TLocale>(localeFilePath)
            const mappedLocale = this._jsonToMap(locale)
            this._locales.set(localeFile.split('.')[0], mappedLocale)
        }

        this._default = this._locales.get(this.defaultLocale)

        const allDatabaseGuildSettings = await this.client.database.getAll()
        for (const guild of this.client.guilds.cache.values()) {
            const guildSettings = allDatabaseGuildSettings.get(guild.id) as IDatabaseGuildSettings
            const guildLocale = this._locales.get(guildSettings.locale) as TMappedLocale
            this._cache.set(guild.id, guildLocale)
        }
    }

    public get(guildIdResolvable: GuildIdResolvable) {
        const guildId = resolveGuildId(guildIdResolvable)
        if (!this.client.guilds.cache.has(guildId)) return this.default

        return this._cache.get(guildId) ?? this.default
    }

    public getByCode(localeCode: string) {
        return this._locales.get(localeCode) as TMappedLocale
    }

    private _isFileEmptyOrInvalidJSON(filePath: string) {
        try {
            const fileContents = readFileSync(filePath, 'utf8')
            if (fileContents.trim() === '') {
                return true
            }

            JSON.parse(fileContents)
            return false
        } catch {
            return true
        }
    }

    private _isFolderValid(folder: string) {
        return this._isFolder(folder) && readdirSync(folder).length > 0
    }

    private _jsonToMap(json: TLocale) {
        const map = new Map<string, string>()

        // Iterate over the properties of the JSON object
        for (const key in json) {
            if (Object.hasOwn(json, key)) {
                const value = json[key]
                map.set(key, value)
            }
        }

        return map
    }

    private _isFolder(folder: string) {
        return existsSync(folder) && lstatSync(folder).isDirectory()
    }

    private _isLocaleFileNameValid(name: string) {
        return /^(.+)\.json$/.test(name)
    }
}
