const axios = require('axios');
const fs = require('fs');
const AWS = require('aws-sdk');
const { generateImageName, convertBase64ToImage, convertS3UrlToLocalFile, uploadImageToS3 } = require('./utils');
require('dotenv').config();

const text2img = async (req, res) => {
  try {
    const url = process.env.ML_CODEBASE_URL_Txt2Img;
    const requestBody = req.body;
    const response = await axios.post(url, requestBody);

    const base64Image = response.data.images[0];
    const imageName = generateImageName();

    convertBase64ToImage(base64Image, imageName);

    uploadImageToS3(imageName, (err, s3ImageUrl) => {
      if (err) {
        console.error('Error uploading image to S3:', err);
        res.status(500).json({ error: 'An error occurred' });
      } else {
        response.data.images[0] = s3ImageUrl;
        res.json(response.data);
      }
    });
  } catch (error) {
    console.error('Error fetching response:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
};

const img2img = async (req, res) => {
  try {
    const targetUrl = process.env.ML_CODEBASE_URL_Img2Img;
    const s3ImageUrl = req.body.init_images[0]; // The S3 URL of the image

    // Convert S3 URL to local file
    const localFilePath = './temp.jpg'; // Specify the desired local file path
    await convertS3UrlToLocalFile(s3ImageUrl, localFilePath);

    // Read the local file
    const imageBuffer = fs.readFileSync(localFilePath);

    // Send the request to the target API endpoint
    const response = await axios.post(targetUrl, {
      init_images: [`data:image/jpeg;base64,${imageBuffer.toString('base64')}`],
      // Include other required parameters
    });

    // Clean up the temporary local file
    fs.unlinkSync(localFilePath);

    const base64Image = response.data.images[0];
    const imageName = generateImageName();

    convertBase64ToImage(base64Image, imageName);

    uploadImageToS3(imageName, (err, s3ImageUrl) => {
      if (err) {
        console.error('Error uploading image to S3:', err);
        res.status(500).json({ error: 'An error occurred' });
      } else {
        response.data.images[0] = s3ImageUrl;
        res.json(response.data);
      }
    });
  } catch (error) {
    console.error('Error fetching response:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
};

module.exports = {
  text2img,
  img2img,
};
