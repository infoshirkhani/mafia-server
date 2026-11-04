require('dotenv').config();
const express = require('express');
const { AccessToken } = require('livekit-server-sdk');

const app = express();

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

app.get('/test', (req, res) => {
  // خواندن آدرس از متغیرهای محیطی در سمت سرور
  const livekitUrl = process.env.LIVEKIT_URL;
  
  if (!livekitUrl) {
    return res.status(500).send('خطا: LIVEKIT_URL در تنظیمات سرور تعریف نشده است.');
  }

  res.send(`
    <!DOCTYPE html>
    <html lang="fa" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>اتاق تست مافیا</title>
        <script src="https://cdn.jsdelivr.net/npm/livekit-client/dist/livekit-client.umd.min.js"></script>
        <style>
            body { font-family: Tahoma, sans-serif; background: #1e1e1e; color: #fff; padding: 20px; display: flex; flex-direction: column; align-items: center; }
            .box { background: #2d2d2d; padding: 20px; border-radius: 12px; width: 100%; max-width: 400px; box-shadow: 0 4px 10px rgba(0,0,0,0.5); }
            input { width: 100%; padding: 12px; margin: 10px 0; border-radius: 8px; border: 1px solid #444; background: #111; color: #fff; box-sizing: border-box; font-size: 16px; }
            button { padding: 12px; font-size: 16px; margin: 5px 0; border-radius: 8px; border: none; cursor: pointer; width: 100%; font-weight: bold; }
            #joinBtn { background: #28a745; color: white; }
            #leaveBtn { background: #dc3545; color: white; display: none; }
            #micBtn { background: #007bff; color: white; display: none; }
            #micBtn.muted { background: #6c757d; }
            .player { display: flex; justify-content: space-between; padding: 10px; background: #111; margin: 5px 0; border-radius: 6px; border-left: 4px solid #555; }
            .player.speaking { border-left-color: #28a745; background: #1e3a22; }
            .player.me { border-left-color: #007bff; }
            .status { font-size: 12px; color: #aaa; }
            #roomUI { display: none; }
        </style>
    </head>
    <body>
        <div class="box" id="loginUI">
            <h2 style="text-align:center;">ورود به اتاق</h2>
            <input type="text" id="username" placeholder="اسم خودت را بنویس (مثلاً علی)" value="user_${Math.floor(Math.random()*1000)}">
            <input type="text" id="roomname" placeholder="نام اتاق" value="mafia-room">
            <button id="joinBtn">ورود به اتاق</button>
        </div>

        <div class="box" id="roomUI">
            <h3 style="text-align:center; margin-top:0;">👥 بازیکنان اتاق</h3>
            <div id="playersList"></div>
            <button id="micBtn">🎙️ قطع میکروفن</button>
            <button id="leaveBtn">🚪 خروج از اتاق</button>
        </div>

        <div id="audio-container"></div>

        <script>
            // آدرس از سمت سرور تزریق می‌شود
            const LIVEKIT_URL = "${livekitUrl}";
            const room = new LivekitClient.Room();
            const loginUI = document.getElementById('loginUI');
            const roomUI = document.getElementById('roomUI');
            const playersList = document.getElementById('playersList');
            const joinBtn = document.getElementById('joinBtn');
            const micBtn = document.getElementById('micBtn');
            const leaveBtn = document.getElementById('leaveBtn');
            const audioContainer = document.getElementById('audio-container');

            room.on(LivekitClient.RoomEvent.TrackSubscribed, (track) => {
                if (track.kind === 'audio') {
                    const el = track.attach();
                    audioContainer.appendChild(el);
                }
            });

            function updatePlayers() {
                playersList.innerHTML = '';
                const localP = room.localParticipant;
                const myDiv = document.createElement('div');
                myDiv.className = 'player me';
                myDiv.innerHTML = '<span>' + localP.identity + ' (من)</span><span class="status">' + (localP.isMicrophoneEnabled ? '🎙️ فعال' : '🔇 قطع') + '</span>';
                playersList.appendChild(myDiv);

                room.remoteParticipants.forEach(p => {
                    const pDiv = document.createElement('div');
                    pDiv.className = 'player';
                    if (p.isSpeaking) pDiv.classList.add('speaking');
                    pDiv.innerHTML = '<span>' + p.identity + '</span><span class="status">' + (p.isMicrophoneEnabled ? '🎙️ فعال' : '🔇 قطع') + '</span>';
                    playersList.appendChild(pDiv);
                });
            }

            room.on(LivekitClient.RoomEvent.ParticipantConnected, updatePlayers);
            room.on(LivekitClient.RoomEvent.ParticipantDisconnected, updatePlayers);
            room.on(LivekitClient.RoomEvent.TrackMuted, updatePlayers);
            room.on(LivekitClient.RoomEvent.TrackUnmuted, updatePlayers);
            room.on(LivekitClient.RoomEvent.ActiveSpeakersChanged, updatePlayers);

            joinBtn.onclick = async () => {
                const user = document.getElementById('username').value.trim();
                const rm = document.getElementById('roomname').value.trim();
                if (!user || !rm) return alert('اسم و نام اتاق را وارد کن!');
                
                joinBtn.innerText = 'در حال اتصال...';
                joinBtn.disabled = true;

                try {
                    const res = await fetch('/token?room=' + encodeURIComponent(rm) + '&user=' + encodeURIComponent(user));
                    const data = await res.json();
                    if(data.error) throw new Error(data.error);

                    await room.connect(LIVEKIT_URL, data.token);
                    await room.localParticipant.setMicrophoneEnabled(true); 
                    
                    loginUI.style.display = 'none';
                    roomUI.style.display = 'block';
                    leaveBtn.style.display = 'block';
                    micBtn.style.display = 'block';
                    micBtn.classList.remove('muted');
                    micBtn.innerText = '🎙️ قطع میکروفن';
                    
                    updatePlayers();
                } catch (e) {
                    alert('خطا: ' + e.message);
                    joinBtn.innerText = 'ورود به اتاق';
                    joinBtn.disabled = false;
                }
            };

            micBtn.onclick = async () => {
                const isMicOn = room.localParticipant.isMicrophoneEnabled;
                await room.localParticipant.setMicrophoneEnabled(!isMicOn);
                if (isMicOn) {
                    micBtn.classList.add('muted');
                    micBtn.innerText = '🔇 وصل کردن میکروفن';
                } else {
                    micBtn.classList.remove('muted');
                    micBtn.innerText = '🎙️ قطع میکروفن';
                }
                updatePlayers();
            };

            leaveBtn.onclick = async () => {
                await room.disconnect();
                loginUI.style.display = 'block';
                roomUI.style.display = 'none';
                leaveBtn.style.display = 'none';
                micBtn.style.display = 'none';
                joinBtn.innerText = 'ورود به اتاق';
                joinBtn.disabled = false;
                audioContainer.innerHTML = '';
                playersList.innerHTML = '';
            };
        </script>
    </body>
    </html>
  `);
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Server running on port ' + (process.env.PORT || 3000));
});
