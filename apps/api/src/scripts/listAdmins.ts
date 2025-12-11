import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { UserModel } from '../models/User.js';
import { logger } from '../config/logger.js';

async function listAdmins() {
  try {
    await connectDatabase();
    
    // Find all admin users
    const admins = await UserModel.find({ isAdmin: true });
    
    if (admins.length === 0) {
      console.log('\n⚠️  No admin users found in the database.\n');
      await disconnectDatabase();
      return;
    }

    console.log(`\n✅ Found ${admins.length} admin user(s):\n`);
    console.log('═'.repeat(80));
    
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. Phone: ${admin.phoneE164}`);
      console.log(`   Sarathi ID: ${admin.sarathiId}`);
      console.log(`   User ID: ${admin._id}`);
      console.log(`   State: ${admin.stateCode}`);
      console.log(`   Created: ${admin.createdAt?.toLocaleDateString() || 'N/A'}`);
      if (index < admins.length - 1) {
        console.log('─'.repeat(80));
      }
    });
    
    console.log('═'.repeat(80));
    console.log('');

    await disconnectDatabase();
  } catch (error) {
    logger.error({ error }, 'Failed to list admin users');
    process.exit(1);
  }
}

listAdmins();

