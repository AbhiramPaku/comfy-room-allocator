import { MongoClient } from 'mongodb';

const sourceUri = process.env.SOURCE_MONGODB_URI;
const sourceDbName = process.env.SOURCE_MONGODB_DB_NAME;
const targetUri = process.env.TARGET_MONGODB_URI || process.env.MONGODB_URI;
const targetDbName = process.env.TARGET_MONGODB_DB_NAME || process.env.MONGODB_DB_NAME || 'hostel';
const includeCollections = (process.env.REPLICATE_COLLECTIONS || '')
  .split(',')
  .map((name) => name.trim())
  .filter(Boolean);
const dropTargetFirst = String(process.env.REPLICATE_DROP_TARGET_FIRST || 'true').toLowerCase() === 'true';

if (!sourceUri || !sourceDbName) {
  console.error('Missing SOURCE_MONGODB_URI or SOURCE_MONGODB_DB_NAME in environment.');
  process.exit(1);
}

if (!targetUri) {
  console.error('Missing TARGET_MONGODB_URI (or fallback MONGODB_URI) in environment.');
  process.exit(1);
}

const replicateCollection = async ({ sourceDb, targetDb, name }) => {
  const sourceCollection = sourceDb.collection(name);
  const targetCollection = targetDb.collection(name);

  const docs = await sourceCollection.find({}).toArray();

  if (dropTargetFirst) {
    await targetCollection.deleteMany({});
  }

  if (docs.length > 0) {
    await targetCollection.insertMany(docs, { ordered: false });
  }

  return docs.length;
};

const main = async () => {
  let sourceClient;
  let targetClient;

  try {
    sourceClient = await MongoClient.connect(sourceUri);
    targetClient = await MongoClient.connect(targetUri);

    const sourceDb = sourceClient.db(sourceDbName);
    const targetDb = targetClient.db(targetDbName);

    const sourceCollections = await sourceDb.listCollections({}, { nameOnly: true }).toArray();
    const sourceNames = sourceCollections.map((item) => item.name);

    const selectedCollections = includeCollections.length > 0
      ? sourceNames.filter((name) => includeCollections.includes(name))
      : sourceNames;

    if (selectedCollections.length === 0) {
      console.log('No collections selected for replication.');
      return;
    }

    console.log(`Replicating ${selectedCollections.length} collection(s) from ${sourceDbName} to ${targetDbName}...`);

    for (const name of selectedCollections) {
      const count = await replicateCollection({ sourceDb, targetDb, name });
      console.log(`- ${name}: copied ${count} document(s)`);
    }

    console.log('Replication completed successfully.');
  } catch (error) {
    console.error('Replication failed:', error);
    process.exitCode = 1;
  } finally {
    if (sourceClient) {
      await sourceClient.close();
    }
    if (targetClient) {
      await targetClient.close();
    }
  }
};

main();
