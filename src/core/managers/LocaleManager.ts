import { existsSync, lstatSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import type { Snowflake } from 'discord.js'
import { Collection } from 'discord.js'
import type { GuildIdResolvable } from 'distube'
import { resolveGuildId } from 'distube'
import type { TLocale } from '../../typings/index.js'
import type { Siringo } from '../Siringo.js'

export class LocaleManager {
    private readonly locales: Collection<string, TLocale>

    private readonly cache: Collection<Snowflake, TLocale>

    public constructor(public client: Siringo, public defaultLocale: string) {
        this.locales = new Collection<string, TLocale>()
        this.cache = new Collection<Snowflake, TLocale>()
    }

    public async load(localeFolderPath: string) {
        if (!this._isFolderValid(localeFolderPath)) return

        for (const localeFile of readdirSync(localeFolderPath)) {
            if (!this._isLocaleFileNameValid(localeFile)) return

            const localeFileURL = join(localeFolderPath, localeFile)
            const locale = await this.client.utils.importJsonFile<TLocale>(localeFileURL)

            this.locales.set(localeFile.split('.')[0], locale)
        }
    }

    public async updateGuildLocales() {
        const guildsAllData = await this.client.database.all()
        if (!guildsAllData.length) return

        for (const [guildId] of this.client.guilds.cache) {
            const DBGuildData = guildsAllData.find((gld) => gld.id === guildId)?.value
            if (!DBGuildData) continue

            const localeCode = DBGuildData.locale ?? 'en-US'
            const locale = this.locales.get(localeCode) as TLocale

            this.cache.set(guildId, locale)
            await this.updateCommandsLocale(guildId)
        }
    }

    public async updateCommandsLocale(guildIdResolvable: GuildIdResolvable) {
        const guildId = resolveGuildId(guildIdResolvable)
        if (!guildId) return
        const guild = this.client.guilds.cache.get(guildId)
        if (!guild?.commands.cache.size) return

        for (const command of guild.commands.cache.values()) {
            await guild.commands.edit(command, {
                description: this.get(command.description, guildId),
                options: command.options.map((opt) => ({
                    ...opt,
                    description: this.get(opt.description, guildId)
                }))
            })
        }
    }

    public get(localeKey: string, resolver: GuildIdResolvable | string): string {
        if (typeof resolver === 'string' && this._isLocaleCodeValid(resolver)) {
            const locale = this.locales.get(resolver) as TLocale
            return locale[localeKey] ?? localeKey
        } else {
            const guildId = resolveGuildId(resolver)
            if (!guildId) return 'UNKNOWN'

            const locale = this.cache.get(guildId) as TLocale
            return locale[localeKey] ?? localeKey
        }
    }

    private _isFolderValid(folder: string) {
        return existsSync(folder) && lstatSync(folder).isDirectory() && readdirSync(folder).length > 0
    }

    private _isLocaleCodeValid(code: string) {
        return /[a-z]{2}(?:-[A-Z]{2})?/.test(code)
    }

    private _isLocaleFileNameValid(name: string) {
        return /[a-z]{2}(?:-[A-Z]{2})?\.json/.test(name)
    }
}
