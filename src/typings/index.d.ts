import type { ChatInputApplicationCommandData, ChatInputCommandInteraction, ClientOptions } from 'discord.js'

import type { Siringo } from '../core/Siringo.js'
import { Locale } from './locale.js'

export interface ISiringoOptions extends ClientOptions {
    defaultLocale: string
    mongoURL: string
}

export interface ICommandRunOptions {
    client: Siringo
    interaction: ChatInputCommandInteraction
    locale: Locale
}

export interface ICommand extends ChatInputApplicationCommandData {
    run: (options: ICommandRunOptions) => void
}

export interface ICommandBuildOptions {
    client: Siringo
}

export interface IReactionRoleOptions {
    type: number
    roleId: string
    emojiId: string
    messageId: string
}

export interface IPrivateChannelOptions {
    name: string
    id: string
}

export interface ICustomGuildOptions {
    locale: Locale
    reactionRoles: IReactionRoleOptions[]
    privateChannels: IPrivateChannelOptions[]
}

export type TCommandBuilder = (buildOptions: ICommandBuildOptions) => ICommand

export type TEvent = (client: Siringo, ...args: unknown[]) => void
