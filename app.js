const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const fs = require('fs');
const AWS = require('aws-sdk');
require('dotenv').config();


const app = express();
app.use(bodyParser.json());


const convertBase64ToImage = (base64Image, imageName) => {
  const imageBuffer = Buffer.from(base64Image, 'base64');
  fs.writeFileSync(imageName, imageBuffer);
};
const convertS3UrlToLocalFile = async (s3Url, localFilePath) => {
  const response = await axios.get(s3Url, { responseType: 'arraybuffer' });
  fs.writeFileSync(localFilePath, Buffer.from(response.data, 'binary'));
};

const uploadImageToS3 = (imageName, callback) => {
  const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  });

  const uploadParams = {
    Bucket: process.env.BUCKET,
    Key: imageName,
    Body: fs.createReadStream(imageName),
  };

  s3.upload(uploadParams, function (err, data) {
    if (err) {
      console.error('Error uploading image to S3:', err);
      callback(err);
    } else {
      const s3ImageUrl = data.Location;
      callback(null, s3ImageUrl);
    }
    fs.unlinkSync(imageName);
  });
};

app.post('/text2img', async (req, res) => {
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
});
app.post('/img2img', async (req, res) => {
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
});


function generateImageName() {
 
  const timestamp = Date.now();
  return `image_${timestamp}.jpg`;
}

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});