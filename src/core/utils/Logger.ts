import colors from 'colors'
import { Siringo } from '../Siringo.js'

export class Logger {
    private readonly ip: string
    private readonly wp: string
    private readonly ep: string

    constructor(public client: Siringo) {
        const botName = client.constructor.name
        const { magenta, red, yellow } = colors

        this.ip = magenta(botName) + ' | ' + magenta('Info')
        this.wp = yellow(botName) + ' | ' + yellow('Warning')
        this.ep = red(botName) + ' | ' + red('Error')
    }

    public info(message: string | unknown) {
        if (message) return console.log(this._parseStrings(message, this.ip))
    }

    public warn(message: unknown[]) {
        if (message) return console.log(this._parseStrings(message, this.wp))
    }

    public error(error: unknown) {
        if (!error) return console.log(this._parseStrings(error, this.ep))
    }

    private _parseStrings(message: unknown, prefix: string): string {
        const time = this.client.utils.getCurrentTime()
        if (typeof message == 'string') return `[${prefix}] [${time}] ${message}`
        const splitStrings = JSON.stringify(message, null, 4).split('\n')
        return splitStrings.map((s) => `[${prefix}] [${time}] ${s}`).join('\n')
    }
}
