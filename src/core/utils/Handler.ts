import { existsSync, lstatSync, readdirSync, statSync } from 'node:fs'
import { extname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { Collection } from 'discord.js'
import type { ICommand, IDatabaseGuildSettings, TCommandBuilder, TEventFunction } from '../../types.js'
import type { Siringo } from '../Siringo.js'

export class Handler {
    public constructor(public client: Siringo) {}

    public async handleCommands(commandsFolder: string) {
        if (!this._isFolderValid(commandsFolder)) return

        for (const categoryFolder of readdirSync(commandsFolder)) {
            const categoryFolderPath = join(commandsFolder, categoryFolder)
            if (!this._isFolderValid(categoryFolderPath)) continue

            for (const commandFile of readdirSync(categoryFolderPath)) {
                const commandFilePath = join(commandsFolder, categoryFolder, commandFile)
                if (!this._isFileValid(commandFilePath)) continue

                const commandFileURL = pathToFileURL(commandFilePath).toString()
                const { buildCommand }: { buildCommand: TCommandBuilder } = await import(commandFileURL)
                const command = buildCommand({ client: this.client })
                if (!this._isCommandValid(command)) return

                const commandName = command.name ?? commandFile.split('.')[0]

                this.client.commands.set(commandName, command)
            }
        }

        for (const localeCode of this.client.locales.allowed) {
            const localizedCommands = new Collection<string, ICommand>()
            for (const command of this.client.commands.values()) {
                const locale = this.client.locales.getByCode(localeCode)
                const newCommand: ICommand = {
                    ...command,
                    description: locale.get(command.description) as string,
                    options:
                        command.options?.map((opt) => ({
                            ...opt,
                            description: locale.get(opt.description) as string
                        })) ?? []
                }
                localizedCommands.set(command.name, newCommand)
            }

            this.client.localizedCommands.set(localeCode, localizedCommands)
        }
    }

    public async updateGuildCommands() {
        const allDatabaseGuildSettings = await this.client.database.getAll()

        for (const guild of this.client.guilds.cache.values()) {
            const settings = allDatabaseGuildSettings.get(guild.id) as IDatabaseGuildSettings
            const guildCommands = this.client.localizedCommands.get(settings.locale)
            void guild.commands.set([...guildCommands!.values()])
        }
    }

    public async handleEvents(eventsFolder: string, eventManager: any) {
        if (!this._isFolderValid(eventsFolder)) return

        for (const eventFile of readdirSync(eventsFolder)) {
            const eventFilePath = join(eventsFolder, eventFile)
            if (!this._isFileValid(eventFilePath)) continue

            const eventFileURL = pathToFileURL(eventFilePath).toString()
            const { event }: { event: TEventFunction } = await import(eventFileURL)
            const eventName = eventFile.split('.')[0]
            const eventOnce = eventFile.split('.').at(-2) === 'once'

            if (eventOnce) eventManager.once(eventName, async (...args: unknown[]) => event(this.client, ...args))
            else eventManager.on(eventName, async (...args: unknown[]) => event(this.client, ...args))
        }
    }

    private _isFolderValid(folderPath: string) {
        return (
            Boolean(folderPath) &&
            existsSync(folderPath) &&
            lstatSync(folderPath).isDirectory() &&
            readdirSync(folderPath).length > 0
        )
    }

    private _isFileValid(filePath: string) {
        return (
            Boolean(filePath) &&
            existsSync(filePath) &&
            ['.js', '.ts'].includes(extname(filePath)) &&
            statSync(filePath).size > 0
        )
    }

    private _isCommandValid(command: ICommand) {
        return (
            Boolean(command) &&
            ['name', 'description', 'run'].every((_) => Object.keys(command).includes(_)) &&
            typeof command.run === 'function'
        )
    }
}
