export const enabledChannelIDS = ['1214626119278530582']

export const commands = [
  {
    name: 'ping',
    description: 'Replies with Pong!',
  },
  {
    name: 'list',
    description: 'List dailydles',
  },
  {
    name: 'terminate',
    description: 'clean up client-server webhook and close down server',
  },
  {
    name: 'monkeyembed',
    description: 'amongus',
  },
]

export const links = [
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
