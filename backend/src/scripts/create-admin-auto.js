/**
 * Create Admin User Script (Non-Interactive)
 * 
 * Usage: node create-admin-auto.js [email] [password] [nama]
 */

const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const logger = require('../utils/logger');

async function createAdmin() {
  try {
    // Get arguments
    const email = process.argv[2] || 'admin@iwareid.com';
    const password = process.argv[3] || 'Admin123!';
    const nama = process.argv[4] || 'Administrator';

    console.log('\n=================================');
    console.log('CREATE ADMIN USER');
    console.log('=================================\n');

    // Validate password
    if (password.length < 8) {
      console.error('❌ Password must be at least 8 characters!');
      process.exit(1);
    }

    // Check if user already exists
    const existingUsers = await query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      console.log('⚠️  User already exists, updating password...');
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Update user
      await query(
        'UPDATE users SET password = ?, role = ?, status = ? WHERE email = ?',
        [hashedPassword, 'superadmin', 'aktif', email]
      );

      console.log('\n✅ ADMIN USER UPDATED!');
      console.log(`  Email: ${email}`);
      console.log(`  Password: Updated`);
      console.log(`  Role: superadmin`);
      console.log(`  Status: aktif\n`);
    } else {
      // Hash password
      console.log('⏳ Creating admin user...');
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user
      const result = await query(
        `INSERT INTO users (nama, email, password, role, status) 
         VALUES (?, ?, ?, 'superadmin', 'aktif')`,
        [nama, email, hashedPassword]
      );

      console.log('\n=================================');
      console.log('✅ ADMIN USER CREATED!');
      console.log('=================================\n');
      console.log('User Details:');
      console.log(`  ID: ${result.insertId}`);
      console.log(`  Nama: ${nama}`);
      console.log(`  Email: ${email}`);
      console.log(`  Role: superadmin`);
      console.log(`  Status: aktif\n`);
    }

    logger.info('Admin user created/updated', { nama, email });

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    logger.error('Error creating admin user:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run
createAdmin();
