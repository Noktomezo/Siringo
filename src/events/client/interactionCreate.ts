import type { ChatInputCommandInteraction } from 'discord.js'
import type { Siringo } from '../../core/Siringo.js'
import type { ICustomGuildSettings } from '../../typings/index.js'

export const event = async (client: Siringo, interaction: ChatInputCommandInteraction) => {
    if (!interaction.guild) return

    const command = client.commands.get(interaction.commandName)
    if (!command) return

    const settings = (await client.database.get(interaction.guild.id)) as ICustomGuildSettings
    const translate = (localeKey: string) => client.locales.get(localeKey, interaction.guild!) ?? localeKey
    const respond = client.utils.getRespondFunction(interaction)

    await command
        .run({ client, interaction, translate, settings, respond })
        .catch((error) => client.logger.error(error))
}
