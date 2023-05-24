import process from 'node:process'
import { GatewayIntentBits, Partials } from 'discord.js'
import { Siringo } from './core/Siringo.js'
import 'dotenv/config'

const client = new Siringo({
    defaultPrefix: process.env.DEFAULT_PREFIX ?? '?',
    defaultLocale: process.env.DEFAULT_LOCALE ?? 'en-US',
    mongoURL: process.env.MONGO_URL ?? 'abc123',
    partials: Object.values(Partials) as Partials[],
    intents: Object.values(GatewayIntentBits) as GatewayIntentBits[]
})

await client.init(process.env.DISCORD_TOKEN ?? 'abc123')

process.on('unhandledRejection', async (error) => client.logger.error(error))
process.on('uncaughtException', async (error) => client.logger.error(error))

process.on('SIGINT', () => {
    client.logger.info('SIGINT signal received: closing Siringo...')
    client.destroy()
    process.exit(0)
})

process.on('SIGTERM', () => {
    client.logger.info('SIGTERM signal received: closing Siringo...')
    client.destroy()
    process.exit(0)
})
