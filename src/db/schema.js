import mongoose from 'mongoose'

const entrySchema = new mongoose.Schema(
  {
    game: { type: String, required: true },
    day: { type: String, required: true },
    score: { type: String, required: true },
    user: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      server_name: { type: String, required: true },
    },
    message_id: { type: String, required: true },
    channel_id: { type: String, required: true },
  },
  { timestamps: true },
)

const Entry = mongoose.model('Entry', entrySchema)

export default Entry
