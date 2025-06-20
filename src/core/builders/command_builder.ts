import { SlashCommandBuilder, SlashCommandStringOption } from 'discord.js';
import { SlashCommand, SlashCommandHandler } from '../command.js';

interface option {
  name: string,
  description: string,
  required: boolean,
}

export class CommandBuilder {
  private name?: string;
  private description?: string;
  private handler?: SlashCommandHandler;
  private permissions?: bigint;
  private option?: option;

  constructor(name?: string) {
    this.name = name;
  }

  set_name(name: string): CommandBuilder {
    this.name = name;
    return this;
  }

  set_description(description: string): CommandBuilder {
    this.description = description;
    return this;
  }

  set_handler(handler: SlashCommandHandler): CommandBuilder {
    this.handler = handler;
    return this;
  }

  set_option(option: option): CommandBuilder {
    this.option = option;
    return this;
  }

  set_permissions(permission_flags: bigint): CommandBuilder {
    this.permissions = permission_flags;
    return this;
  }

  build(): SlashCommand {
    if (this.name === undefined) {
      throw new Error('Name cannot be undefined');
    }

    if (this.description === undefined) {
      throw new Error('Description cannot be undefined');
    }

    if (this.handler === undefined) {
      throw new Error('Handler must be set');
    }

    let def = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .setDefaultMemberPermissions(this.permissions)

    if (this.option !== undefined) {
      def.addStringOption(option =>
        option
          .setName(this.option!.name)
          .setRequired(this.option!.required)
          .setDescription(this.option!.description)
      )
    }

    return {
      definition: def.toJSON(),
      handler: this.handler,
    };
  }
}

export default CommandBuilder;
