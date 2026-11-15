
require('dotenv').config();

const express = require('express');
const { AccessToken } = require('livekit-server-sdk');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const APP_VERSION = 'v0.0.3';
const MAIN_ROOM = 'mafia-main';

app.get('/token', async (req, res) => {
  try {
    const user = String(req.query.user || '').trim();

    if (!user) {
      return res.status(400).json({
        error: 'نام کاربری الزامی است'
      });
    }

    if (user.length > 64) {
      return res.status(400).json({
        error: 'نام کاربری بیش از حد طولانی است'
      });
    }

    if (!process.env.LIVEKIT_API_KEY ||
        !process.env.LIVEKIT_API_SECRET) {
      return res.status(500).json({
        error: 'تنظیمات LiveKit کامل نیست'
      });
    }

    const accessToken = new AccessToken(
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET,
      {
        identity: user,
        ttl: '2h'
      }
    );

    accessToken.addGrant({
      roomJoin: true,
      room: MAIN_ROOM,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true
    });

    res.json({
      token: await accessToken.toJwt(),
      room: MAIN_ROOM
    });

  } catch (error) {
    console.error('Token error:', error);

    res.status(500).json({
      error: 'خطا در ساخت توکن ورود'
    });
  }
});

app.get('/', (req, res) => {
  res.redirect('/test');
});

app.get('/test', (req, res) => {
  const livekitUrl = process.env.LIVEKIT_URL;

  if (!livekitUrl) {
    return res.status(500).send(
      'خطا: LIVEKIT_URL تعریف نشده است.'
    );
  }

  fs.readFile(
    path.join(__dirname, 'index.html'),
    'utf8',
    (error, html) => {
      if (error) {
        console.error(error);

        return res.status(500).send(
          'فایل index.html پیدا نشد.'
        );
      }

      const finalHtml = html
        .replace(
          '</head>',
          `<script>window.LIVEKIT_URL=${JSON.stringify(livekitUrl)};</script></head>`
        )
        .replace(/%%VERSION%%/g, APP_VERSION)
        .replace(
          /%%RANDOM%%/g,
          String(Math.floor(Math.random() * 1000))
        );

      res.send(finalHtml);
    }
  );
});

app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
  console.log('Active room: ' + MAIN_ROOM);
});
