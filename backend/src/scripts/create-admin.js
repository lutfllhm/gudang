/**
 * Create Admin User Script
 * 
 * Script untuk membuat user admin pertama kali
 */

const bcrypt = require('bcryptjs');
const readline = require('readline');
const { query } = require('../config/database');
const logger = require('../utils/logger');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt) => {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
};

async function createAdmin() {
  try {
    console.log('\n=================================');
    console.log('CREATE ADMIN USER');
    console.log('=================================\n');

    // Get user input
    const nama = await question('Nama Lengkap (default: Administrator): ') || 'Administrator';
    const email = await question('Email (default: admin@iwareid.com): ') || 'admin@iwareid.com';
    const password = await question('Password (min 8 characters): ');

    // Validate password
    if (!password || password.length < 8) {
      console.error('\n❌ Password must be at least 8 characters!');
      process.exit(1);
    }

    // Check if user already exists
    const existingUsers = await query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      console.error('\n❌ User with this email already exists!');
      process.exit(1);
    }

    // Hash password
    console.log('\n⏳ Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    console.log('⏳ Creating admin user...');
    const result = await query(
      `INSERT INTO users (nama, email, password, role, status) 
       VALUES (?, ?, ?, 'superadmin', 'aktif')`,
      [nama, email, hashedPassword]
    );

    console.log('\n=================================');
    console.log('✅ ADMIN USER CREATED SUCCESSFULLY!');
    console.log('=================================\n');
    console.log('User Details:');
    console.log(`  ID: ${result.insertId}`);
    console.log(`  Nama: ${nama}`);
    console.log(`  Email: ${email}`);
    console.log(`  Role: superadmin`);
    console.log(`  Status: aktif`);
    console.log('\nYou can now login with these credentials.\n');

    logger.info('Admin user created', { nama, email });

  } catch (error) {
    console.error('\n❌ Error creating admin user:', error.message);
    logger.error('Error creating admin user:', error);
    process.exit(1);
  } finally {
    rl.close();
    process.exit(0);
  }
}

// Run
createAdmin();
