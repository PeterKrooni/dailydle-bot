import { Message } from 'discord.js'
import { toEntry, upsertEntry } from '../db/util'

export class Game {
  constructor(name, messageParser, replyFormatter, scoreFormatter = (score) => score, scoreSorter = (a, b) => a - b) {
    this.name = name
    this.messageParser = messageParser
    this.replyFormatter = replyFormatter
    this.scoreFormatter = scoreFormatter
    this.scoreSorter = scoreSorter
    this.topScores = []

    console.debug(`Created game ${name}`)
  }

  /**
   * Attempts to parse a message into a day and score. If successful, an entry is created and
   * upserted into the database, and a reply is sent to the message.
   *
   * @param {Message} message - The message to handle.
   */
  async handleMessage(message) {
    const { day, score } = this.messageParser(message)

    if (day === undefined || score === undefined) {
      console.debug(`Message is invalid for game ${this.name}`)
    } else {
      console.debug(`Message is valid for game ${this.name}`)

      const entry = toEntry(message, this.name, day, score)
      this.sendReply(message, entry)
      await upsertEntry(entry)
    }
  }

  /**
   * Sends a reply to a message with a given entry.
   *
   * The reply is formatted using the `replyFormatter` function, and the score given to the
   * `replyFormatter` is formatted using the `scoreFormatter` function.
   *
   * @param {Message} message - The message to send a reply to.
   * @param {Object} entry - The entry to send a reply with.
   */
  async sendReply(message, entry) {
    const score = this.scoreFormatter(entry.score)
    const reply = this.replyFormatter(entry, score)
    await message.reply(reply)
  }

  /**
   * Updates the N top-most scores for the game for the current day.
   *
   * @param {Number} [limit=5] - The number of top scores to update.
   */
  async updateTopScores(limit = 5) {
    console.debug(`Updating top scores for game ${this.name}`)

    const today = new Date().toISOString().split('T')[0]

    const entries = await Entry.find({ game: this.name, createdAt: { $gte: today } }).exec()
    console.debug(`Found ${entries.length} entries for game ${this.name}`)

    const sorted_entries = entries.sort((a, b) => this.scoreSorter(a.score, b.score))
    this.topScores = sorted_entries.slice(0, limit)
  }

  /**
   * Returns a string representation of the top scores for the game.
   *
   * Each entry is formatted as "<username> | <score>", with a link to the user's comment.
   *
   * @returns {String} A string representation of the top scores for the game.
   */
  async getFormattedTopScores() {
    // TODO: ew?
    await this.updateTopScores()

    return this.topScores
      .map((entry) => {
        const score = this.scoreFormatter(entry.score)
        const msgLink = `https://discord.com/channels/${entry.user.id}/${entry.channel_id}/${entry.message_id}`

        return `[${entry.user.name} | ${score}](${msgLink})`
      })
      .join('\n')
  }
}
