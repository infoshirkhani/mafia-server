
require('dotenv').config();

const express = require('express');
const { AccessToken } = require('livekit-server-sdk');
const fs = require('fs');
const path = require('path');

const app = express();

const PORT = Number(process.env.PORT) || 3000;
const APP_VERSION = '1.0.0';

app.disable('x-powered-by');

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: APP_VERSION
  });
});

// دریافت توکن اتصال LiveKit
app.get('/token', async (req, res) => {
  try {
    const { room, user } = req.query;

    if (!room || !user) {
      return res.status(400).json({
        error: 'نام اتاق و نام کاربری الزامی است.'
      });
    }

    if (
      typeof room !== 'string' ||
      typeof user !== 'string' ||
      room.length > 100 ||
      user.length > 100
    ) {
      return res.status(400).json({
        error: 'اطلاعات اتاق یا کاربر معتبر نیست.'
      });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      console.error('LiveKit credentials are missing.');

      return res.status(500).json({
        error: 'تنظیمات اتصال LiveKit کامل نیست.'
      });
    }

    const accessToken = new AccessToken(
      apiKey,
      apiSecret,
      {
        identity: user,
        ttl: '2h'
      }
    );

    accessToken.addGrant({
      roomJoin: true,
      room: room,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true
    });

    const token = await accessToken.toJwt();

    return res.json({
      token,
      serverUrl: process.env.LIVEKIT_URL
    });

  } catch (error) {
    console.error('Token generation error:', error);

    return res.status(500).json({
      error: 'خطا در ساخت توکن اتصال.'
    });
  }
});

// صفحه اصلی
app.get('/', (req, res) => {
  res.redirect('/test');
});

// صفحه آزمایشی و رابط کاربری
app.get('/test', (req, res) => {
  const livekitUrl = process.env.LIVEKIT_URL;

  if (!livekitUrl) {
    return res.status(500).send(
      'خطا: LIVEKIT_URL در فایل تنظیمات تعریف نشده است.'
    );
  }

  const indexPath = path.join(__dirname, 'index.html');

  fs.readFile(indexPath, 'utf8', (error, html) => {
    if (error) {
      console.error('HTML loading error:', error);

      return res.status(500).send(
        'فایل index.html پیدا نشد. مسیر فایل را بررسی کنید.'
      );
    }

    const finalHtml = html
      .replace(/%%LIVEKIT_URL%%/g, livekitUrl)
      .replace(/%%VERSION%%/g, APP_VERSION)
      .replace(
        /%%RANDOM%%/g,
        String(Date.now())
      );

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');

    return res.send(finalHtml);
  });
});

// مدیریت خطاهای مسیرهای ناشناخته
app.use((req, res) => {
  res.status(404).json({
    error: 'مسیر موردنظر پیدا نشد.'
  });
});

// مدیریت خطاهای عمومی
app.use((error, req, res, next) => {
  console.error('Server error:', error);

  if (res.headersSent) {
    return next(error);
  }

  res.status(500).json({
    error: 'خطای داخلی سرور.'
  });
});

app.listen(PORT, () => {
  console.log('================================');
  console.log('MAFIA SERVER STARTED');
  console.log('Version:', APP_VERSION);
  console.log('Port:', PORT);
  console.log('================================');
});
