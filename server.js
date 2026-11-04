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
  const livekitUrl = process.env.LIVEKIT_URL;
  
  if (!livekitUrl) {
    return res.status(500).send('خطا: LIVEKIT_URL در تنظیمات سرور تعریف نشده است.');
  }

  res.send(`
    <!DOCTYPE html>
    <html lang="fa" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
        <title>اتاق بازی مافیا</title>
        <script src="https://cdn.jsdelivr.net/npm/livekit-client/dist/livekit-client.umd.min.js"></script>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;700&display=swap');
            
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Vazirmatn', Tahoma, sans-serif; user-select: none; -webkit-tap-highlight-color: transparent; }
            body { background: #0d0d0d; color: #fff; overflow: hidden; height: 100vh; height: 100dvh; display: flex; flex-direction: column; }

            /* --- صفحه ورود --- */
            #loginUI { position: absolute; inset: 0; background: rgba(0,0,0,0.9); z-index: 100; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 20px; }
            #loginUI .box { background: #1e1e1e; padding: 30px; border-radius: 16px; width: 100%; max-width: 350px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.8); border: 1px solid #333; }
            #loginUI input { width: 100%; padding: 15px; margin: 10px 0; border-radius: 8px; border: 1px solid #444; background: #111; color: #fff; font-size: 16px; text-align: center; }
            #loginUI button { width: 100%; padding: 15px; margin-top: 15px; border-radius: 8px; border: none; background: #28a745; color: #fff; font-size: 18px; font-weight: bold; cursor: pointer; }

            /* --- محیط بازی --- */
            #gameRoom { display: none; flex: 1; position: relative; background: radial-gradient(circle at center, #2c1e16 0%, #0d0907 100%); overflow: hidden; }

            /* نوار بالا */
            .top-bar { position: absolute; top: 0; width: 100%; padding: 15px; padding-top: max(15px, env(safe-area-inset-top)); display: flex; justify-content: space-between; align-items: center; z-index: 10; }
            .room-name { font-weight: bold; color: #ffd700; font-size: 16px; text-shadow: 1px 1px 3px #000; }
            .top-actions { display: flex; gap: 10px; }
            .icon-btn { background: rgba(255,255,255,0.1); color: white; border: 1px solid #444; width: 42px; height: 42px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 18px; cursor: pointer; backdrop-filter: blur(5px); }
            .exit-btn { background: #dc3545; color: white; border: none; padding: 0 15px; border-radius: 20px; font-weight: bold; cursor: pointer; height: 42px; font-size: 14px; }

            /* --- محیط میز و صندلی‌ها --- */
            #tableContainer { position: absolute; inset: 0; margin: auto; width: 100%; height: 100%; pointer-events: none; }
            
            /* میز وسط */
            .center-table { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 140px; height: 200px; border-radius: 50%; background: rgba(0,0,0,0.4); border: 2px solid rgba(255,215,0,0.1); box-shadow: inset 0 0 30px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; font-size: 40px; color: rgba(255,215,0,0.15); }
            
            /* استایل عمومی صندلی‌ها */
            .seat { position: absolute; display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: auto; transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
            
            /* وقتی صندلی خالیه، کاملاً نامرئیه */
            .seat.empty { opacity: 0; pointer-events: none; transform: scale(0.5); }

            /* چینش صندلی‌ها (زیگزاگ: راست، چپ) */
            .seat-h1 { top: 10%; left: 30%; }
            .seat-h2 { top: 10%; right: 30%; }
            
            /* ردیف ۱ */
            .seat-r1 { top: 22%; right: 8%; }
            .seat-l1 { top: 22%; left: 8%; }
            /* ردیف ۲ */
            .seat-r2 { top: 31%; right: 3%; }
            .seat-l2 { top: 31%; left: 3%; }
            /* ردیف ۳ */
            .seat-r3 { top: 40%; right: 1%; }
            .seat-l3 { top: 40%; left: 1%; }
            /* ردیف ۴ */
            .seat-r4 { top: 49%; right: 1%; }
            .seat-l4 { top: 49%; left: 1%; }
            /* ردیف ۵ */
            .seat-r5 { top: 58%; right: 1%; }
            .seat-l5 { top: 58%; left: 1%; }
            /* ردیف ۶ */
            .seat-r6 { top: 67%; right: 3%; }
            .seat-l6 { top: 67%; left: 3%; }
            /* ردیف ۷ */
            .seat-r7 { top: 76%; right: 8%; }
            .seat-l7 { top: 76%; left: 8%; }
            /* ردیف ۸ */
            .seat-r8 { top: 85%; right: 15%; }
            .seat-l8 { top: 85%; left: 15%; }

            /* آواتار و شماره */
            .avatar-box { width: 52px; height: 52px; border-radius: 50%; background: #222; border: 2px solid #555; display: flex; justify-content: center; align-items: center; font-size: 20px; position: relative; box-shadow: 0 4px 8px rgba(0,0,0,0.6); }
            .seat.host .avatar-box { border-color: #ffd700; box-shadow: 0 0 15px rgba(255,215,0,0.4); }
            
            .seat-number { position: absolute; top: -4px; left: -4px; background: #333; color: #aaa; width: 22px; height: 22px; border-radius: 50%; font-size: 11px; display: flex; justify-content: center; align-items: center; border: 1px solid #555; font-weight: bold; }
            .seat.host .seat-number { background: #ffd700; color: #000; border-color: #ffd700; }

            /* وضعیت میکروفن و صحبت کردن */
            .avatar-box.speaking { border-color: #28a745; box-shadow: 0 0 20px #28a745; transform: scale(1.15); }
            .avatar-box.muted { border-color: #dc3545; opacity: 0.8; }
            .avatar-box.muted::after { content: '🔇'; position: absolute; bottom: -4px; right: -4px; font-size: 12px; background: #111; border-radius: 50%; padding: 2px; border: 1px solid #444; }
            
            .seat-name { font-size: 11px; margin-top: 5px; background: rgba(0,0,0,0.8); padding: 2px 6px; border-radius: 6px; max-width: 65px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; border: 1px solid #333; text-align: center; }

            /* نشانگر دست */
            .hand-indicator { display: none; position: absolute; top: -15px; right: -10px; font-size: 22px; animation: wave 1s infinite ease-in-out; z-index: 5; }
            .seat.hand-raised .hand-indicator { display: block; }
            @keyframes wave { 0% { transform: rotate(0deg); } 25% { transform: rotate(20deg); } 50% { transform: rotate(0deg); } 75% { transform: rotate(20deg); } 100% { transform: rotate(0deg); } }

            /* استیکرهای شناور */
            .floating-reaction { position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%); font-size: 24px; opacity: 1; animation: floatUp 1.5s ease-out forwards; pointer-events: none; z-index: 50; }
            @keyframes floatUp { 0% { opacity: 1; transform: translate(-50%, 0) scale(1); } 100% { opacity: 0; transform: translate(-50%, -50px) scale(1.5); } }

            /* پیام‌های شناور */
            #notificationArea { position: absolute; top: max(70px, env(safe-area-inset-top)); width: 100%; display: flex; flex-direction: column; align-items: center; pointer-events: none; z-index: 20; gap: 5px; }
            .toast-msg { background: rgba(0, 0, 0, 0.9); color: #fff; padding: 6px 12px; border-radius: 20px; font-size: 13px; border: 1px solid #444; display: flex; align-items: center; gap: 8px; opacity: 0; transform: translateY(-20px); transition: all 0.3s ease; max-width: 90%; word-wrap: break-word; text-align: center; }
            .toast-msg.show { opacity: 1; transform: translateY(0); }
            .toast-msg.hide { opacity: 0; transform: translateY(-20px); }
            .toast-msg .sender-name { color: #ffd700; font-weight: bold; font-size: 11px; }

            /* --- نوار پایین (ریسپانسیو با Safe Area) --- */
            .bottom-bar { position: absolute; bottom: 0; width: 100%; padding: 15px 10px; padding-bottom: max(15px, env(safe-area-inset-bottom)); display: flex; justify-content: space-between; align-items: center; background: linear-gradient(to top, rgba(0,0,0,0.95), transparent); z-index: 10; }
            
            .action-btn { width: 46px; height: 46px; border-radius: 50%; border: none; background: rgba(255,255,255,0.1); color: #fff; font-size: 20px; cursor: pointer; display: flex; justify-content: center; align-items: center; backdrop-filter: blur(5px); transition: all 0.2s; border: 1px solid #333; }
            .action-btn:active { transform: scale(0.9); background: rgba(255,255,255,0.2); }
            .action-btn.active { background: rgba(255, 215, 0, 0.3); border-color: #ffd700; }
            .action-btn.disabled { opacity: 0.3; pointer-events: none; }
            
            .mic-btn-container { position: relative; }
            .mic-btn { width: 76px; height: 76px; border-radius: 50%; border: 4px solid #28a745; background: #111; color: #fff; font-size: 30px; cursor: pointer; display: flex; justify-content: center; align-items: center; box-shadow: 0 0 20px rgba(40, 167, 69, 0.4); transition: all 0.2s ease; margin-top: -20px; }
            .mic-btn.muted { border-color: #dc3545; box-shadow: 0 0 20px rgba(220, 53, 69, 0.4); }
            .mic-btn:active { transform: scale(0.95); }
            #audio-container { display: none; }

            /* مودال چت */
            #chatModal { position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 200; display: none; justify-content: center; align-items: center; padding: 20px; backdrop-filter: blur(4px); }
            .chat-modal-content { background: #1e1e1e; width: 100%; max-width: 400px; border-radius: 16px; padding: 20px; border: 1px solid #333; box-shadow: 0 10px 30px rgba(0,0,0,0.8); display: flex; flex-direction: column; gap: 15px; }
            .chat-modal-content h3 { text-align: center; color: #ffd700; font-size: 18px; }
            .chat-modal-content textarea { width: 100%; height: 100px; padding: 12px; border-radius: 8px; border: 1px solid #444; background: #111; color: #fff; font-size: 16px; resize: none; outline: none; font-family: inherit; }
            .chat-modal-actions { display: flex; gap: 10px; }
            .chat-modal-actions button { flex: 1; padding: 14px; border-radius: 8px; border: none; font-size: 16px; font-weight: bold; cursor: pointer; }
            #sendModalMsgBtn { background: #28a745; color: #fff; }
            #cancelModalBtn { background: #333; color: #fff; }
        </style>
    </head>
    <body>
        <div id="loginUI">
            <div class="box">
                <h2 style="color:#ffd700; margin-bottom: 20px;">🎭 اتاق مافیا</h2>
                <input type="text" id="username" placeholder="نام شما (مثلاً علی)" value="user_${Math.floor(Math.random()*1000)}">
                <input type="text" id="roomname" placeholder="نام اتاق" value="mafia-room">
                <button id="joinBtn">ورود به بازی</button>
            </div>
        </div>

        <div id="gameRoom">
            <div class="top-bar">
                <div class="room-name" id="displayRoomName">اتاق مافیا</div>
                <div class="top-actions">
                    <button class="icon-btn" id="openChatBtn">✉️</button>
                    <button class="exit-btn" id="leaveBtn">خروج</button>
                </div>
            </div>

            <div id="notificationArea"></div>

            <div id="tableContainer">
                <div class="center-table">⚙️</div>
            </div>

            <div class="bottom-bar">
                <button class="action-btn" id="likeBtn">👍</button>
                <button class="action-btn" id="dislikeBtn">👎</button>
                
                <div class="mic-btn-container">
                    <button class="mic-btn muted" id="micBtn">🔇</button>
                </div>
                
                <button class="action-btn" id="raiseHandBtn">✋</button>
                <button class="action-btn" id="infoBtn">ℹ️</button>
            </div>
        </div>

        <div id="chatModal">
            <div class="chat-modal-content">
                <h3>ارسال پیام به اتاق</h3>
                <textarea id="modalChatInput" placeholder="متن پیام خود را اینجا بنویسید..."></textarea>
                <div class="chat-modal-actions">
                    <button id="cancelModalBtn">لغو</button>
                    <button id="sendModalMsgBtn">ارسال</button>
                </div>
            </div>
        </div>

        <div id="audio-container"></div>

        <script>
            const LIVEKIT_URL = "${livekitUrl}";
            const room = new LivekitClient.Room();
            
            const loginUI = document.getElementById('loginUI');
            const gameRoom = document.getElementById('gameRoom');
            const tableContainer = document.getElementById('tableContainer');
            const notificationArea = document.getElementById('notificationArea');
            const micBtn = document.getElementById('micBtn');
            const raiseHandBtn = document.getElementById('raiseHandBtn');
            const likeBtn = document.getElementById('likeBtn');
            const dislikeBtn = document.getElementById('dislikeBtn');
            
            const chatModal = document.getElementById('chatModal');
            const openChatBtn = document.getElementById('openChatBtn');
            const cancelModalBtn = document.getElementById('cancelModalBtn');
            const sendModalMsgBtn = document.getElementById('sendModalMsgBtn');
            const modalChatInput = document.getElementById('modalChatInput');
            
            let localUser = null;
            let isHandRaised = false;
            let lastLikeTime = 0;
            let lastDislikeTime = 0;

            // ترتیب دقیق نشستن: ابتدا گرداننده‌ها، سپس زیگزاگ راست و چپ
            const seatPriority = [
                'seat-h1', 'seat-h2', 
                'seat-r1', 'seat-l1', 'seat-r2', 'seat-l2', 'seat-r3', 'seat-l3', 'seat-r4', 'seat-l4', 
                'seat-r5', 'seat-l5', 'seat-r6', 'seat-l6', 'seat-r7', 'seat-l7', 'seat-r8', 'seat-l8'
            ];

            // ساخت صندلی‌ها
            function createSeats() {
                // گرداننده‌ها
                for(let i=1; i<=2; i++) {
                    const seat = document.createElement('div');
                    seat.className = 'seat seat-h' + i + ' host empty';
                    seat.id = 'seat-h' + i;
                    seat.innerHTML = \`
                        <div class="avatar-box">
                            👑
                            <div class="seat-number">H\${i}</div>
                            <div class="hand-indicator">✋</div>
                        </div>
                        <div class="seat-name">گرداننده \${i}</div>
                    \`;
                    tableContainer.appendChild(seat);
                }

                // ۸ صندلی راست
                for (let i = 1; i <= 8; i++) {
                    const seat = document.createElement('div');
                    seat.className = 'seat seat-r' + i + ' empty';
                    seat.id = 'seat-r' + i;
                    seat.innerHTML = \`
                        <div class="avatar-box">
                            💺
                            <div class="seat-number">\${i}</div>
                            <div class="hand-indicator">✋</div>
                        </div>
                        <div class="seat-name">صندلی \${i}</div>
                    \`;
                    tableContainer.appendChild(seat);
                }

                // ۸ صندلی چپ
                for (let i = 1; i <= 8; i++) {
                    const seat = document.createElement('div');
                    seat.className = 'seat seat-l' + i + ' empty';
                    seat.id = 'seat-l' + i;
                    seat.innerHTML = \`
                        <div class="avatar-box">
                            💺
                            <div class="seat-number">\${i + 8}</div>
                            <div class="hand-indicator">✋</div>
                        </div>
                        <div class="seat-name">صندلی \${i + 8}</div>
                    \`;
                    tableContainer.appendChild(seat);
                }
            }
            createSeats();

            function showNotification(text, sender = null, isSystem = false) {
                const toast = document.createElement('div');
                toast.className = 'toast-msg';
                if (isSystem) {
                    toast.innerHTML = \`<span class="check-icon">✅</span> <span>\${text}</span>\`;
                } else {
                    toast.innerHTML = \`<span class="sender-name">\${sender}:</span> <span>\${text}</span>\`;
                }
                notificationArea.appendChild(toast);
                setTimeout(() => toast.classList.add('show'), 10);
                setTimeout(() => {
                    toast.classList.remove('show');
                    toast.classList.add('hide');
                    setTimeout(() => toast.remove(), 300);
                }, 15000);
            }

            // پیدا کردن اولین صندلی بر اساس اولویت
            function assignSeat(identity, isMuted) {
                let assignedSeat = null;
                for (let id of seatPriority) {
                    const seat = document.getElementById(id);
                    if (seat.classList.contains('empty') || seat.getAttribute('data-identity') === identity) {
                        assignedSeat = seat; 
                        break;
                    }
                }

                if (assignedSeat) {
                    assignedSeat.classList.remove('empty');
                    assignedSeat.setAttribute('data-identity', identity);
                    assignedSeat.querySelector('.seat-name').innerText = identity;
                    assignedSeat.querySelector('.avatar-box').childNodes[0].nodeValue = identity.charAt(0).toUpperCase();
                    updateSeatMicState(identity, isMuted);
                    return assignedSeat;
                } else {
                    showNotification('اتاق پر است!', identity, true);
                }
            }

            function updateSeatMicState(identity, isMuted) {
                const seat = document.querySelector(\`.seat[data-identity="\${identity}"]\`);
                if (seat) {
                    const avatar = seat.querySelector('.avatar-box');
                    if (isMuted) avatar.classList.add('muted');
                    else avatar.classList.remove('muted');
                }
            }

            function updateSpeakingState(speakers) {
                document.querySelectorAll('.avatar-box').forEach(el => el.classList.remove('speaking'));
                speakers.forEach(p => {
                    const seat = document.querySelector(\`.seat[data-identity="\${p.identity}"]\`);
                    if (seat) seat.querySelector('.avatar-box').classList.add('speaking');
                });
            }

            function showReaction(identity, emoji) {
                const seat = document.querySelector(\`.seat[data-identity="\${identity}"]\`);
                if (seat) {
                    const reaction = document.createElement('div');
                    reaction.className = 'floating-reaction';
                    reaction.innerText = emoji;
                    seat.appendChild(reaction);
                    setTimeout(() => reaction.remove(), 1500);
                }
            }

            room.on(LivekitClient.RoomEvent.TrackSubscribed, (track) => {
                if (track.kind === 'audio') document.getElementById('audio-container').appendChild(track.attach());
            });

            room.on(LivekitClient.RoomEvent.ParticipantConnected, (participant) => {
                assignSeat(participant.identity, !participant.isMicrophoneEnabled);
                showNotification(\`وارد اتاق شد\`, participant.identity, true);
            });

            room.on(LivekitClient.RoomEvent.ParticipantDisconnected, (participant) => {
                const seat = document.querySelector(\`.seat[data-identity="\${participant.identity}"]\`);
                if (seat) {
                    const seatText = seat.querySelector('.seat-name').innerText;
                    seat.classList.add('empty');
                    seat.classList.remove('hand-raised');
                    seat.querySelector('.avatar-box').childNodes[0].nodeValue = seat.querySelector('.seat-number').innerText.includes('H') ? '👑' : '💺';
                    seat.querySelector('.avatar-box').className = 'avatar-box';
                    seat.removeAttribute('data-identity');
                }
                showNotification(\`از اتاق خارج شد\`, participant.identity, true);
            });

            room.on(LivekitClient.RoomEvent.TrackMuted, (pub, participant) => {
                if (pub.kind === 'audio') updateSeatMicState(participant.identity, true);
            });
            room.on(LivekitClient.RoomEvent.TrackUnmuted, (pub, participant) => {
                if (pub.kind === 'audio') updateSeatMicState(participant.identity, false);
            });

            room.on(LivekitClient.RoomEvent.ActiveSpeakersChanged, updateSpeakingState);

            room.on(LivekitClient.RoomEvent.DataReceived, (payload, participant) => {
                const data = JSON.parse(new TextDecoder().decode(payload));
                if (data.type === 'chat') {
                    showNotification(data.text, participant.identity, false);
                } 
                else if (data.type === 'reaction') {
                    showReaction(participant.identity, data.emoji);
                }
                else if (data.type === 'hand') {
                    const seat = document.querySelector(\`.seat[data-identity="\${participant.identity}"]\`);
                    if (seat) {
                        if (data.state) {
                            seat.classList.add('hand-raised');
                            showNotification('دستش را برای صحبت بلند کرد ✋', participant.identity, false);
                        } else {
                            seat.classList.remove('hand-raised');
                        }
                    }
                }
            });

            function sendData(dataObj) {
                const payload = new TextEncoder().encode(JSON.stringify(dataObj));
                room.localParticipant.publishData(payload, LivekitClient.DataPacket_Kind.RELIABLE);
            }

            document.getElementById('joinBtn').onclick = async () => {
                const user = document.getElementById('username').value.trim();
                const rm = document.getElementById('roomname').value.trim();
                if (!user || !rm) return alert('اسم و نام اتاق را وارد کن!');
                
                const btn = document.getElementById('joinBtn');
                btn.innerText = 'در حال اتصال...';
                btn.disabled = true;
                localUser = user;

                try {
                    const res = await fetch('/token?room=' + encodeURIComponent(rm) + '&user=' + encodeURIComponent(user));
                    const data = await res.json();
                    if(data.error) throw new Error(data.error);

                    await room.connect(LIVEKIT_URL, data.token);
                    await room.localParticipant.setMicrophoneEnabled(false); 
                    
                    loginUI.style.display = 'none';
                    gameRoom.style.display = 'flex';
                    document.getElementById('displayRoomName').innerText = rm;
                    
                    assignSeat(user, true);
                    showNotification('شما وارد اتاق شدید', user, true);
                    
                } catch (e) {
                    alert('خطا: ' + e.message);
                    btn.innerText = 'ورود به بازی';
                    btn.disabled = false;
                }
            };

            micBtn.onclick = async () => {
                const isMicOn = room.localParticipant.isMicrophoneEnabled;
                await room.localParticipant.setMicrophoneEnabled(!isMicOn);
                if (isMicOn) {
                    micBtn.classList.add('muted');
                    micBtn.innerText = '🔇';
                    updateSeatMicState(localUser, true);
                } else {
                    micBtn.classList.remove('muted');
                    micBtn.innerText = '🎙️';
                    updateSeatMicState(localUser, false);
                }
            };

            raiseHandBtn.onclick = () => {
                isHandRaised = !isHandRaised;
                sendData({ type: 'hand', state: isHandRaised });
                
                const mySeat = document.querySelector(\`.seat[data-identity="\${localUser}"]\`);
                if (isHandRaised) {
                    raiseHandBtn.classList.add('active');
                    if(mySeat) mySeat.classList.add('hand-raised');
                } else {
                    raiseHandBtn.classList.remove('active');
                    if(mySeat) mySeat.classList.remove('hand-raised');
                }
            };

            likeBtn.onclick = () => {
                const now = Date.now();
                if (now - lastLikeTime < 5000) return;
                lastLikeTime = now;
                
                sendData({ type: 'reaction', emoji: '👍' });
                showReaction(localUser, '👍');
                
                likeBtn.classList.add('disabled');
                setTimeout(() => likeBtn.classList.remove('disabled'), 5000);
            };

            dislikeBtn.onclick = () => {
                const now = Date.now();
                if (now - lastDislikeTime < 5000) return;
                lastDislikeTime = now;
                
                sendData({ type: 'reaction', emoji: '👎' });
                showReaction(localUser, '👎');
                
                dislikeBtn.classList.add('disabled');
                setTimeout(() => dislikeBtn.classList.remove('disabled'), 5000);
            };

            openChatBtn.onclick = () => {
                chatModal.style.display = 'flex';
                modalChatInput.value = '';
                modalChatInput.focus();
            };

            cancelModalBtn.onclick = () => { chatModal.style.display = 'none'; };

            sendModalMsgBtn.onclick = () => {
                const text = modalChatInput.value.trim();
                if (!text) return;
                sendData({ type: 'chat', text: text });
                showNotification(text, localUser, false);
                chatModal.style.display = 'none';
            };

            chatModal.onclick = (e) => {
                if (e.target === chatModal) chatModal.style.display = 'none';
            };

            document.getElementById('leaveBtn').onclick = async () => {
                if(confirm('آیا می‌خواهید از اتاق خارج شوید؟')) {
                    await room.disconnect();
                    window.location.reload();
                }
            };
        </script>
    </body>
    </html>
  `);
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Server running on port ' + (process.env.PORT || 3000));
});
