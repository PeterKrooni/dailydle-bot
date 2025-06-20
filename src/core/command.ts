import {
  ChatInputCommandInteraction,
  CommandInteraction, CommandInteractionOption,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
} from 'discord.js';

export interface SlashCommandHandler {
  (interaction: ChatInputCommandInteraction): Promise<void>;
}

export interface SlashCommand {
  definition: RESTPostAPIChatInputApplicationCommandsJSONBody;
  handler: SlashCommandHandler;
}
