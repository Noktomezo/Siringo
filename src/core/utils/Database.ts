import { Snowflake } from 'discord.js'
import Keyv from 'keyv'

export class Database<V = any, O extends Record<string, any> = Record<string, unknown>> extends Keyv<V, O> {
    constructor(uri?: string, options?: Keyv.Options<V> & O) {
        super(uri, options)
    }

    async all() {
        const allData = []
        for await (const data of this.iterator()) {
            allData.push(data)
        }

        return new Map<Snowflake, V>(allData)
    } 
}
