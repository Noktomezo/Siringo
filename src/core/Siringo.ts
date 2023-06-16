import 'dotenv/config'
import { dirname, join } from 'node:path'
import { cwd } from 'node:process'
import { fileURLToPath } from 'node:url'
import { Client, Collection } from 'discord.js'
import type { ICommand, IDatabaseGuildSettings, ISiringoOptions } from '../types.js'
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

    public logger: Logger

    public utils: Utils

    public database: Database<IDatabaseGuildSettings>

    public presences: PresenceManager

    public reactionRoles: ReactionRoleManager

    public locales: LocaleManager

    public commands: Collection<string, ICommand>

    public constructor(options: ISiringoOptions) {
        super(options)

        this.commands = new Collection<string, ICommand>()

        this.locales = new LocaleManager(this, options.defaultLocale)

        this.database = new Database<IDatabaseGuildSettings>(this, options.mongoURL, {
            locale: options.defaultLocale,
            reactionRoles: [],
            privateChannels: []
        })
        this.presences = new PresenceManager(this)
        this.reactionRoles = new ReactionRoleManager(this)

        this.handler = new Handler(this)
        this.logger = new Logger(this)
        this.utils = new Utils(this)
    }

    public async init(token: string) {
        const localesFolderPath = join(cwd(), 'locales')
        const commandsFolderPath = join(__dirname, '..', 'commands')
        const clientEventsFolderPath = join(__dirname, '..', 'events', 'client')
        // const musicEventsFolderPath = path.join(__dirname, '..', 'events', 'music')

        await this.locales.load(localesFolderPath)
        await this.handler.handleEvents(clientEventsFolderPath, this)
        //
        await this.login(token)
        await this.handler.handleCommands(commandsFolderPath)
        // await this.handler.handleEvents(musicEventsFolderPath, this.player)
    }
}
