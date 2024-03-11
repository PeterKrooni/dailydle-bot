import mongoose from 'mongoose'

export const connectDB = async () => {
  await mongoose
    .connect(process.env.MONGODB_CONNECTION_STRING)
    .then(() => {
      console.log(`Connected to MongoDB (db.js::connectDB)`)
    })
    .catch((error) => {
      console.log(`Failed to connect to MongoDB: ${error} (db.js::connectDB)`)
      process.exit(1)
    })
}
