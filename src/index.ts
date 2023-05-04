import 'dotenv/config'

import { GatewayIntentBits, Partials } from 'discord.js'

import { Siringo } from './core/Siringo.js'

const client = new Siringo({
    defaultLocale: process.env.DEFAULT_LOCALE ?? 'en-US',
    mongoURL: process.env.MONGO_URL ?? 'abc123',
    intents: Object.values(GatewayIntentBits) as GatewayIntentBits[],
    partials: Object.values(Partials) as Partials[]
})

client.init(process.env.DISCORD_TOKEN ?? 'abc123')
