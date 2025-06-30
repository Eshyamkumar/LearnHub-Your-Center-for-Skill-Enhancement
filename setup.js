#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 LearnHub Setup Script');
console.log('========================\n');

// Check if Node.js is installed
try {
  const nodeVersion = process.version;
  console.log(`✅ Node.js ${nodeVersion} detected`);
} catch (error) {
  console.error('❌ Node.js is not installed. Please install Node.js first.');
  process.exit(1);
}

// Create .env file if it doesn't exist
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file...');
  
  const envContent = `# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/learnhub

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Stripe Configuration (for payments)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here

# Email Configuration (optional - for password reset, notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-email-app-password

# File Upload Configuration (optional - for course materials)
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Rate Limiting Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security Configuration
BCRYPT_ROUNDS=12
SESSION_SECRET=your-session-secret-key

# Frontend URL (for CORS and redirects)
FRONTEND_URL=http://localhost:3000

# Admin Configuration
ADMIN_EMAIL=admin@learnhub.com
ADMIN_PASSWORD=admin123

# Feature Flags
ENABLE_EMAIL_VERIFICATION=false
ENABLE_SOCIAL_LOGIN=false
ENABLE_FILE_UPLOADS=true
ENABLE_PAYMENTS=true
ENABLE_CERTIFICATES=true
ENABLE_DISCUSSIONS=true
ENABLE_NOTIFICATIONS=true`;

  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created successfully');
  console.log('⚠️  Please update the .env file with your actual configuration values\n');
} else {
  console.log('✅ .env file already exists');
}

// Install dependencies
console.log('📦 Installing dependencies...');

try {
  // Install backend dependencies
  console.log('Installing backend dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  // Install frontend dependencies
  console.log('Installing frontend dependencies...');
  execSync('cd client && npm install', { stdio: 'inherit' });
  
  console.log('✅ All dependencies installed successfully\n');
} catch (error) {
  console.error('❌ Error installing dependencies:', error.message);
  process.exit(1);
}

// Create uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Uploads directory created');
}

// Create logs directory
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
  console.log('✅ Logs directory created');
}

console.log('\n🎉 Setup completed successfully!');
console.log('\n📋 Next steps:');
console.log('1. Make sure MongoDB is running on your system');
console.log('2. Update the .env file with your configuration values');
console.log('3. Run "npm run dev" to start the development servers');
console.log('4. Open http://localhost:3000 in your browser');
console.log('\n📚 For more information, check the README.md file');
console.log('\nHappy coding! 🚀'); 