import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

/**
 * Custom ID of the button that posts the game summary message.
 *
 * Custom IDs are namespaced as `dailydle:<action>` so that interaction callbacks can tell our
 * components apart from anything else that might end up on a message.
 */
export const SUMMARY_BUTTON_ID = 'dailydle:summary';

/**
 * Builds the action row holding the game summary button.
 *
 * This is attached to the response the bot posts for every registered game entry, and is what
 * lets a user ask for the game summary message.
 */
export function summary_button_row(): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(SUMMARY_BUTTON_ID)
      .setLabel('Show summary')
      .setEmoji('📋')
      .setStyle(ButtonStyle.Primary),
  );
}
