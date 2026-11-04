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
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>اتاق بازی مافیا</title>
        <script src="https://cdn.jsdelivr.net/npm/livekit-client/dist/livekit-client.umd.min.js"></script>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;700&display=swap');
            
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Vazirmatn', Tahoma, sans-serif; user-select: none; }
            body { background: #1a1a1a; color: #fff; overflow: hidden; height: 100vh; display: flex; flex-direction: column; }

            /* --- صفحه ورود --- */
            #loginUI { position: absolute; inset: 0; background: rgba(0,0,0,0.9); z-index: 100; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 20px; }
            #loginUI .box { background: #2a2a2a; padding: 30px; border-radius: 16px; width: 100%; max-width: 350px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 1px solid #444; }
            #loginUI input { width: 100%; padding: 15px; margin: 10px 0; border-radius: 8px; border: 1px solid #555; background: #111; color: #fff; font-size: 16px; text-align: center; }
            #loginUI button { width: 100%; padding: 15px; margin-top: 15px; border-radius: 8px; border: none; background: #28a745; color: #fff; font-size: 18px; font-weight: bold; cursor: pointer; }

            /* --- محیط بازی --- */
            #gameRoom { display: none; flex: 1; position: relative; background: radial-gradient(circle at center, #3e2e20 0%, #1a120b 100%); overflow: hidden; }

            /* نوار بالا */
            .top-bar { position: absolute; top: 0; width: 100%; padding: 15px; display: flex; justify-content: space-between; align-items: center; z-index: 10; background: linear-gradient(to bottom, rgba(0,0,0,0.7), transparent); }
            .room-name { font-weight: bold; color: #ffd700; font-size: 18px; }
            
            /* دکمه‌های بالای صفحه */
            .top-actions { display: flex; gap: 10px; }
            .icon-btn { background: rgba(255,255,255,0.1); color: white; border: 1px solid #555; width: 40px; height: 40px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 18px; cursor: pointer; }
            .exit-btn { background: #dc3545; color: white; border: none; padding: 8px 15px; border-radius: 20px; font-weight: bold; cursor: pointer; height: 40px; }

            /* محیط میز و صندلی‌ها */
            #seatsContainer { position: absolute; inset: 0; display: grid; grid-template-columns: repeat(4, 1fr); grid-template-rows: repeat(4, 1fr); gap: 10px; padding: 60px 10px 100px 10px; align-content: center; justify-content: center; }
            .seat { display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; }
            .avatar-box { width: 60px; height: 60px; border-radius: 50%; background: #333; border: 3px solid #555; display: flex; justify-content: center; align-items: center; font-size: 24px; position: relative; transition: all 0.3s ease; }
            
            .avatar-box.speaking { border-color: #28a745; box-shadow: 0 0 15px #28a745; transform: scale(1.1); }
            .avatar-box.muted { border-color: #dc3545; }
            .avatar-box.muted::after { content: '🔇'; position: absolute; bottom: -5px; right: -5px; font-size: 14px; background: #111; border-radius: 50%; padding: 2px; }
            .seat-name { font-size: 12px; margin-top: 5px; background: rgba(0,0,0,0.6); padding: 2px 8px; border-radius: 10px; max-width: 80px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .seat.empty .avatar-box { background: transparent; border: 2px dashed #444; color: #444; font-size: 12px; }

            /* نشانگر دست بلند شده */
            .hand-indicator { display: none; position: absolute; top: -25px; right: 0; font-size: 24px; animation: wave 1s infinite ease-in-out; }
            .seat.hand-raised .hand-indicator { display: block; }
            @keyframes wave { 0% { transform: rotate(0deg); } 25% { transform: rotate(20deg); } 50% { transform: rotate(0deg); } 75% { transform: rotate(20deg); } 100% { transform: rotate(0deg); } }

            /* استیکرهای شناور */
            .floating-reaction { position: absolute; bottom: 60px; left: 50%; transform: translateX(-50%); font-size: 30px; opacity: 1; animation: floatUp 1.5s ease-out forwards; pointer-events: none; z-index: 50; }
            @keyframes floatUp { 0% { opacity: 1; transform: translate(-50%, 0) scale(1); } 100% { opacity: 0; transform: translate(-50%, -80px) scale(1.5); } }

            /* پیام‌های شناور بالای صفحه */
            #notificationArea { position: absolute; top: 60px; width: 100%; display: flex; flex-direction: column; align-items: center; pointer-events: none; z-index: 20; gap: 5px; }
            .toast-msg { background: rgba(0, 0, 0, 0.85); color: #fff; padding: 8px 15px; border-radius: 20px; font-size: 14px; border: 1px solid #555; display: flex; align-items: center; gap: 8px; opacity: 0; transform: translateY(-20px); transition: all 0.3s ease; max-width: 90%; word-wrap: break-word; text-align: center; }
            .toast-msg.show { opacity: 1; transform: translateY(0); }
            .toast-msg.hide { opacity: 0; transform: translateY(-20px); }
            .toast-msg .sender-name { color: #ffd700; font-weight: bold; font-size: 12px; }
            .toast-msg .check-icon { color: #28a745; font-weight: bold; }

            /* --- نوار پایین (کنترل‌ها) --- */
            .bottom-bar { position: absolute; bottom: 0; width: 100%; padding: 20px 10px; display: flex; justify-content: space-between; align-items: center; background: linear-gradient(to top, rgba(0,0,0,0.9), transparent); z-index: 10; }
            .action-btn { width: 45px; height: 45px; border-radius: 50%; border: none; background: rgba(255,255,255,0.1); color: #fff; font-size: 20px; cursor: pointer; display: flex; justify-content: center; align-items: center; backdrop-filter: blur(5px); transition: all 0.2s; }
            .action-btn:active { transform: scale(0.9); }
            .action-btn.active { background: rgba(255, 215, 0, 0.3); border: 1px solid #ffd700; }
            
            .mic-btn-container { position: relative; }
            .mic-btn { width: 75px; height: 75px; border-radius: 50%; border: 4px solid #ffd700; background: #222; color: #fff; font-size: 30px; cursor: pointer; display: flex; justify-content: center; align-items: center; box-shadow: 0 0 20px rgba(255, 215, 0, 0.3); transition: all 0.2s ease; }
            .mic-btn.muted { border-color: #dc3545; box-shadow: 0 0 20px rgba(220, 53, 69, 0.3); }
            
            #audio-container { display: none; }

            /* --- پنجره ارسال پیام (مودال) --- */
            #chatModal { position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 200; display: none; justify-content: center; align-items: center; padding: 20px; backdrop-filter: blur(3px); }
            .chat-modal-content { background: #2a2a2a; width: 100%; max-width: 400px; border-radius: 16px; padding: 20px; border: 1px solid #444; box-shadow: 0 10px 30px rgba(0,0,0,0.5); display: flex; flex-direction: column; gap: 15px; }
            .chat-modal-content h3 { text-align: center; color: #ffd700; font-size: 18px; }
            .chat-modal-content textarea { width: 100%; height: 100px; padding: 12px; border-radius: 8px; border: 1px solid #555; background: #111; color: #fff; font-size: 16px; resize: none; outline: none; font-family: inherit; }
            .chat-modal-actions { display: flex; gap: 10px; }
            .chat-modal-actions button { flex: 1; padding: 12px; border-radius: 8px; border: none; font-size: 16px; font-weight: bold; cursor: pointer; }
            #sendModalMsgBtn { background: #28a745; color: #fff; }
            #cancelModalBtn { background: #555; color: #fff; }
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

            <div id="seatsContainer"></div>
            <div id="notificationArea"></div>

            <div class="bottom-bar">
                <button class="action-btn" id="likeBtn">👍</button>
                <button class="action-btn" id="dislikeBtn">👎</button>
                
                <div class="mic-btn-container">
                    <button class="mic-btn" id="micBtn">🎙️</button>
                </div>
                
                <button class="action-btn" id="raiseHandBtn">✋</button>
                <button class="action-btn" id="infoBtn">ℹ️</button>
            </div>
        </div>

        <!-- پنجره ارسال پیام -->
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
            const seatsContainer = document.getElementById('seatsContainer');
            const notificationArea = document.getElementById('notificationArea');
            const micBtn = document.getElementById('micBtn');
            const raiseHandBtn = document.getElementById('raiseHandBtn');
            const likeBtn = document.getElementById('likeBtn');
            const dislikeBtn = document.getElementById('dislikeBtn');
            
            // المان‌های چت جدید
            const chatModal = document.getElementById('chatModal');
            const openChatBtn = document.getElementById('openChatBtn');
            const cancelModalBtn = document.getElementById('cancelModalBtn');
            const sendModalMsgBtn = document.getElementById('sendModalMsgBtn');
            const modalChatInput = document.getElementById('modalChatInput');
            
            let totalSeats = 16;
            let localUser = null;
            let isHandRaised = false;

            // ساخت صندلی‌ها
            function createSeats() {
                seatsContainer.innerHTML = '';
                for (let i = 1; i <= totalSeats; i++) {
                    const seat = document.createElement('div');
                    seat.className = 'seat empty';
                    seat.id = 'seat-' + i;
                    seat.innerHTML = \`
                        <div class="avatar-box">
                            💺
                            <div class="hand-indicator">✋</div>
                        </div>
                        <div class="seat-name">صندلی \${i}</div>
                    \`;
                    seatsContainer.appendChild(seat);
                }
            }
            createSeats();

            // نمایش پیام شناور (۱۵ ثانیه)
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

            function assignSeat(identity, isMuted) {
                let assignedSeat = null;
                const seats = document.querySelectorAll('.seat');
                for (let seat of seats) {
                    if (seat.classList.contains('empty') || seat.querySelector('.seat-name').innerText === identity) {
                        assignedSeat = seat; break;
                    }
                }
                if (assignedSeat) {
                    assignedSeat.classList.remove('empty');
                    assignedSeat.querySelector('.seat-name').innerText = identity;
                    assignedSeat.querySelector('.avatar-box').childNodes[0].nodeValue = '👤';
                    assignedSeat.setAttribute('data-identity', identity);
                    updateSeatMicState(identity, isMuted);
                    return assignedSeat;
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
                    seat.classList.add('empty');
                    seat.classList.remove('hand-raised');
                    seat.querySelector('.seat-name').innerText = \`صندلی \${seat.id.split('-')[1]}\`;
                    seat.querySelector('.avatar-box').childNodes[0].nodeValue = '💺';
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

            // دریافت داده‌ها
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
                sendData({ type: 'reaction', emoji: '👍' });
                showReaction(localUser, '👍');
            };

            dislikeBtn.onclick = () => {
                sendData({ type: 'reaction', emoji: '👎' });
                showReaction(localUser, '👎');
            };

            // --- منطق چت مودالی ---
            openChatBtn.onclick = () => {
                chatModal.style.display = 'flex';
                modalChatInput.value = '';
                modalChatInput.focus();
            };

            cancelModalBtn.onclick = () => {
                chatModal.style.display = 'none';
            };

            sendModalMsgBtn.onclick = () => {
                const text = modalChatInput.value.trim();
                if (!text) return;
                
                sendData({ type: 'chat', text: text });
                showNotification(text, localUser, false);
                
                chatModal.style.display = 'none';
            };

            // بستن مودال با کلیک روی پس‌زمینه
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
