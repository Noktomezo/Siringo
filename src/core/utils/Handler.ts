import { existsSync, lstatSync, readdirSync } from 'node:fs'
import { extname, join } from 'node:path'
import { ICommand, ICustomGuildOptions, TCommandBuilder, TEvent } from '../../typings/index.js'

import { statSync } from 'fs'
import { pathToFileURL } from 'url'
import { Siringo } from '../Siringo.js'
import { Database } from './Database.js'

export class Handler {
    constructor(public client: Siringo) {}

    async handleCommands(commandsFolder: string) {
        if (!this._isFolderValid(commandsFolder)) return
        await this.client.application.commands.set([])

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

                await this.client.commands.set(commandName, command)
                await this.client.application.commands.create(command)
            }
        }
    }

    async attachCommandsToGuilds() {
        if (!this.client.commands.size) return

        await this.client.guilds.fetch()

        for (const guild of this.client.guilds.cache.map((g) => g)) {
            const commands = [...this.client.commands.values()]
            await guild.commands.set(commands)
        }
    }

    async updateCommandLocales() {}

    async handleEvents(eventsFolder: string, eventManager: Siringo | Database<ICustomGuildOptions>) {
        if (!this._isFolderValid(eventsFolder)) return

        for (const eventFile of readdirSync(eventsFolder)) {
            const eventFilePath = join(eventsFolder, eventFile)
            if (!this._isFileValid(eventFilePath)) continue

            const eventFileURL = pathToFileURL(eventFilePath).toString()
            const { event }: { event: TEvent } = await import(eventFileURL)
            const eventName = eventFile.split('.')[0]
            const eventOnce = eventFile.split('.').at(-2) == 'once'

            if (eventOnce) eventManager.once(eventName, (...args: unknown[]) => event(this.client, ...args))
            else eventManager.on(eventName, (...args: unknown[]) => event(this.client, ...args))
        }
    }

    private _isFolderValid(folderPath: string) {
        return (
            !!folderPath &&
            existsSync(folderPath) &&
            lstatSync(folderPath).isDirectory() &&
            readdirSync(folderPath).length > 0
        )
    }

    private _isFileValid(filePath: string) {
        return (
            !!filePath &&
            existsSync(filePath) &&
            ['.js', '.ts'].includes(extname(filePath)) &&
            statSync(filePath).size > 0
        )
    }

    private async _isCommandValid(command: ICommand) {
        return (
            !!command &&
            ['name', 'description', 'run'].every((p) => Object.keys(command).includes(p)) &&
            typeof command.run == 'function'
        )
    }
}
