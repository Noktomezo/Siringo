import type { Siringo } from '../../core/Siringo.js'

export const event = async (client: Siringo) => {
    client.logger.info(client.locales.get('DATABASE_UPDATING', client.locales.defaultLocale))
}
