import { Collection, GuildResolvable, type Snowflake } from 'discord.js'
import { existsSync, lstatSync, readdirSync } from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'
import { Commands, Locale } from '../../typings/locale.js'
import { Siringo } from '../Siringo.js'

export class LocaleManager {
    public every: Collection<string, Locale>
    public cache: Collection<Snowflake, Locale>
    public default: Locale | null

    constructor(public client: Siringo, public folder: string, public defaultLocaleCode: string = 'en-US') {
        this.cache = new Collection<Snowflake, Locale>()
        this.every = new Collection<string, Locale>()
        this.default = null
    }

    async load() {
        if (!this._isFolderValid()) return
        for (const loc of readdirSync(this.folder)) {
            if (!loc.endsWith('.json') || !this._isLocaleFormatValid(loc)) continue
            const localePath = pathToFileURL(path.join(this.folder, loc)).toString()
            const { default: locale } = await import(localePath, { assert: { type: 'json' } })
            this.every.set(loc.split('.')[0], locale)
        }

        await this.updateDefaultLocale()
    }

    async updateGuildLocales(guildResolvable?: GuildResolvable) {
        const guild = this.client.guilds.resolve(guildResolvable ?? '0')
        if (guild) {
            const guildData = await this.client.database.get(guild.id)
            const guildLocaleCode = guildData?.locale ?? 'en-US'
            const guildLocale = this.every.get(guildLocaleCode) ?? this.default
            this.cache.set(guild.id, guildLocale!)
        } else {
            await this.client.guilds.fetch()
            const guildsData = await this.client.database.all()

            for (const guild of this.client.guilds.cache.map((g) => g)) {
                const guildCustomLocale = guildsData.get(guild.id)?.locale
                const guildLocaleCode = guildCustomLocale ?? 'en-US'
                const guildLocale = this.every.get(guildLocaleCode) ?? this.default
                this.cache.set(guild.id, guildLocale!)
            }
        }
    }

    async updateGuildCommandLocale(guildResolvable: GuildResolvable) {
        const guild = this.client.guilds.resolve(guildResolvable ?? '0')
        if (!guild || guild.commands.cache.size == 0) return
        const guildLocale = this.cache.get(guild.id) ?? this.every.get('en-US')
        for (const guildCommand of guild.commands.cache.map((c) => c)) {
            const commandLocaleData = guildLocale!.commands[guildCommand.name as keyof Commands]
            await guild.commands.edit(guildCommand, { description: commandLocaleData.description })
        }
    }

    updateDefaultLocale() {
        this.default = this.every.get(this.defaultLocaleCode)!
    }

    private _isFolderValid() {
        return existsSync(this.folder) && lstatSync(this.folder).isDirectory() && readdirSync(this.folder).length > 0
    }

    private _isLocaleFormatValid(code: string) {
        return /[a-z]{2}(-[A-Z]{2})?\.json/.test(code)
    }
}
