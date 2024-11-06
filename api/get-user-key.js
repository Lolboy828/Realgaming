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

// API to get the current key and check if it's time for a new one
module.exports = async (req, res) => {
  if (Date.now() - lastGenerated >= 604800000) { // 1 week in ms
    currentKey = generateKey();
    lastGenerated = Date.now();
    await updateAllUserKeys(currentKey);
  }

  res.status(200).json({ key: currentKey });
};

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

// Store key for a specific user
async function storeKeyForUser(username) {
  const userId = await getUserId(username);
  if (userId) {
    await storeUserKey(userId, currentKey);
  }
}

// Example usage: Store the current key for a specific user
//storeKeyForUser("Highdr0p");

// Endpoint to get a user's key based on their userId
module.exports.getUserKey = async (req, res) => {
  const userId = req.params.userId;
  
  try {
    await client.connect();
    const db = client.db('key-db');
    const usersCollection = db.collection('users');
    
    const user = await usersCollection.findOne({ userId: userId });
    
    if (user) {
      res.status(200).json({ key: user.key, userId: user.userId });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error("Error fetching user key:", error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    await client.close();
  }
};