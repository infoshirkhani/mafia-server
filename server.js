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
            body { background: #0a0a0a; color: #fff; overflow: hidden; height: 100vh; height: 100dvh; display: flex; flex-direction: column; }

            /* --- صفحه ورود --- */
            #loginUI { position: absolute; inset: 0; background: rgba(0,0,0,0.95); z-index: 100; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 20px; }
            #loginUI .box { background: #1e1e1e; padding: 30px; border-radius: 16px; width: 100%; max-width: 350px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.8); border: 1px solid #333; }
            #loginUI input { width: 100%; padding: 15px; margin: 10px 0; border-radius: 8px; border: 1px solid #444; background: #111; color: #fff; font-size: 16px; text-align: center; }
            #loginUI button { width: 100%; padding: 15px; margin-top: 15px; border-radius: 8px; border: none; background: #28a745; color: #fff; font-size: 18px; font-weight: bold; cursor: pointer; }

            /* --- محیط بازی --- */
            #gameRoom { display: none; flex: 1; position: relative; background: #1a1a1a; overflow: hidden; }
            /* تصویر پس‌زمینه (می‌تونی لینک عکس خودت رو اینجا بذاری) */
            #gameRoom::before { content: ''; position: absolute; inset: 0; background: url('https://images.unsplash.com/photo-1519681393784-d120267933ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80') center/cover; opacity: 0.3; z-index: 1; }

            /* نوار بالا */
            .top-bar { position: absolute; top: 0; width: 100%; padding: 15px; padding-top: max(15px, env(safe-area-inset-top)); display: flex; justify-content: space-between; align-items: flex-start; z-index: 10; }
            .top-left-actions { display: flex; gap: 10px; align-items: center; }
            .exit-btn { background: #e81e5a; color: white; border: none; padding: 0 20px; border-radius: 20px; font-weight: bold; cursor: pointer; height: 40px; font-size: 14px; display: flex; align-items: center; box-shadow: 0 4px 10px rgba(232,30,90,0.4); }
            .icon-btn { background: rgba(40,40,40,0.8); color: white; border: 1px solid #555; width: 40px; height: 40px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 18px; cursor: pointer; backdrop-filter: blur(5px); }
            .room-name { font-weight: bold; color: #ffd700; font-size: 16px; text-shadow: 1px 1px 3px #000; margin-top: 10px; }

            /* --- محیط میز و صندلی‌ها --- */
            #tableContainer { position: absolute; inset: 0; margin: auto; width: 100%; height: 100%; z-index: 2; pointer-events: none; }
            .center-table { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 50px; color: rgba(255,215,0,0.1); filter: drop-shadow(0 0 15px rgba(255,215,0,0.2)); }
            
            /* استایل صندلی‌ها */
            .seat { position: absolute; display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: auto; transition: all 0.4s ease; }
            .seat.empty { opacity: 0; pointer-events: none; transform: scale(0.5); }

            /* گرداننده (بالای صفحه وسط) */
            .seat-h1 { top: 12%; left: 50%; transform: translateX(-50%); }
            
            /* چینش زیگزاگ (۱ چپ، ۲ راست، ۳ چپ، ۴ راست...) */
            .seat-l1 { top: 20%; left: 10%; }
            .seat-r1 { top: 20%; right: 10%; }
            .seat-l2 { top: 30%; left: 4%; }
            .seat-r2 { top: 30%; right: 4%; }
            .seat-l3 { top: 40%; left: 2%; }
            .seat-r3 { top: 40%; right: 2%; }
            .seat-l4 { top: 50%; left: 2%; }
            .seat-r4 { top: 50%; right: 2%; }
            .seat-l5 { top: 60%; left: 2%; }
            .seat-r5 { top: 60%; right: 2%; }
            .seat-l6 { top: 70%; left: 4%; }
            .seat-r6 { top: 70%; right: 4%; }
            .seat-l7 { top: 80%; left: 10%; }
            .seat-r7 { top: 80%; right: 10%; }

            /* آواتار و شماره */
            .avatar-box { width: 60px; height: 60px; border-radius: 50%; background: #222; border: 3px solid #555; display: flex; justify-content: center; align-items: center; font-size: 24px; position: relative; box-shadow: 0 6px 12px rgba(0,0,0,0.6); transition: all 0.3s; }
            .seat.host .avatar-box { border-color: #ffd700; box-shadow: 0 0 20px rgba(255,215,0,0.5); background: #332800; }
            
            .seat-number { position: absolute; top: -5px; left: -5px; background: #333; color: #aaa; width: 24px; height: 24px; border-radius: 50%; font-size: 12px; display: flex; justify-content: center; align-items: center; border: 1px solid #555; font-weight: bold; z-index: 3; }
            .seat.host .seat-number { background: #ffd700; color: #000; border-color: #ffd700; }

            /* وضعیت صحبت کردن (زرد) */
            .avatar-box.speaking { border-color: #ffd700; box-shadow: 0 0 25px #ffd700; transform: scale(1.1); }
            
            /* آیکون بلندگو برای میکروفن باز */
            .speaker-icon { display: none; position: absolute; top: -10px; right: -10px; font-size: 18px; background: rgba(0,0,0,0.8); border-radius: 50%; padding: 2px; border: 1px solid #ffd700; z-index: 4; }
            .avatar-box.mic-open .speaker-icon { display: block; }

            .seat-name { font-size: 12px; margin-top: 5px; background: #000; padding: 2px 10px; border-radius: 6px; max-width: 80px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; border: 1px solid #333; text-align: center; }

            /* نشانگر دست */
            .hand-indicator { display: none; position: absolute; top: -20px; right: -15px; font-size: 26px; animation: wave 1s infinite ease-in-out; z-index: 5; filter: drop-shadow(0 0 5px #ffd700); }
            .seat.hand-raised .hand-indicator { display: block; }
            @keyframes wave { 0% { transform: rotate(0deg); } 25% { transform: rotate(20deg); } 50% { transform: rotate(0deg); } 75% { transform: rotate(20deg); } 100% { transform: rotate(0deg); } }

            /* پیام‌های شناور */
            #notificationArea { position: absolute; top: max(70px, env(safe-area-inset-top)); width: 100%; display: flex; flex-direction: column; align-items: center; pointer-events: none; z-index: 20; gap: 5px; }
            .toast-msg { background: rgba(0, 0, 0, 0.9); color: #fff; padding: 8px 16px; border-radius: 20px; font-size: 13px; border: 1px solid #444; display: flex; align-items: center; gap: 8px; opacity: 0; transform: translateY(-20px); transition: all 0.3s ease; max-width: 90%; word-wrap: break-word; text-align: center; }
            .toast-msg.show { opacity: 1; transform: translateY(0); }
            .toast-msg.hide { opacity: 0; transform: translateY(-20px); }
            .toast-msg .sender-name { color: #ffd700; font-weight: bold; font-size: 11px; }

            /* --- نوار پایین --- */
            .bottom-bar { position: absolute; bottom: 0; width: 100%; padding: 15px 20px; padding-bottom: max(15px, env(safe-area-inset-bottom)); display: flex; justify-content: space-between; align-items: flex-end; z-index: 10; }
            
            /* دکمه بلند کردن دست (سمت راست) */
            .action-btn { width: 50px; height: 50px; border-radius: 50%; border: none; background: rgba(40,40,40,0.8); color: #fff; font-size: 24px; cursor: pointer; display: flex; justify-content: center; align-items: center; backdrop-filter: blur(5px); transition: all 0.2s; border: 1px solid #333; margin-bottom: 15px;}
            .action-btn:active { transform: scale(0.9); background: rgba(255,255,255,0.2); }
            .action-btn.active { background: rgba(255, 215, 0, 0.3); border-color: #ffd700; }

            /* دکمه میکروفن و تایمر */
            .mic-btn-container { position: relative; width: 90px; height: 90px; display: flex; justify-content: center; align-items: center; }
            
            /* حلقه تایمر */
            .timer-ring { position: absolute; top: 0; left: 0; width: 90px; height: 90px; transform: rotate(-90deg); pointer-events: none; }
            .timer-circle { fill: none; stroke: #ffd700; stroke-width: 5; stroke-linecap: round; stroke-dasharray: 251.2; stroke-dashoffset: 0; transition: stroke-dashoffset 0.1s linear; }
            
            .mic-btn { width: 70px; height: 70px; border-radius: 50%; border: none; cursor: pointer; display: flex; justify-content: center; align-items: center; transition: all 0.2s ease; position: relative; box-shadow: 0 4px 15px rgba(0,0,0,0.5); z-index: 2; font-size: 30px;}
            
            /* حالت بسته (قرمز با خط کج) */
            .mic-btn.closed { background: #dc3545; color: white; }
            .mic-btn.closed::after { content: ''; position: absolute; width: 4px; height: 80%; background: white; border-radius: 2px; transform: rotate(-45deg); }
            
            /* حالت باز (سبز) */
            .mic-btn.open { background: #28a745; color: white; border: 2px solid #4cd964; }

            /* حالت صبر (Cooldown 3s) */
            .mic-btn.cooldown { background: #555; color: #aaa; cursor: not-allowed; }
            .mic-btn.cooldown::after { display: none; }

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
                <div class="top-left-actions">
                    <button class="exit-btn" id="leaveBtn">خروج</button>
                    <button class="icon-btn" id="openChatBtn">✉️</button>
                </div>
                <div class="room-name" id="displayRoomName">mafia-room</div>
            </div>

            <div id="notificationArea"></div>

            <div id="tableContainer">
                <div class="center-table">⚙️</div>
            </div>

            <div class="bottom-bar">
                <!-- دکمه بلند کردن دست سمت راست -->
                <button class="action-btn" id="raiseHandBtn">✋</button>
                
                <!-- دکمه میکروفن با تایمر وسط -->
                <div class="mic-btn-container">
                    <svg class="timer-ring">
                        <circle class="timer-circle" cx="45" cy="45" r="40"></circle>
                    </svg>
                    <button class="mic-btn closed" id="micBtn">🎙️</button>
                </div>
                
                <!-- فضای خالی برای متعادل ماندن چینش -->
                <div style="width: 50px;"></div>
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
            
            const chatModal = document.getElementById('chatModal');
            const openChatBtn = document.getElementById('openChatBtn');
            const cancelModalBtn = document.getElementById('cancelModalBtn');
            const sendModalMsgBtn = document.getElementById('sendModalMsgBtn');
            const modalChatInput = document.getElementById('modalChatInput');
            
            const timerCircle = document.querySelector('.timer-circle');
            const circleLength = 2 * Math.PI * 40; // محیط دایره تایمر

            let localUser = null;
            let isHandRaised = false;
            
            // متغیرهای تایمر میکروفن
            let micInterval = null;
            let cooldownInterval = null;
            let timeLeft = 60; // ۶۰ ثانیه زمان مجاز

            // ترتیب نشستن: اول گرداننده، بعد زیگزاگ (چپ ۱، راست ۱، چپ ۲، راست ۲...)
            const seatPriority = [
                'seat-h1', 
                'seat-l1', 'seat-r1', 'seat-l2', 'seat-r2', 'seat-l3', 'seat-r3', 
                'seat-l4', 'seat-r4', 'seat-l5', 'seat-r5', 'seat-l6', 'seat-r6', 
                'seat-l7', 'seat-r7'
            ];

            function createSeats() {
                // گرداننده (فقط یک صندلی وسط بالا)
                const hostSeat = document.createElement('div');
                hostSeat.className = 'seat seat-h1 host empty';
                hostSeat.id = 'seat-h1';
                hostSeat.innerHTML = `
                    <div class="avatar-box">
                        👑
                        <div class="seat-number">H</div>
                        <div class="hand-indicator">📣</div>
                    </div>
                    <div class="seat-name">گرداننده</div>
                `;
                tableContainer.appendChild(hostSeat);

                // ۷ صندلی چپ
                for (let i = 1; i <= 7; i++) {
                    const seat = document.createElement('div');
                    seat.className = 'seat seat-l' + i + ' empty';
                    seat.id = 'seat-l' + i;
                    seat.innerHTML = `
                        <div class="avatar-box">
                            <span class="speaker-icon">🔊</span>
                            💺
                            <div class="seat-number">${i}</div>
                            <div class="hand-indicator">📣</div>
                        </div>
                        <div class="seat-name">صندلی ${i}</div>
                    `;
                    tableContainer.appendChild(seat);
                }

                // ۷ صندلی راست
                for (let i = 1; i <= 7; i++) {
                    const seat = document.createElement('div');
                    seat.className = 'seat seat-r' + i + ' empty';
                    seat.id = 'seat-r' + i;
                    seat.innerHTML = `
                        <div class="avatar-box">
                            <span class="speaker-icon">🔊</span>
                            💺
                            <div class="seat-number">${i + 7}</div>
                            <div class="hand-indicator">📣</div>
                        </div>
                        <div class="seat-name">صندلی ${i + 7}</div>
                    `;
                    tableContainer.appendChild(seat);
                }
            }
            createSeats();

            function showNotification(text, sender = null, isSystem = false) {
                const toast = document.createElement('div');
                toast.className = 'toast-msg';
                if (isSystem) {
                    toast.innerHTML = `<span class="check-icon">✅</span> <span>${text}</span>`;
                } else {
                    toast.innerHTML = `<span class="sender-name">${sender}:</span> <span>${text}</span>`;
                }
                notificationArea.appendChild(toast);
                setTimeout(() => toast.classList.add('show'), 10);
                setTimeout(() => {
                    toast.classList.remove('show');
                    toast.classList.add('hide');
                    setTimeout(() => toast.remove(), 300);
                }, 15000);
            }

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
                    
                    // تنظیم آواتار (حرف اول اسم)
                    const avatarBox = assignedSeat.querySelector('.avatar-box');
                    // حفظ آیکون بلندگو و تغییر فقط متن اصلی
                    const textNode = Array.from(avatarBox.childNodes).find(node => node.nodeType === 3);
                    if (textNode) textNode.nodeValue = identity.charAt(0).toUpperCase();
                    
                    updateSeatMicState(identity, isMuted);
                    return assignedSeat;
                } else {
                    showNotification('اتاق پر است!', identity, true);
                }
            }

            // آپدیت وضعیت میکروفن (آیکون بلندگو و رنگ زرد)
            function updateSeatMicState(identity, isMuted) {
                const seat = document.querySelector(`.seat[data-identity="${identity}"]`);
                if (seat) {
                    const avatar = seat.querySelector('.avatar-box');
                    if (isMuted) {
                        avatar.classList.remove('mic-open');
                    } else {
                        avatar.classList.add('mic-open');
                    }
                }
            }

            // آپدیت کسی که در حال صحبت است (حاشیه زرد)
            function updateSpeakingState(speakers) {
                document.querySelectorAll('.avatar-box').forEach(el => el.classList.remove('speaking'));
                speakers.forEach(p => {
                    const seat = document.querySelector(`.seat[data-identity="${p.identity}"]`);
                    if (seat) {
                        seat.querySelector('.avatar-box').classList.add('speaking');
                    }
                });
            }

            // --- منطق تایمر میکروفن ---
            function startMicTimer() {
                timeLeft = 60;
                timerCircle.style.strokeDasharray = circleLength;
                timerCircle.style.strokeDashoffset = 0;
                
                clearInterval(micInterval);
                micInterval = setInterval(() => {
                    timeLeft -= 0.1;
                    if (timeLeft <= 0) {
                        clearInterval(micInterval);
                        timeLeft = 0;
                        closeMicAndCooldown(); // زمان تمام شد
                    } else {
                        // محاسبه آفست برای پر کردن دایره
                        const offset = circleLength - (timeLeft / 60) * circleLength;
                        timerCircle.style.strokeDashoffset = offset;
                    }
                }, 100);
            }

            function stopMicTimer() {
                clearInterval(micInterval);
                timerCircle.style.strokeDashoffset = 0; // ریست کردن حلقه
            }

            function startCooldown() {
                micBtn.classList.remove('closed', 'open');
                micBtn.classList.add('cooldown');
                micBtn.innerText = '3'; // شمارش معکوس
                
                let cooldown = 3;
                clearInterval(cooldownInterval);
                cooldownInterval = setInterval(() => {
                    cooldown -= 1;
                    micBtn.innerText = cooldown;
                    if (cooldown <= 0) {
                        clearInterval(cooldownInterval);
                        micBtn.classList.remove('cooldown');
                        micBtn.classList.add('closed');
                        micBtn.innerText = '🎙️';
                    }
                }, 1000);
            }

            function closeMicAndCooldown() {
                stopMicTimer();
                room.localParticipant.setMicrophoneEnabled(false);
                micBtn.classList.remove('open');
                micBtn.classList.add('closed');
                micBtn.innerText = '🎙️';
                updateSeatMicState(localUser, true);
                startCooldown();
            }

            // --- رویدادهای LiveKit ---
            room.on(LivekitClient.RoomEvent.TrackSubscribed, (track) => {
                if (track.kind === 'audio') document.getElementById('audio-container').appendChild(track.attach());
            });

            room.on(LivekitClient.RoomEvent.ParticipantConnected, (participant) => {
                assignSeat(participant.identity, !participant.isMicrophoneEnabled);
                showNotification(`وارد اتاق شد`, participant.identity, true);
            });

            room.on(LivekitClient.RoomEvent.ParticipantDisconnected, (participant) => {
                const seat = document.querySelector(`.seat[data-identity="${participant.identity}"]`);
                if (seat) {
                    seat.classList.add('empty');
                    seat.classList.remove('hand-raised');
                    seat.querySelector('.avatar-box').classList.remove('mic-open', 'speaking');
                    seat.removeAttribute('data-identity');
                }
                showNotification(`از اتاق خارج شد`, participant.identity, true);
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
                else if (data.type === 'hand') {
                    const seat = document.querySelector(`.seat[data-identity="${participant.identity}"]`);
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

            // --- ورود و دکمه‌ها ---
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

            // دکمه میکروفن
            micBtn.onclick = async () => {
                if (micBtn.classList.contains('cooldown')) return; // در حال صبر کردن

                const isMicOn = room.localParticipant.isMicrophoneEnabled;
                if (!isMicOn) {
                    // روشن کردن
                    await room.localParticipant.setMicrophoneEnabled(true);
                    micBtn.classList.remove('closed');
                    micBtn.classList.add('open');
                    micBtn.innerText = '🎙️';
                    updateSeatMicState(localUser, false);
                    startMicTimer();
                } else {
                    // خاموش کردن
                    closeMicAndCooldown();
                }
            };

            raiseHandBtn.onclick = () => {
                isHandRaised = !isHandRaised;
                sendData({ type: 'hand', state: isHandRaised });
                
                const mySeat = document.querySelector(`.seat[data-identity="${localUser}"]`);
                if (isHandRaised) {
                    raiseHandBtn.classList.add('active');
                    if(mySeat) mySeat.classList.add('hand-raised');
                } else {
                    raiseHandBtn.classList.remove('active');
                    if(mySeat) mySeat.classList.remove('hand-raised');
                }
            };

            // چت
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
