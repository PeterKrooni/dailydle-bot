import Game from './games/game.js'

/**
 * Embed message template
 */
const embedTemplate = {
  color: 0x498f49,
  author: {
    name: 'Daylidle stat tracker',
    icon_url: 'https://assets-prd.ignimgs.com/2022/04/15/wordle-1650045194490.jpg',
    url: 'https://www.youtube.com/watch?v=oyuoUwxCLMs',
  },
  thumbnail: {
    url: 'https://1000logos.net/wp-content/uploads/2023/05/Wordle-Emblem.png',
  },
  description: `Dailydle - ${new Date().toLocaleString('no-nb', {
    weekday: 'long',
    day: 'numeric',
    year: 'numeric',
    month: 'long',
  })}`,
  fields: [
    {
      name: 'Daily high scores',
      value: 'Share your dailydle scores in the channel to register your entry',
    },
  ],
  timestamp: new Date().toISOString(),
  footer: {
    text: 'Version 1.1.1',
    icon_url: 'https://assets-prd.ignimgs.com/2022/04/15/wordle-1650045194490.jpg',
  },
}

export const embedMessageComponents = [
  {
    type: 1,
    components: [
      {
        style: 5,
        label: `Wordle`,
        url: `https://www.nytimes.com/games/wordle/index.html`,
        disabled: false,
        type: 2,
      },
      {
        style: 5,
        label: `Connections`,
        url: `https://www.nytimes.com/games/connections`,
        disabled: false,
        type: 2,
      },
      {
        style: 5,
        label: `The Mini`,
        url: `https://www.nytimes.com/crosswords/game/mini`,
        disabled: false,
        type: 2,
      },
      {
        style: 5,
        label: `Gamedle`,
        url: `https://www.gamedle.wtf`,
        disabled: false,
        type: 2,
      },
    ],
  },
]

/**
 * Generates an embed message from a list of games.
 *
 * @param {Game[]} games - The list of games to generate the embed message from.
 */
export async function getEmbed(games) {
  // Get the top scores for each game, and sort them by the embed order of each game:
  const fields = (await Promise.all(games.map((game) => game.toEmbedField())))
    .flat()
    .sort((a, b) => (b.order === undefined ? 1 : a.order - b.order))

  const embed = { ...embedTemplate }
  embed.fields = embed.fields.concat(fields)

  return embed
}
