const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 3000;

// Key generation setup
let currentKey = generateKey();
let lastGenerated = Date.now();

function generateKey() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = '';
  for (let i = 0; i < 16; i++) {
    key += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  console.log("Generated Key:", key);

  // Call Lootlabs API to create an encrypted redirect link after generating a new key
  createLootRedirectLink(key);

  return key;
}

function createLootRedirectLink(key) {
const url = 'https://be.lootlabs.gg/api/lootlabs/content_locker';

const headers = {
    Authorization: 'Bearer 13d2e09b86334c6e84e75b26adb786d571a8653bb05566f81d17f350fddc54fb'
};


const data = {
  "title": "RStudios Key",
  "url": "https://yourlinkhere.com",
  "tier_id": 1,
  "number_of_tasks": 1,
  "theme": 3,
  "thumbnail": "https://cdn.discordapp.com/icons/1297643917885571165/78d69b1fd641a76bf6333ad918740b02.webp?size=1024&format=webp&width=640&height=640"

};

axios.post(url, data, { headers: headers })
    .then(response => {
        console.log(response.data);

    })
    .catch(error => {
        console.error('Error:', error);
    });
}


app.get('/get-key', (req, res) => {
  const now = Date.now();

  if (now - lastGenerated >= 1800000) { // Regenerate key every 30 minutes
    currentKey = generateKey();
    lastGenerated = now;
  }

  res.json({ key: currentKey });
});

// Middleware to check for lootlabs referrer
app.use('/index.html', (req, res, next) => {
  const referrer = req.get('Referer');
  
  if (referrer && referrer.includes('lootlabs')) {
    next(); // Allow access
  } else {
    res.status(403).send('Access Denied');
  }
});

// Serve static files from the public directory
app.use(express.static('public'));

// Server setup
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
