const fs = require('fs');
const path = require('path');

// Path to store the data locally
const dataFilePath = path.join(__dirname, 'userKeys.json');

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

// Read user data from the JSON file
function readUserData() {
  if (fs.existsSync(dataFilePath)) {
    const fileData = fs.readFileSync(dataFilePath);
    return JSON.parse(fileData);
  }
  return {}; // If no file exists, return an empty object
}

// Save user data to the JSON file
function saveUserData(userData) {
  fs.writeFileSync(dataFilePath, JSON.stringify(userData, null, 2));
}

// Store user keys in the JSON file (without duplicates)
function storeUserKey(userId, key) {
  const userData = readUserData();

  if (!userData[userId] || userData[userId] !== key) {
    userData[userId] = key;
    saveUserData(userData);
    console.log(`Stored key for user ${userId}`);
  }
}

// API to get the current key and check if it's time for a new one
module.exports = async (req, res) => {
  const userId = req.query.userId;
  
  // If a userId is provided, return that user’s key
  if (userId) {
    const userData = readUserData();
    const key = userData[userId];
    
    if (key) {
      return res.status(200).json({ userId: userId, key: key });
    } else {
      return res.status(404).json({ message: "User key not found" });
    }
  }

  // If no userId is provided, return the current key
  if (Date.now() - lastGenerated >= 604800000) { // 1 week in ms
    currentKey = generateKey();
    lastGenerated = Date.now();
    await updateAllUserKeys(currentKey);
  }

  res.status(200).json({ key: currentKey });
};

// Function to update all users with the new key
async function updateAllUserKeys(newKey) {
  const userData = readUserData();

  for (const userId in userData) {
    userData[userId] = newKey;
  }

  saveUserData(userData);
  console.log("Updated all user keys with the new key.");
}

// Store key for a specific user
async function storeKeyForUser(userId) {
  storeUserKey(userId, currentKey);
}

// Example usage: Store the current key for a specific user
storeKeyForUser("832525972");

