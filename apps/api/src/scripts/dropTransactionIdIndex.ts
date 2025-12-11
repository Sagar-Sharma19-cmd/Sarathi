import mongoose from 'mongoose';
import { env } from '../config/env.js';

async function dropIndex() {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log('✓ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db?.collection('transactions');

    if (!collection) {
      throw new Error('Could not access transactions collection');
    }

    // List all indexes
    const indexes = await collection.indexes();
    console.log('\nCurrent indexes on transactions collection:');
    indexes.forEach((idx, i) => {
      console.log(`${i + 1}.`, JSON.stringify(idx.key), idx.name);
    });

    // Check if transactionId_1 index exists
    const hasTransactionIdIndex = indexes.some(idx => idx.name === 'transactionId_1');

    if (hasTransactionIdIndex) {
      console.log('\n✓ Found transactionId_1 index, dropping it...');
      await collection.dropIndex('transactionId_1');
      console.log('✓ Successfully dropped transactionId_1 index');
    } else {
      console.log('\n✓ transactionId_1 index does not exist (already dropped or never created)');
    }

    console.log('\n✅ Done! You can now create SafeSend escrows without errors.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

dropIndex();

