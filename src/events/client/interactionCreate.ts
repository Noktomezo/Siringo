import type { ChatInputCommandInteraction } from 'discord.js'
import type { Siringo } from '../../core/Siringo.js'
import type { IDatabaseGuildSettings } from '../../types.js'

export const event = async (client: Siringo, interaction: ChatInputCommandInteraction) => {
    if (!interaction.guild) return

    const settings = (await client.database.get(interaction.guild.id)) as IDatabaseGuildSettings
    const localizedCommands = client.localizedCommands.get(settings.locale)
    const command = localizedCommands?.get(interaction.commandName)
    if (!command) return

    const translate = (localeKey: string) => client.locales.get(interaction.guild!)!.get(localeKey) ?? localeKey
    const respond = client.utils.getRespondFunction(interaction)

    await command
        .run({ client, interaction, translate, settings, respond })
        .catch((error) => client.logger.error(error))
}
