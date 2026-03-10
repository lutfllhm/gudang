#!/usr/bin/env node

/**
 * Verify Backend Setup
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { query, testConnection, closePool } = require('../config/database');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function check(name, passed, details = '') {
  const icon = passed ? '✅' : '❌';
  const color = passed ? 'green' : 'red';
  log(`${icon} ${name}`, color);
  if (details) {
    log(`   ${details}`, 'yellow');
  }
  return passed;
}

async function verifyEnvironment() {
  log('\n📋 Environment Variables', 'blue');
  log('-'.repeat(60), 'blue');

  const required = [
    'DB_HOST',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME',
    'JWT_SECRET',
    'ACCURATE_CLIENT_ID',
    'ACCURATE_CLIENT_SECRET',
    'ACCURATE_SIGNATURE_SECRET'
  ];

  let allPresent = true;

  for (const key of required) {
    const present = !!process.env[key];
    check(key, present, present ? 'Set' : 'Missing');
    if (!present) allPresent = false;
  }

  return allPresent;
}

async function verifyDatabase() {
  log('\n🗄️  Database Connection', 'blue');
  log('-'.repeat(60), 'blue');

  try {
    await testConnection();
    check('Database Connection', true, 'Connected successfully');

    // Check tables
    const tables = await query('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);

    const requiredTables = [
      'users',
      'accurate_tokens',
      'items',
      'sales_orders',
      'activity_logs',
      'sync_config',
      'sync_logs'
    ];

    log('\n📊 Database Tables', 'blue');
    log('-'.repeat(60), 'blue');

    let allTablesExist = true;
    for (const table of requiredTables) {
      const exists = tableNames.includes(table);
      check(table, exists, exists ? 'Exists' : 'Missing');
      if (!exists) allTablesExist = false;
    }

    // Check default user
    log('\n👤 Default User', 'blue');
    log('-'.repeat(60), 'blue');

    const users = await query('SELECT * FROM users WHERE email = ?', ['superadmin@iware.id']);
    check('Superadmin User', users.length > 0, users.length > 0 ? 'Exists' : 'Missing');

    return allTablesExist && users.length > 0;
  } catch (error) {
    check('Database Connection', false, error.message);
    return false;
  }
}

async function verifyFiles() {
  log('\n📁 Required Files', 'blue');
  log('-'.repeat(60), 'blue');

  const requiredFiles = [
    'package.json',
    'server.js',
    '.env',
    'src/config/index.js',
    'src/config/database.js',
    'src/utils/logger.js',
    'src/middleware/auth.js',
    'src/middleware/errorHandler.js',
    'src/services/accurate/TokenManager.js',
    'src/services/accurate/ApiClient.js',
    'src/models/User.js',
    'src/models/Item.js',
    'src/models/SalesOrder.js',
    'src/services/AuthService.js',
    'src/services/ItemService.js',
    'src/services/SalesOrderService.js',
    'src/controllers/AuthController.js',
    'src/controllers/ItemController.js',
    'src/routes/authRoutes.js',
    'src/routes/itemRoutes.js'
  ];

  let allFilesExist = true;

  for (const file of requiredFiles) {
    const filePath = path.join(__dirname, '../..', file);
    const exists = fs.existsSync(filePath);
    check(file, exists, exists ? 'Exists' : 'Missing');
    if (!exists) allFilesExist = false;
  }

  return allFilesExist;
}

async function verifyDependencies() {
  log('\n📦 Dependencies', 'blue');
  log('-'.repeat(60), 'blue');

  const packageJsonPath = path.join(__dirname, '../..', 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    check('package.json', false, 'Missing');
    return false;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

  const required = [
    'express',
    'mysql2',
    'dotenv',
    'cors',
    'helmet',
    'bcryptjs',
    'jsonwebtoken',
    'axios',
    'winston',
    'joi',
    'express-rate-limit'
  ];

  let allInstalled = true;

  for (const dep of required) {
    const installed = !!dependencies[dep];
    check(dep, installed, installed ? `v${dependencies[dep]}` : 'Missing');
    if (!installed) allInstalled = false;
  }

  // Check node_modules
  const nodeModulesPath = path.join(__dirname, '../..', 'node_modules');
  const nodeModulesExists = fs.existsSync(nodeModulesPath);
  check('node_modules', nodeModulesExists, nodeModulesExists ? 'Installed' : 'Run npm install');

  return allInstalled && nodeModulesExists;
}

async function verifyLogs() {
  log('\n📝 Logs Directory', 'blue');
  log('-'.repeat(60), 'blue');

  const logsPath = path.join(__dirname, '../..', 'logs');
  
  if (!fs.existsSync(logsPath)) {
    fs.mkdirSync(logsPath, { recursive: true });
    check('logs/', true, 'Created');
  } else {
    check('logs/', true, 'Exists');
  }

  return true;
}

async function runVerification() {
  console.log('');
  log('='.repeat(60), 'blue');
  log('🔍 BACKEND SETUP VERIFICATION', 'blue');
  log('='.repeat(60), 'blue');

  const results = {
    environment: await verifyEnvironment(),
    files: await verifyFiles(),
    dependencies: await verifyDependencies(),
    logs: await verifyLogs(),
    database: await verifyDatabase()
  };

  await closePool();

  // Summary
  console.log('');
  log('='.repeat(60), 'blue');
  log('📊 VERIFICATION SUMMARY', 'blue');
  log('='.repeat(60), 'blue');

  const checks = [
    { name: 'Environment Variables', passed: results.environment },
    { name: 'Required Files', passed: results.files },
    { name: 'Dependencies', passed: results.dependencies },
    { name: 'Logs Directory', passed: results.logs },
    { name: 'Database Setup', passed: results.database }
  ];

  checks.forEach(c => check(c.name, c.passed));

  const allPassed = Object.values(results).every(r => r);

  console.log('');
  if (allPassed) {
    log('✅ All checks passed! Backend is ready.', 'green');
    log('\nNext steps:', 'yellow');
    log('  1. Start server: npm run dev', 'yellow');
    log('  2. Test API: npm run test:api', 'yellow');
    console.log('');
    process.exit(0);
  } else {
    log('❌ Some checks failed. Please fix the issues above.', 'red');
    console.log('');
    process.exit(1);
  }
}

runVerification().catch(error => {
  log(`\n❌ Verification failed: ${error.message}`, 'red');
  process.exit(1);
});
