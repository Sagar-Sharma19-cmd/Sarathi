import mongoose from 'mongoose';
import { UserModel } from '../models/User.js';
import { TransactionModel } from '../models/Transaction.js';
import { ScoreModel } from '../models/Score.js';
import { LoanModel } from '../models/Loan.js';
import { env } from '../config/env.js';

async function viewData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(env.MONGO_URI);
    console.log('✓ Connected to MongoDB\n');

    // Get all users
    const users = await UserModel.find({}).sort({ createdAt: -1 }).limit(10);
    console.log('=== USERS (Last 10) ===');
    console.log(`Total users: ${await UserModel.countDocuments()}\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.phoneE164}`);
      console.log(`   Sarathi ID: ${user.sarathiId}`);
      console.log(`   Password Set: ${user.passwordHash ? 'Yes' : 'No'}`);
      console.log(`   State: ${user.stateCode}`);
      console.log(`   Language: ${user.preferredLang}`);
      console.log(`   Admin: ${user.isAdmin ? 'Yes' : 'No'}`);
      console.log(`   Created: ${user.createdAt.toISOString()}`);
      console.log('');
    });

    // Get transactions count
    const txCount = await TransactionModel.countDocuments();
    console.log(`=== TRANSACTIONS ===`);
    console.log(`Total transactions: ${txCount}\n`);

    if (txCount > 0) {
      const recentTx = await TransactionModel.find({}).sort({ createdAt: -1 }).limit(5);
      console.log('Recent transactions:');
      recentTx.forEach((tx, index) => {
        console.log(`${index + 1}. ${tx.type} - ₹${tx.amount} - ${tx.status}`);
      });
      console.log('');
    }

    // Get scores count
    const scoreCount = await ScoreModel.countDocuments();
    console.log(`=== SCORES ===`);
    console.log(`Total scores: ${scoreCount}\n`);

    // Get loans count
    const loanCount = await LoanModel.countDocuments();
    console.log(`=== LOANS ===`);
    console.log(`Total loans: ${loanCount}\n`);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

viewData();

