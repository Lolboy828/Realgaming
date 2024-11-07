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

// Key generation setup 
let currentKey = generateKey();
let lastGenerated = Date.now();

// Function to generate a random key
function generateKey() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = '';
  for (let i = 0; i < 16; i++) {
    key += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return key;
}

// Store user keys in MongoDB (without duplicate)
async function storeUserKey(userId, key) {
  try {
    await client.connect();
    const db = client.db('key-db');
    const usersCollection = db.collection('users');

    // Ensure the key is unique, otherwise, update or insert the key.
    const existingUser = await usersCollection.findOne({ userId });
    if (!existingUser || existingUser.key !== key) {
      await usersCollection.updateOne(
        { userId: userId },
        { $set: { key: key } },
        { upsert: true }
      );
      console.log(`Stored key for user ${userId}`);
    }
  } catch (error) {
    console.error("Error storing user key:", error);
  } finally {
    await client.close();
  }
}

// Function to update all users with the new key
async function updateAllUserKeys(newKey) {
  try {
    await client.connect();
    const db = client.db('key-db');
    const usersCollection = db.collection('users');

    // Only update if the key is different to avoid redundancy
    const existingKey = await usersCollection.findOne({});
    if (!existingKey || existingKey.key !== newKey) {
      await usersCollection.updateMany(
        {},
        { $set: { key: newKey } }
      );
      console.log("Updated all user keys with the new key.");
    }
  } catch (error) {
    console.error("Error updating all user keys:", error);
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

  // Check if it's time to generate a new key
  if (Date.now() - lastGenerated >= 604800000) { // 1 week in ms
    currentKey = generateKey();
    lastGenerated = Date.now();
    await updateAllUserKeys(currentKey);
  }

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
      
      if (user) {
        console.log('User found:', user);
        res.status(200).json({ key: user.key, userId: user.userId });
      } else {
        console.log('User not found');
        res.status(404).json({ message: 'User not found' });
      }
    } catch (error) {
      console.error("Error fetching user key:", error);
      res.status(500).json({ message: 'Internal server error' });
    } finally {
      console.log('Closing database connection');
      await client.close();
    }
  } else if (req.url.startsWith('/api/storekey')) {
    // Store key for a specific user
    const username = req.query.username;
    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }

    const userId = await getUserId(username);
    if (userId) {
      await storeUserKey(userId, currentKey);
      res.status(200).json({ message: 'Key stored successfully' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } else {
    // Default: return current key
    res.status(200).json({ key: currentKey });
  }
};
