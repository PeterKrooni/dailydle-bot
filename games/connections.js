import Game from './game.js'

const messageParser = (message) => {
  const match = message.content.match(/Connections\s\sPuzzle\s\#(\d+)\s([\uD83D\uDFE6-\uDFEA\s]+)/)

  // Splits the 'score' (lines of emojis) into an array of
  // unique emojis, then filters out the empty lines and
  // counts the length of the array.
  // If the length not `1`, the line represents a mistake.
  return match
    ? {
        day: match[1],
        score: match[2]
          .split('\n')
          .filter((l) => l !== '')
          .map((l) => new Set(l).size)
          .filter((i) => i !== 1).length,
      }
    : {}
}

const replyFormatter = (entry, mistakes) => {
  if (mistakes === 1) {
    return `${entry.user.server_name} solved Connections ${entry.day} with no mistakes.`
  } else if (mistakes === 4) {
    return `${entry.user.server_name} failed Connections ${entry.day}`
  } else {
    return `${entry.user.server_name} solved Connections ${entry.day} with ${mistakes} mistakes.`
  }
}

export const Connections = new Game('Connections', messageParser, replyFormatter, undefined, undefined, {
  inline: true,
  order: 2,
})

export default Connections
