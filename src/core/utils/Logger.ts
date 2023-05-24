import colors from 'colors'
import type { Siringo } from '../Siringo.js'

export class Logger {
    private readonly ip: string

    private readonly wp: string

    private readonly ep: string

    public constructor(public client: Siringo) {
        const botName = client.constructor.name
        const { magenta, red, yellow } = colors

        this.ip = magenta(botName) + ' | ' + magenta('Info')
        this.wp = yellow(botName) + ' | ' + yellow('Warning')
        this.ep = red(botName) + ' | ' + red('Error')
    }

    public info(message: string | unknown) {
        if (message) {
            console.log(this._parseStrings(message, this.ip, 'info'))
        }
    }

    public warn(message: unknown[]) {
        if (message) {
            console.log(this._parseStrings(message, this.wp, 'warn'))
        }
    }

    public error(error: unknown) {
        if (!error) {
            console.log(this._parseStrings(error, this.ep, 'error'))
        }
    }

    private _parseStrings(message: unknown, prefix: string, type: 'error' | 'info' | 'warn' = 'info'): string {
        const color = type === 'error' ? colors.red : type === 'warn' ? colors.yellow : colors.green

        const time = this.client.utils.getCurrentTime()
        if (typeof message === 'string') return `[${prefix}] [${time}] ${color(message)}`
        const splitStrings = JSON.stringify(message, null, 4).split('\n')
        return splitStrings.map((str) => `[${prefix}] [${time}] ${color(str)}`).join('\n')
    }
}
