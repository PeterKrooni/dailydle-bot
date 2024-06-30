import Entry from '../db/models/entry.js'
import fs from 'node:fs'

export async function dumpEntriesToFile() {
    const data = await Entry.find({})
    const filename = `./dump-${new Date().toLocaleString('no-nb', {
        weekday: 'long',
        day: 'numeric',
        year: 'numeric',
        month: 'long',
      })}.json`
    await fs.writeFileSync(filename, JSON.stringify(data))
    return data.length
}

