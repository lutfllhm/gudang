#!/usr/bin/env node

console.log('='.repeat(50));
console.log('DEBUG: Starting application...');
console.log('='.repeat(50));

try {
  console.log('1. Loading dotenv...');
  require('dotenv').config();
  console.log('   ✓ dotenv loaded');

  console.log('2. Checking environment variables...');
  console.log('   NODE_ENV:', process.env.NODE_ENV);
  console.log('   PORT:', process.env.PORT);
  console.log('   DB_HOST:', process.env.DB_HOST);
  console.log('   DB_NAME:', process.env.DB_NAME);
  console.log('   ✓ Environment variables OK');

  console.log('3. Loading express...');
  const express = require('express');
  console.log('   ✓ express loaded');

  console.log('4. Loading config...');
  const config = require('./src/config');
  console.log('   ✓ config loaded');
  console.log('   Config:', JSON.stringify(config, null, 2));

  console.log('5. Loading database...');
  const { testConnection } = require('./src/config/database');
  console.log('   ✓ database module loaded');

  console.log('6. Testing database connection...');
  testConnection()
    .then(() => {
      console.log('   ✓ Database connected');
      console.log('7. Loading server...');
      require('./server.js');
    })
    .catch(error => {
      console.error('   ✗ Database connection failed:', error.message);
      console.error('   Stack:', error.stack);
      process.exit(1);
    });

} catch (error) {
  console.error('✗ Error during startup:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}
