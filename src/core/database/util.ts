import mongoose from 'mongoose';
import Config from '../../config.js';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { XMLParser, XMLBuilder } from "fast-xml-parser";
import fs from 'node:fs';


/**
 * Initializes a database connection or dies trying.
 */
export async function init_database() {
  let db_uri
  const enable_dev_features = process.argv.includes('--dev')
  if (enable_dev_features) {
    const mongod = await MongoMemoryServer.create();
    db_uri =  mongod.getUri();
    updateDatasourceUriForInMemoryDbForIdeaIDEs(db_uri)
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

/**
 * This kind of works, but might need to refresh the datasource a couple of times if it is currently open when the db is reinitialized
 * @param db_uri in memory db URI generated in init_database
 */
function updateDatasourceUriForInMemoryDbForIdeaIDEs(db_uri: string) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_"
  });

  if (!fs.existsSync('./.idea/dataSources.xml')) {
    console.log('\x1b[36m%s\x1b[0m', '--dev: No .idea datasources for in-memory DB found. Add one manually and init-database will update the port automatically each time a new database is created.')
    return;
  }
  let jObj = parser.parse(fs.readFileSync('./.idea/dataSources.xml'));

  // Update just the jdbc-url while preserving all other attributes and structure
  if (Array.isArray(jObj.project.component['data-source'])) {
    jObj.project.component['data-source'].forEach((source: any) => {
      if (source['jdbc-url'].includes('127.0.0.1')) {
        source['jdbc-url'] = db_uri;
      }
    });
  } else {
    if (jObj.project.component['data-source']['jdbc-url'].includes('127.0.0.1')) {
      jObj.project.component['data-source']['jdbc-url'] = db_uri;
    }
  }

  const formattedObj = {
    project: {
      "@_version": "4",
      component: {
        "@_name": "DataSourceManagerImpl",
        "@_format": "xml",
        "@_multifile-model": "true",
        "data-source": jObj.project.component['data-source']
      }
    }
  };

  const builder = new XMLBuilder({
    ignoreAttributes: false,
    format: true,
    attributeNamePrefix: "@_",
    suppressEmptyNode: true,
    processEntities: true,
    suppressBooleanAttributes: false
  });

  const xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n' + builder.build(formattedObj);
  fs.writeFileSync('./.idea/dataSources.xml', xmlContent);
}