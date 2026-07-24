const mongoose = require('mongoose');

let isConnected = false;

async function initializeDatabase() {
  if (isConnected) {
    console.log('MongoDB already connected');
    return mongoose.connection;
  }

  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI environment variable is not set');
    }

    // Connect to MongoDB
    // Extract database name from URI or use default
    const dbName = mongoUri.match(/\/\/(?:[^/]+\/)?([^?]+)/)?.[1] || 'test';
    
    await mongoose.connect(mongoUri);

    isConnected = true;
    console.log(`✅ MongoDB connected successfully`);
    console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
    
    return mongoose.connection;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

function getDb() {
  if (!isConnected) {
    throw new Error('Database not initialized. Call initializeDatabase first.');
  }
  return mongoose.connection;
}

module.exports = { initializeDatabase, getDb };