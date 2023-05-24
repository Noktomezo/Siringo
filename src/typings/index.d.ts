import type {
    ChatInputCommandInteraction,
    ClientOptions,
    Snowflake,
    ChatInputApplicationCommandData,
    InteractionReplyOptions
} from 'discord.js'
import type { Siringo } from '../core/Siringo.js'

export interface ISiringoOptions extends ClientOptions {
    defaultLocale: string
    defaultPrefix: string
    mongoURL: string
}

export interface ICommandRunOptions {
    client: Siringo
    interaction: ChatInputCommandInteraction
    respond: TRespondFunction
    settings: ICustomGuildSettings
    translate: TTranslateFunction
}

export interface ICommand extends ChatInputApplicationCommandData {
    category: string
    run(options: ICommandRunOptions): Promise<void>
}

export interface ICommandBuildOptions {
    client: Siringo
}

export interface IReactionRoleOptions {
    channelId: Snowflake
    emojiId: string
    messageId: Snowflake
    roleId: Snowflake
    type: number
}

export interface IPrivateChannelOptions {
    id: string
    name: string
}

export interface ICustomGuildSettings {
    locale: string
    privateChannels: IPrivateChannelOptions[]
    reactionRoles: IReactionRoleOptions[]
}

export type TCommandBuilder = (buildOptions: ICommandBuildOptions) => ICommand

export type TEventFunction = (client: Siringo, ...args: unknown[]) => Promise<void>

export type TLocale = Record<string, string>

export type TTranslateFunction = (localeKey: string) => string

export type TRespondFunction = (data: InteractionReplyOptions, timeout?: number) => Promise<void>
