import type { Snowflake, VoiceState, VoiceChannel } from 'discord.js'
import { Collection } from 'discord.js'
import type { Siringo } from '../Siringo.js'

export class PrivateChannelManager {
    public channels: Collection<Snowflake, VoiceChannel>

    public constructor(public client: Siringo) {
        this.channels = new Collection()
    }

    // public async handleVoiceStateUpdate(oldState: VoiceState, newState: VoiceState) {
    //     const masterState = oldState.channel?.id ? oldState : newState
    //     const guildData = await this.client.database.get(masterState.guild.id)
    //     if (!guildData) return
    //
    //     if (masterState === newState) {
    //         if (masterState.channel?.members.size === 0 && masterState.channel?.members.at(0)?.user.bot) return
    //
    //         const channel = guildData.privateChannels.find((pvt) => pvt.id === masterState.channel?.id)
    //         if (!channel) return
    //
    //         const privateChannel = masterState.channel!.parent?.children.create({
    //             name: channel.name ?? masterState.member?.displayName ?? masterState.member?.user.username
    //         })
    //     } else {
    //         return 0
    //     }
    // }
}
