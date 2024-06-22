import Entry from '../../db/models/entry.js'

const WHITESPACE = '\s'
const GAME_NAME = 'Strands'
const GAME_NR = '[#][0-9]+'
const TODAYS_THEME = '[“][A-Za-z0-9\s]+[”]' //TODO plus any emoji, see: https://github.com/mathiasbynens/emoji-regex
const RESULT = '[\uD83D\uDCA1\uD83D\uDD35\uD83D\uDFE1\s]+' // 💡 🔵 🟡

//const REGEX_STRANDS = /Strands \s [#][0-9]+ \s [“][A-Za-z0-9\s]+[”] [\uD83D\uDCA1\uD83D\uDD35\uD83D\uDFE1\s]+ /
const REGEX_STRANDS = new RegExp(GAME_NAME + WHITESPACE + GAME_NR + WHITESPACE + TODAYS_THEME + RESULT)

