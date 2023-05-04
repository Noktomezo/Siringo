import 'dotenv/config'

import { Client, Collection } from 'discord.js'
import { ICommand, ICustomGuildOptions, ISiringoOptions } from '../typings/index.js'

import path from 'path'
import { fileURLToPath } from 'url'
import { LocaleManager } from './managers/LocaleManager.js'
import { PresenceManager } from './managers/PresenceManager.js'
import { ReactionRoleManager } from './managers/ReactionRoleManager.js'
import { Database } from './utils/Database.js'
import { Handler } from './utils/Handler.js'
import { Logger } from './utils/Logger.js'
import { Utils } from './utils/Utils.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export class Siringo extends Client<true> {
    private handler: Handler
    public logger: Logger
    public utils: Utils
    public database: Database<ICustomGuildOptions>

    public presences: PresenceManager
    public reactionRoles: ReactionRoleManager
    public locales: LocaleManager

    public commands: Collection<string, ICommand>

    constructor(options: ISiringoOptions) {
        super(options)
        this.commands = new Collection<string, ICommand>()

        this.database = new Database<ICustomGuildOptions>(options.mongoURL)

        const localesFolder = path.join(__dirname, '..', 'locales')
        this.locales = new LocaleManager(this, localesFolder, options.defaultLocale)
        this.presences = new PresenceManager(this)
        this.reactionRoles = new ReactionRoleManager(this)

        this.handler = new Handler(this)
        this.logger = new Logger(this)
        this.utils = new Utils(this)
    }
 
    async init(token: string) {
        await this.locales.load()
        
        const commandsFolderPath = path.join(__dirname, '..', 'commands')
        const clientEventsFolderPath = path.join(__dirname, '..', 'events', 'client')
        const databaseEventsFolderPath = path.join(__dirname, '..', 'events', 'database')
        // const musicEventsFolderPath = path.join(__dirname, '..', 'events', 'music')
        
        await this.handler.handleEvents(clientEventsFolderPath, this)
        await this.handler.handleEvents(databaseEventsFolderPath, this.database)
        //
        await this.login(token)
        await this.handler.handleCommands(commandsFolderPath)
        // await this.handler.handleEvents(musicEventsFolderPath, this.player)
    }
}
