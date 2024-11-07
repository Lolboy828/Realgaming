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

// Serverless function
module.exports = async (req, res) => {
  console.log('Received request:', req.url);

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

    // Fetch and print all users in the collection
    const allUsers = await usersCollection.find().toArray();
    console.log('All users in the database:', allUsers);

  } catch (error) {
    console.error("Error fetching user key:", error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    console.log('Closing database connection');
    await client.close();
  }
};
