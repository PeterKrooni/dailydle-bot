import { Message } from 'discord.js'
import { toEntry, upsertEntry } from '../db/util.js'
import Entry from '../db/schema.js'

export class Game {
  /**
   * Creates a new game.
   *
   * @param {String} name - The name of the game.
   * @param {(msg: Message) => { day, score }} messageParser
   * - Function used to parse messages. If the message is invalid, `{}` should be returned.
   * @param {(entry: Object, score: String | Number) => String} replyFormatter
   * - Function used to format replies. Takes an entry and a score - formatted by `scoreFormatter`.
   * @param {(score: String | Number) => String | Number} [scoreFormatter]
   * - Function used to format scores.
   * @param {(a: String, b: String) => String} [scoreSorter]
   * - Function used to sort scores.
   * @param {Object} [embedOptions] - Options for the embed message. Defaults to `{ inline: false }`.
   */
  constructor(
    name,
    messageParser,
    replyFormatter,
    scoreFormatter = (score) => score,
    scoreSorter = (a, b) => a - b,
    embedOptions = { inline: false, order: undefined },
  ) {
    this.name = name
    this.messageParser = messageParser
    this.replyFormatter = replyFormatter
    this.scoreFormatter = scoreFormatter
    this.scoreSorter = scoreSorter
    this.embedOptions = embedOptions

    this.topScores = []
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
      console.info(`Received valid ${this.name} message`)

      const entry = toEntry(message, this.name, day, score)
      this.#sendReply(message, entry)
      await upsertEntry(entry)
    }
  }

  async toEmbedField() {
    return {
      name: this.name,
      value: await this.#getFormattedTopScores(),
      inline: this.embedOptions.inline,
      order: this.embedOptions.order,
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
  async #sendReply(message, entry) {
    const score = this.scoreFormatter(entry.score)
    const reply = this.replyFormatter(entry, score)
    await message.reply(reply)
  }

  /**
   * Updates the top-most scores for the game for the current day.
   *
   * If `limit` is provided, only the first `n = limit` scores are saved.
   *
   * @param {Number} [limit] - The number of top scores to save.
   */
  async #updateTopScores(limit) {
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
  async #getFormattedTopScores() {
    // TODO: ew?
    await this.#updateTopScores()

    return this.topScores
      .map((entry) => {
        const score = this.scoreFormatter(entry.score)
        const msgLink = `https://discord.com/channels/${entry.user.id}/${entry.channel_id}/${entry.message_id}`

        return `[${entry.user.server_name} | ${score}](${msgLink})`
      })
      .join('\n')
  }
}

export default Game
