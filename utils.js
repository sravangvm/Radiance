const axios = require('axios');
const fs = require('fs');
const AWS = require('aws-sdk');
require('dotenv').config();

const generateImageName = () => {
  const timestamp = Date.now();
  return `image_${timestamp}.jpg`;
};

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

module.exports = {
  generateImageName,
  convertBase64ToImage,
  convertS3UrlToLocalFile,
  uploadImageToS3,
};
