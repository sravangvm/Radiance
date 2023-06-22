const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

app.post('/api/fetch-response', async (req, res) => {
  try {
    const url = 'http://15.204.217.57:7860/sdapi/v1/txt2img';

    const requestBody = req.body; 

    const response = await axios.post(url, requestBody);

    res.json(response.data); 
  } catch (error) {
    console.error('Error fetching response:', error);
    res.status(500).json({ error: 'An error occurred' }); 
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
