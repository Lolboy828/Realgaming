const { MongoClient, ServerApiVersion } = require('mongodb');
const axios = require('axios');

// MongoDB URI setup
const uri = "mongodb+srv://miirooz:DEiyaqn3EGPWSjPG45hTUJa1dhEgQ9Fx@key-db.7u2jo.mongodb.net/?retryWrites=true&w=majority&appName=Key-DB";
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Function to generate a random key
function generateKey() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = '';
  for (let i = 0; i < 16; i++) {
    key += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return key;
}

// Store or update user key in MongoDB
async function storeUserKey(userId) {
  try {
    await client.connect();
    const db = client.db('key-db');
    const usersCollection = db.collection('users');

    const newKey = generateKey();
    await usersCollection.updateOne(
      { userId: userId },
      { $set: { key: newKey } },
      { upsert: true }
    );
    console.log(`Stored new key for user ${userId}`);
    return newKey;
  } catch (error) {
    console.error("Error storing user key:", error);
    throw error;
  } finally {
    await client.close();
  }
}

// Fetch user ID based on username
async function getUserId(username) {
  try {
    const response = await axios.post('https://users.roblox.com/v1/usernames/users', {
      usernames: [username],
      excludeBannedUsers: true,
    });
    const userData = response.data.data;
    return userData.length > 0 ? userData[0].id : null;
  } catch (error) {
    console.error("Error fetching user ID:", error);
    return null;
  }
}

// Serverless function
module.exports = async (req, res) => {
  console.log('Received request:', req.url);

  // Handle different routes
  if (req.url.startsWith('/api/getkey')) {
    // Get user key
    const userId = req.query.userid;
    
    if (!userId) {
      console.log('No userId provided');
      return res.status(400).json({ message: 'userId is required' });
    }

    try {
      console.log('Connecting to database...');
      await client.connect();
      console.log('Connected to database');
      const db = client.db('key-db');
      const usersCollection = db.collection('users');
      
      console.log('Searching for user...');
      const user = await usersCollection.findOne({ userId: userId });
      
      if (user && user.key) {
        console.log('User found:', user);
        res.status(200).json({ key: user.key, userId: user.userId });
      } else {
        console.log('User not found or key not set');
        res.status(404).json({ message: 'User not found or key not set' });
      }
    } catch (error) {
      console.error("Error fetching user key:", error);
      res.status(500).json({ message: 'Internal server error' });
    } finally {
      console.log('Closing database connection');
      await client.close();
    }
  } else if (req.url.startsWith('/api/storekey')) {
    // Store or update key for a specific user
    const username = req.query.username;
    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }

    try {
      const userId = await getUserId(username);
      if (userId) {
        const newKey = await storeUserKey(userId);
        res.status(200).json({ message: 'Key stored successfully', userId: userId, key: newKey });
      } else {
        res.status(404).json({ message: 'User not found' });
      }
    } catch (error) {
      console.error("Error storing key:", error);
      res.status(500).json({ message: 'Internal server error' });
    }
  } else {
    // Invalid route
    res.status(404).json({ message: 'Invalid route' });
  }
};
