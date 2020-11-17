// ==============================================================================
// DEPENDENCIES
// Series of npm packages that we will use to give our server useful functionality
// ==============================================================================

const express = require('express');
const axios = require('axios');
require('dotenv').config();
// ==============================================================================
// EXPRESS CONFIGURATION
// This sets up the basic properties for our express server
// ==============================================================================

// Tells node that we are creating an "express" server
const app = express();

// Sets an initial port. We"ll use this later in our listener
const PORT = process.env.PORT || 3000;

// Sets up the Express app to handle data parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
const requestObj = {
  grant_type: 'client_credentials',
  client_id: process.env.apikey,
  client_secret: process.env.secret,
};
let actualToken = '';
let tokenExpire = 0;
const token = async () => axios.post('https://api.petfinder.com/v2/oauth2/token', requestObj).then((results) => {
  tokenExpire = new Date().getTime() + (results.data.expires_in * 1000);
  actualToken = results.data.access_token;
  return actualToken;
});
const getRequest = async (bearer, proxyURL) => {
  const config = {
    headers: { Authorization: `Bearer ${bearer}` },
  };
  return axios.get(`https://api.petfinder.com/v2${proxyURL}`, config).then((results) => results).catch((err) => err);
};
// ================================================================================
// ROUTER
// The below points our server to a series of "route" files.
// These routes give our server a "map" of how to respond when users visit or
// request data from various URLs.
// ================================================================================
app.get('*', async (req, res) => {
  const proxyURL = req.originalUrl;
  console.log(proxyURL, '<=========');
  if (proxyURL.includes('favicon.ico') || proxyURL === '/') {
    res.status(200).end();
    return;
  }
  console.log(actualToken === '', actualToken);
  if (tokenExpire < new Date().getTime() || !actualToken.length) {
    try {
      const response = await getRequest(await token(), proxyURL).catch((err) => console.log(err));
      if (response.status !== 404 && response.name !== 'Error') {
        res.json(response.data);
      } else {
        console.log('>>>>error<<<');
        res.json({ error: 'url error' });
      }
    } catch (err) {
      console.log(err, '........');
    }
  } else {
    try {
      const response = await getRequest(actualToken, proxyURL).catch((err) => console.log(err));
      if (response.status !== 404 && response.name !== 'Error') {
        res.json(response.data);
      } else {
        console.log('>>>>error<<<');
        res.json({ error: 'url error' });
      }
    } catch (err) {
      console.log(err, '........');
    }
  }
});

// =============================================================================
// LISTENER
// The below code effectively "starts" our server
// =============================================================================

app.listen(PORT, () => {
  console.log(`App listening on PORT: ${PORT}`);
});
