import 'dotenv/config'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Client, Collection } from 'discord.js'
import type { ICommand, ISiringoOptions } from '../typings/index.js'
import { LocaleManager } from './managers/LocaleManager.js'
import { PresenceManager } from './managers/PresenceManager.js'
import { ReactionRoleManager } from './managers/ReactionRoleManager.js'
import { Database } from './utils/Database.js'
import { Handler } from './utils/Handler.js'
import { Logger } from './utils/Logger.js'
import { Utils } from './utils/Utils.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

export class Siringo extends Client<true> {
    private readonly handler: Handler

    public defaultPrefix: string

    public logger: Logger

    public utils: Utils

    public database: Database

    public presences: PresenceManager

    public reactionRoles: ReactionRoleManager

    public locales: LocaleManager

    public commands: Collection<string, ICommand>

    public constructor(options: ISiringoOptions) {
        super(options)
        this.defaultPrefix = options.defaultPrefix

        this.commands = new Collection<string, ICommand>()

        this.locales = new LocaleManager(this, options.defaultLocale)

        this.database = new Database(this, options.mongoURL)
        this.presences = new PresenceManager(this)
        this.reactionRoles = new ReactionRoleManager(this)

        this.handler = new Handler(this)
        this.logger = new Logger(this)
        this.utils = new Utils(this)
    }

    public async init(token: string) {
        const localesFolderPath = join(__dirname, '..', 'locales')
        const commandsFolderPath = join(__dirname, '..', 'commands')
        const clientEventsFolderPath = join(__dirname, '..', 'events', 'client')
        const databaseEventsFolderPath = join(__dirname, '..', 'events', 'database')
        // const musicEventsFolderPath = path.join(__dirname, '..', 'events', 'music')
        await this.database.init()

        await this.locales.load(localesFolderPath)
        await this.handler.handleEvents(clientEventsFolderPath, this)
        await this.handler.handleEvents(databaseEventsFolderPath, this.database)
        //
        await this.login(token)
        await this.handler.handleCommands(commandsFolderPath)
        // await this.handler.handleEvents(musicEventsFolderPath, this.player)
    }
}
