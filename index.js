require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const shortid = require('shortid');
const validUrl = require('valid-url');
const dns = require('dns');

// Basic Configuration
const port = process.env.PORT || 3000;

// Middleware для обработки URL-кодированных данных
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


// Подключаемся к базе данных
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 20000, // Увеличение тайм-аута до 20 секунд
})
  .then(() => console.log('Successfully connected to MongoDB Atlas'))
  .catch(err => console.error('Connection error', err));


var urlSchema = new mongoose.Schema({
  originalUrl: { type: String, required: true },
  shortUrl: { type: String, required: true, unique: true },
});

// Создаем модель и присваиваем её переменной URL
var Url = mongoose.model("Url", urlSchema);


app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});


app.post('/api/shorturl', async (req, res) => {
  var { url } = req.body;

  if (!validUrl.isUri(url)) return res.json({ error: 'invalid url' });

  // проверка домена
  var urlParts = new URL(url);
  dns.lookup(urlParts.hostname, async (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

  // проверка url

  var shortUrl = shortid.generate();
  var newUrl = new Url({ originalUrl: url, shortUrl });

  try {
    await newUrl.save();
    return res.json({ original_url: url, short_url: shortUrl });
  } catch (error) {
      return res.json({ error: 'Failed to save URL' });
    }
  });
});


app.get('/api/shorturl/:short_url', async (req, res) => {
  var { short_url } = req.params;

  try {
    var urlEntry = await Url.findOne({ shortUrl: short_url });
    if (urlEntry) return res.redirect(urlEntry.originalUrl);
    else return res.json({ error: 'Url not found' });
  } catch (error) { 
      return res.json({ error: 'Server error' });
  }
});



app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

