// ==============================================================================
// DEPENDENCIES
// Series of npm packages that we will use to give our server useful functionality
// ==============================================================================

const express = require("express");
const axios = require('axios');
require('dotenv').config()
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
    grant_type: "client_credentials",
    client_id: process.env.apikey,
    client_secret: process.env.secret
}
let actualToken = ""
let tokenExpire = 0
const token = async () => {
    return axios.post("https://api.petfinder.com/v2/oauth2/token", requestObj).then((results) => {
        console.log("New Token!!")
        tokenExpire = new Date().getTime() + (results.expires_in*1000)
     return actualToken = results.data.access_token
    })
}
const getRequest = async (bearer, proxyURL) => {
    
    const config = {
        headers: { Authorization: `Bearer ${bearer}` }
    };
    return axios.get(`https://api.petfinder.com/v2/${proxyURL}`, config).then((results) => results)
}
// ================================================================================
// ROUTER
// The below points our server to a series of "route" files.
// These routes give our server a "map" of how to respond when users visit or request data from various URLs.
// ================================================================================
app.get("/:proxyURL", async (req, res) => {
    const proxyURL = req.params.proxyURL
    if(proxyURL==='favicon.ico'){
        res.status(200).end()
        return
    }
    if (tokenExpire < new Date().getTime()){
        
        const response = await getRequest(await token() , proxyURL).catch(err=>console.log(err))
        res.json(response.data)}

    else {
        const response = await getRequest(actualToken , proxyURL).catch(err=>console.log(err))
        res.json(response.data)
    }
})

// =============================================================================
// LISTENER
// The below code effectively "starts" our server
// =============================================================================

app.listen(PORT, function () {
    console.log("App listening on PORT: " + PORT);
});