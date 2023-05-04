import { Siringo } from '../../core/Siringo.js'
import { ChatInputCommandInteraction } from 'discord.js'

export const event = async (client: Siringo, interaction: ChatInputCommandInteraction) => {
    if (!interaction.isChatInputCommand() || !interaction.guild) return

    const command = client.commands.get(interaction.commandName)
    if (!command) return

    const locale = client.locales.cache.get(interaction.guild.id ?? '0')!
    return command.run({ client, interaction, locale })
}
