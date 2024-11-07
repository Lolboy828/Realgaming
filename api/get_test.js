const fs = require('fs');
const path = require('path');

// Serverless function
module.exports = async (req, res) => {
  console.log('Received request:', req.url);

  const userId = req.query.userid;
    
  if (!userId) {
    console.log('No userId provided');
    return res.status(400).json({ message: 'userId is required' });
  }

  try {
    console.log('Reading users from local file...');
    const filePath = path.join(__dirname, 'users.json');
    const data = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '[]';
    const users = JSON.parse(data);

    console.log('Searching for user...');
    const user = users.find(u => u.userId === userId);
    
    if (user && user.key) {
      console.log('User found:', user);
      res.status(200).json({ key: user.key, userId: user.userId });
    } else {
      console.log('User not found or key not set');
      res.status(404).json({ message: 'User not found or key not set' });
    }

    // Print all users
    console.log('All users:', users);

  } catch (error) {
    console.error("Error fetching user key:", error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
