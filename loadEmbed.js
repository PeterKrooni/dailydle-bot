
import Entry from './entry.js'

export default async function loadEntiesForEmbed(today) {
    if (!today) {
        const data = await Entry.find()
        return data
    }
    const res = {}

    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const data = await Entry.find({createdAt: {$gte: startOfToday}})

    const dataCopy = JSON.parse(JSON.stringify(data))
    const dataCopyArray = Object.values(dataCopy)
    const wordles = dataCopyArray.filter(a => a.type === 'Wordle') 
    wordles.sort(sortBy('score'))

    res.sorted_wordles = wordles
    res.top_wordle = wordles[0]
    return res
}

function sortBy(field) {
    return function(a, b) {
      return (a[field] > b[field]) - (a[field] < b[field])
    };
  }
  