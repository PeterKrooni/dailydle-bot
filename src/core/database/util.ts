import mongoose from 'mongoose';
import Config from '../../config.js';
import { MongoMemoryServer } from 'mongodb-memory-server';

/**
 * Initializes a database connection or dies trying.
 */
export async function init_database() {
  let db_uri
  const enable_dev_features = process.argv.includes('--dev')
  if (enable_dev_features) {
    const mongod = await MongoMemoryServer.create();
    db_uri =  mongod.getUri();
    console.info('\x1b[36m%s\x1b[0m', '--dev: Using in-memory database (uri: ' + db_uri)
  } else {
    db_uri = Config.DATABASE_URI
  }

  await mongoose
    .connect(db_uri)
    .then(() => console.info('Connected to MongoDB.'))
    .catch((err) => {
      console.error(`Failed to connect to MongoDB: ${err}`);
      process.exit(1);
    });
}
