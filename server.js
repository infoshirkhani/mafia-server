require('dotenv').config();
const express = require('express');
const { AccessToken } = require('livekit-server-sdk');
const fs = require('fs');
const path = require('path');

const app = express();
const APP_VERSION = "v0.0.2";

app.get('/token', async (req, res) => {
  try {
    const { room, user } = req.query;
    if (!room || !user) return res.status(400).json({ error: 'نام اتاق و نام کاربری الزامی است' });

    const at = new AccessToken(
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET,
      { identity: user, ttl: '2h' }
    );
    at.addGrant({ roomJoin: true, room: room });

    res.json({ token: await at.toJwt() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/', (req, res) => res.redirect('/test')); // اگر کسی آدرس اصلی رو زد، بفرستش به /test

app.get('/test', (req, res) => {
  const livekitUrl = process.env.LIVEKIT_URL;
  if (!livekitUrl) return res.status(500).send('خطا: LIVEKIT_URL تعریف نشده است.');

  fs.readFile(path.join(__dirname, 'index.html'), 'utf8', (err, html) => {
    if (err) {
      console.error(err);
      return res.status(500).send('خطا: فایل index.html در گیت‌هاب پیدا نشد یا در مسیر درستی نیست.');
    }
    
    let finalHtml = html
      .replace(/%%LIVEKIT_URL%%/g, livekitUrl)
      .replace(/%%VERSION%%/g, APP_VERSION)
      .replace(/%%RANDOM%%/g, Math.floor(Math.random()*1000));

    res.send(finalHtml);
  });
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Server running on port ' + (process.env.PORT || 3000));
});
