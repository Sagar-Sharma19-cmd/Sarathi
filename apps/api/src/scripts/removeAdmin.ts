import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { UserModel } from '../models/User.js';
import { logger } from '../config/logger.js';

async function removeAdmin() {
  try {
    await connectDatabase();
    
    // Get phone number from command line argument
    const phoneE164 = process.argv[2];
    
    if (!phoneE164) {
      logger.error('Usage: pnpm remove-admin <phoneE164>');
      logger.error('Example: pnpm remove-admin +919876543210');
      process.exit(1);
    }

    // Find user by phone number
    const user = await UserModel.findOne({ phoneE164 });
    
    if (!user) {
      logger.error({ phoneE164 }, 'User not found');
      process.exit(1);
    }

    if (!user.isAdmin) {
      logger.info({ phoneE164 }, 'User is already not an admin');
      console.log('\n⚠️  This user already does not have admin privileges.');
      console.log(`   Phone: ${user.phoneE164}`);
      console.log(`   Sarathi ID: ${user.sarathiId}`);
      await disconnectDatabase();
      return;
    }

    // Update user to remove admin
    user.isAdmin = false;
    await user.save();

    logger.info({ 
      userId: user._id, 
      sarathiId: user.sarathiId, 
      phoneE164: user.phoneE164 
    }, 'Admin privileges revoked');
    
    console.log('\n✅ Success! Admin privileges removed.');
    console.log(`   Phone: ${user.phoneE164}`);
    console.log(`   Sarathi ID: ${user.sarathiId}`);
    console.log(`   User ID: ${user._id}`);
    console.log('\n⚠️  If this user is currently logged in, they need to login again for the change to take effect.\n');

    await disconnectDatabase();
  } catch (error) {
    logger.error({ error }, 'Failed to remove admin privileges');
    process.exit(1);
  }
}

removeAdmin();

