const { MongoClient, ServerApiVersion } = require('mongodb');
const { performance } = require('perf_hooks');

// MongoDB URI setup
const uri = "mongodb+srv://miirooz:DEiyaqn3EGPWSjPG45hTUJa1dhEgQ9Fx@key-db.7u2jo.mongodb.net/?retryWrites=true&w=majority&appName=Key-DB";
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// The serverless function handler
module.exports = async (req, res) => {
  const { userId } = req.query;

  // Check if userId query parameter is provided
  if (!userId) {
    return res.status(400).json({ message: 'userId parameter is required' });
  }

  // Measure the time it takes to execute the MongoDB query
  const startTime = performance.now();

  try {
    // Connect to MongoDB
    await client.connect();
    const db = client.db('key-db');
    const usersCollection = db.collection('users');

    // Find the user by userId
    const user = await usersCollection.findOne({ userId: userId });

    // Measure query duration and log it
    const endTime = performance.now();
    console.log(`MongoDB query took ${endTime - startTime}ms`);

    // If user is found, return their key
    if (user) {
      res.status(200).json({ key: user.key, userId: user.userId });
    } else {
      // If user not found, return a 404 error
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    // Log and return an error message
    console.error("Error fetching user key:", error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    // Ensure the client is closed after the operation
    await client.close();
  }
};
