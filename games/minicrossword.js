import Game from './game.js'

const scoreFormatter = (score) => {
  if (!isFinite(Number(score))) return '∞???'

  let year = Number(score) % 31536000

  const time = new Date(year * 1000)
  const years = Number(score) / 31536000 >= 1 ? `${Math.floor(Number(score) / 31536000)}y` : ''
  const months = time.getUTCMonth() === 0 ? '' : `${time.getUTCMonth()}m`
  const days = time.getUTCDate() === 1 ? '' : `${time.getUTCDate()}d`
  const hours = time.getUTCHours() === 0 ? '' : `${time.getUTCHours()}h`
  const minutes = time.getUTCMinutes() === 0 ? '' : `${time.getUTCMinutes()}m`
  const seconds = `${time.getUTCSeconds()}s`

  const slowpoke = years !== '' || months !== '' || days !== ''

  return `${years}${months}${days}${slowpoke ? ', ' : ''}${hours}${minutes}${seconds}`
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
