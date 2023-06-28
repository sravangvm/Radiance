const express = require('express');
const router = express.Router();
const { text2img, img2img } = require('./controllers');

router.post('/text2img', text2img);
router.post('/img2img', img2img);

module.exports = router;