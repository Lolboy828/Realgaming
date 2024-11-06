const { MongoClient, ServerApiVersion } = require('mongodb');

// MongoDB URI setup
const uri = "mongodb+srv://miirooz:DEiyaqn3EGPWSjPG45hTUJa1dhEgQ9Fx@key-db.7u2jo.mongodb.net/?retryWrites=true&w=majority&appName=Key-DB";
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Endpoint to get a user's key based on their userId in the URL
module.exports = async (req, res) => {
  const { userId } = req.query; // Get userId from query parameter

  if (!userId) {
    return res.status(400).json({ message: 'userId parameter is required' });
  }

  try {
    await client.connect();
    const db = client.db('key-db');
    const usersCollection = db.collection('users');
    
    // Find the user by userId
    const user = await usersCollection.findOne({ userId: userId });
    
    if (user) {
      // If user found, return the key and userId
      res.status(200).json({ key: user.key, userId: user.userId });
    } else {
      // If user not found, return 404
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error("Error fetching user key:", error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    await client.close();
  }
};
