import {
  CommandInteraction,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
} from 'discord.js';

export interface SlashCommandHandler {
  (interaction: CommandInteraction): Promise<void>;
}

export interface SlashCommand {
  definition: RESTPostAPIChatInputApplicationCommandsJSONBody;
  handler: SlashCommandHandler;
}
