import Game from './game.js'

const scoreFormatter = (score) => {
  if (!isFinite(Number(score))) return '∞???'
  const time = new Date((Number(score) % 31536000) * 1000)
  const overtime = `${Number(score) / 31536000 >= 1 ? `${Math.floor(Number(score) / 31536000)}y` : ''}${
    time.getUTCMonth() === 0 ? '' : `${time.getUTCMonth()}m`
  }${time.getUTCDate() === 1 ? '' : `${time.getUTCDate()}d`}`
  return `${overtime}${overtime !== '' ? ', ' : ''}${time.getUTCHours() === 0 ? '' : `${time.getUTCHours()}h`}${
    time.getUTCMinutes() === 0 ? '' : `${time.getUTCMinutes()}m`
  }${time.getUTCSeconds()}s`
}

export const TheMini = new Game(
  'Mini Crossword',
  (message) => {
    const match = message.content.match(/https:\/\/www\.nytimes\.com\/.*\?d=([\d-]+)&t=(\d+)/)
    return match ? { day: match[1], score: match[2] } : {}
  },
  (e) => `${e.user.server_name} did the Mini Crossword ${e.day} in ${scoreFormatter(e.score)}`,
  scoreFormatter,
  undefined,
  { inline: true, order: 1 },
)

export default TheMini
