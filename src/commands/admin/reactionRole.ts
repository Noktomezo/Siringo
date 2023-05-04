import { ICommand, ICommandBuildOptions } from "../../typings"

export const buildCommand = (buildOptions: ICommandBuildOptions): ICommand => {

    return {
        name: "reaction-role",
        description: buildOptions.client.locales.default?.commands.reactionRole.description ?? "reaction-role",
        run: ({client, interaction, locale}) => {
            
        }
    }
}