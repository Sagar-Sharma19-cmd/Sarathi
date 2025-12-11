import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { UserModel } from '../models/User.js';
import { logger } from '../config/logger.js';

async function makeAdmin() {
  try {
    await connectDatabase();
    
    // Get phone number from command line argument
    const phoneE164 = process.argv[2];
    
    if (!phoneE164) {
      logger.error('Usage: pnpm make-admin <phoneE164>');
      logger.error('Example: pnpm make-admin +919876543210');
      process.exit(1);
    }

    // Find user by phone number
    const user = await UserModel.findOne({ phoneE164 });
    
    if (!user) {
      logger.error({ phoneE164 }, 'User not found');
      process.exit(1);
    }

    // Update user to admin
    user.isAdmin = true;
    await user.save();

    logger.info({ 
      userId: user._id, 
      sarathiId: user.sarathiId, 
      phoneE164: user.phoneE164 
    }, 'User granted admin privileges');
    
    console.log('\n✅ Success! User is now an admin.');
    console.log(`   Phone: ${user.phoneE164}`);
    console.log(`   Sarathi ID: ${user.sarathiId}`);
    console.log(`   User ID: ${user._id}`);
    console.log('\n⚠️  You need to login again to get a new JWT token with admin privileges.\n');

    await disconnectDatabase();
  } catch (error) {
    logger.error({ error }, 'Failed to make user admin');
    process.exit(1);
  }
}

makeAdmin();

