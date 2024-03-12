import Game from './game.js'

export const Wordle = new Game(
  'Wordle',
  (message) => {
    const match = message.content.match(/Wordle (\d+) ([1-6X])\/6/)
    return match ? { day: match[1], score: match[2] } : {}
  },
  (e) => `${e.user.server_name} scored ${e.score}/6 on Wordle ${e.day}`,
  (score) => `${score}/6`,
  (a, b) => (b === 'X' ? 1 : a - b),
  { inline: true, order: 0 },
)

export default Wordle
