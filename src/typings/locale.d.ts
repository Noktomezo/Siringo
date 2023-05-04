export interface Locale {
    events:      Events;
    commands:    Commands;
    declensions: Declensions;
}

export interface Commands {
    reactionRole: ReactionRole;
}

export interface ReactionRole {
    description:      string;
    invalidMessageId: string;
    success:          string;
}

export interface Declensions {
    "/*explanation-1*/": string;
    "/*explanation-2*/": string;
    "/*explanation-3*/": string;
    guild:               string[];
}

export interface Events {
    ready: Ready;
}

export interface Ready {
    loggedIn: string;
}
