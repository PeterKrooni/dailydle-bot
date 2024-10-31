import mongoose from 'mongoose';
import Config from '../../config.js';

/**
 * Initializes a database connection or dies trying.
 */
export async function init_database() {
  await mongoose
    .connect(Config.DATABASE_URI)
    .then(() => console.info('Connected to MongoDB.'))
    .catch((err) => {
      console.error(`Failed to connect to MongoDB: ${err}`);
      process.exit(1);
    });
}
