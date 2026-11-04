<!DOCTYPE html>
<html lang="fa" dir="ltr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title>اتاق بازی مافیا | نسخه %%VERSION%%</title>
    <script src="https://cdn.jsdelivr.net/npm/livekit-client/dist/livekit-client.umd.min.js"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;700&display=swap');
        
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Vazirmatn', Tahoma, sans-serif; user-select: none; -webkit-tap-highlight-color: transparent; }
        body { background: #0a0a0a; color: #fff; overflow: hidden; height: 100vh; height: 100dvh; display: flex; flex-direction: column; }

        /* --- صفحه ورود --- */
        #loginUI { position: absolute; inset: 0; background: rgba(0,0,0,0.95); z-index: 100; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 20px; }
        #loginUI .box { background: #1e1e1e; padding: 30px; border-radius: 16px; width: 100%; max-width: 350px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.8); border: 1px solid #333; position: relative; }
        #loginUI input { width: 100%; padding: 15px; margin: 10px 0; border-radius: 8px; border: 1px solid #444; background: #111; color: #fff; font-size: 16px; text-align: center; }
        #loginUI button { width: 100%; padding: 15px; margin-top: 15px; border-radius: 8px; border: none; background: #28a745; color: #fff; font-size: 18px; font-weight: bold; cursor: pointer; }
        .version-tag { position: absolute; bottom: -30px; left: 50%; transform: translateX(-50%); color: #666; font-size: 12px; direction: ltr; }

        /* --- محیط بازی --- */
        #gameRoom { display: none; flex: 1; position: relative; background: #1a1a1a; overflow: hidden; }
        #gameRoom::before { content: ''; position: absolute; inset: 0; background: url('https://images.unsplash.com/photo-1519681393784-d120267933ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80') center/cover; opacity: 0.3; z-index: 1; }

        /* نوار بالا */
        .top-bar { position: absolute; top: 0; width: 100%; padding: 15px; padding-top: max(15px, env(safe-area-inset-top)); display: flex; justify-content: space-between; align-items: flex-start; z-index: 10; direction: ltr; }
        .top-left-actions { display: flex; gap: 10px; align-items: center; }
        .exit-btn { background: #e81e5a; color: white; border: none; padding: 0 20px; border-radius: 20px; font-weight: bold; cursor: pointer; height: 40px; font-size: 14px; display: flex; align-items: center; box-shadow: 0 4px 10px rgba(232,30,90,0.4); direction: rtl; }
        .icon-btn { background: rgba(40,40,40,0.8); color: white; border: 1px solid #555; width: 40px; height: 40px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 18px; cursor: pointer; backdrop-filter: blur(5px); }
        .room-info { display: flex; flex-direction: column; align-items: flex-end; margin-top: 10px; }
        .room-name { font-weight: bold; color: #ffd700; font-size: 16px; text-shadow: 1px 1px 3px #000; direction: rtl; }
        .game-version { color: #888; font-size: 10px; direction: ltr; }

        /* --- محیط میز و صندلی‌ها --- */
        #tableContainer { position: absolute; inset: 0; margin: auto; width: 100%; height: 100%; z-index: 2; pointer-events: none; }
        .center-table { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 50px; color: rgba(255,215,0,0.1); filter: drop-shadow(0 0 15px rgba(255,215,0,0.2)); }
        
        /* استایل صندلی‌ها */
        .seat { position: absolute; display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: auto; transition: all 0.4s ease; }
        .seat.empty { opacity: 0; pointer-events: none; transform: scale(0.5); }

        .seat-1 { top: 12%; left: 12%; }
        .seat-3 { top: 22%; left: 6%; }
        .seat-5 { top: 32%; left: 2%; }
        .seat-7 { top: 42%; left: 1%; }
        .seat-9 { top: 52%; left: 1%; }
        .seat-11 { top: 62%; left: 2%; }
        .seat-13 { top: 72%; left: 6%; }
        .seat-15 { top: 82%; left: 12%; }
        
        .seat-2 { top: 12%; right: 12%; }
        .seat-4 { top: 22%; right: 6%; }
        .seat-6 { top: 32%; right: 2%; }
        .seat-8 { top: 42%; right: 1%; }
        .seat-10 { top: 52%; right: 1%; }
        .seat-12 { top: 62%; right: 2%; }
        .seat-14 { top: 72%; right: 6%; }
        .seat-16 { top: 82%; right: 12%; }

        /* آواتار و شماره */
        .avatar-box { width: 55px; height: 55px; border-radius: 50%; background: #222; border: 3px solid #555; display: flex; justify-content: center; align-items: center; font-size: 22px; position: relative; box-shadow: 0 6px 12px rgba(0,0,0,0.6); transition: all 0.3s; }
        .seat-number { position: absolute; top: -5px; left: -5px; background: #333; color: #aaa; width: 22px; height: 22px; border-radius: 50%; font-size: 11px; display: flex; justify-content: center; align-items: center; border: 1px solid #555; font-weight: bold; z-index: 3; }

        /* 🌟 وضعیت میکروفن باز (زرد) */
        .avatar-box.mic-open { border-color: #ffd700; box-shadow: 0 0 20px #ffd700; transform: scale(1.05); }
        
        .seat-name { font-size: 11px; margin-top: 5px; background: #000; padding: 2px 8px; border-radius: 6px; max-width: 75px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; border: 1px solid #333; text-align: center; direction: rtl; }

        /* نشانگر دست */
        .hand-indicator { display: none; position: absolute; top: -20px; right: -15px; font-size: 24px; animation: wave 1s infinite ease-in-out; z-index: 5; filter: drop-shadow(0 0 5px #ffd700); }
        .seat.hand-raised .hand-indicator { display: block; }
        @keyframes wave { 0% { transform: rotate(0deg); } 25% { transform: rotate(20deg); } 50% { transform: rotate(0deg); } 75% { transform: rotate(20deg); } 100% { transform: rotate(0deg); } }

        /* پیام‌های شناور */
        #notificationArea { position: absolute; top: max(70px, env(safe-area-inset-top)); width: 100%; display: flex; flex-direction: column; align-items: center; pointer-events: none; z-index: 20; gap: 5px; }
        .toast-msg { background: rgba(0, 0, 0, 0.9); color: #fff; padding: 6px 12px; border-radius: 20px; font-size: 13px; border: 1px solid #444; display: flex; align-items: center; gap: 8px; opacity: 0; transform: translateY(-20px); transition: all 0.3s ease; max-width: 90%; word-wrap: break-word; text-align: center; direction: rtl; }
        .toast-msg.show { opacity: 1; transform: translateY(0); }
        .toast-msg.hide { opacity: 0; transform: translateY(-20px); }
        .toast-msg .sender-name { color: #ffd700; font-weight: bold; font-size: 11px; }

        /* --- نوار پایین و میکروفن --- */
        .bottom-bar { position: absolute; bottom: 0; width: 100%; padding: 0 20px; padding-bottom: max(10px, env(safe-area-inset-bottom)); display: flex; justify-content: space-between; align-items: flex-end; z-index: 10; direction: ltr; }
        
        .action-btn { width: 50px; height: 50px; border-radius: 50%; border: none; background: rgba(40,40,40,0.8); color: #fff; font-size: 24px; cursor: pointer; display: flex; justify-content: center; align-items: center; backdrop-filter: blur(5px); transition: all 0.2s; border: 1px solid #333; margin-bottom: 25px;}
        .action-btn:active { transform: scale(0.9); background: rgba(255,255,255,0.2); }
        .action-btn.active { background: rgba(255, 215, 0, 0.3); border-color: #ffd700; }

        .mic-btn-wrapper { display: flex; flex-direction: column; align-items: center; margin-bottom: 15px; }
        .mic-btn-container { position: relative; width: 90px; height: 90px; display: flex; justify-content: center; align-items: center; }
        
        .timer-ring { position: absolute; top: 0; left: 0; width: 90px; height: 90px; transform: rotate(-90deg); pointer-events: none; }
        .timer-circle { fill: none; stroke: #ffd700; stroke-width: 5; stroke-linecap: round; stroke-dasharray: 251.2; stroke-dashoffset: 0; transition: stroke-dashoffset 0.1s linear, stroke 0.3s; }
        
        .mic-btn { width: 70px; height: 70px; border-radius: 50%; border: none; cursor: pointer; display: flex; justify-content: center; align-items: center; transition: all 0.2s ease; position: relative; box-shadow: 0 4px 15px rgba(0,0,0,0.5); z-index: 2; font-size: 30px;}
        
        .mic-btn.closed { background: #dc3545; color: white; }
        .mic-btn.closed::after { content: ''; position: absolute; width: 4px; height: 80%; background: white; border-radius: 2px; transform: rotate(-45deg); }
        .mic-btn.open { background: #28a745; color: white; border: 2px solid #4cd964; }
        .mic-btn.disconnected { background: #555; color: white; border: 2px dashed #777; }
        .mic-btn.disconnected::after { display: none; }
        .mic-btn.disconnected .mic-icon { display: none; }
        .mic-btn.disconnected::before { content: '🛜'; font-size: 28px; opacity: 0.8; }
        .mic-btn.cooldown { background: #333; color: #aaa; cursor: not-allowed; font-size: 24px; font-weight: bold; }
        .mic-btn.cooldown::after { display: none; }

        /* 🌟 نوار اکولایزر */
        #audio-visualizer { width: 70px; height: 6px; background: #333; border-radius: 3px; margin-top: 8px; overflow: hidden; position: relative; z-index: 3; display: none;}
        #audio-visualizer-bar { width: 0%; height: 100%; background: #28a745; transition: width 0.05s linear; border-radius: 3px; box-shadow: 0 0 10px #28a745; }

        #audio-container { display: none; }

        /* مودال چت */
        #chatModal { position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 200; display: none; justify-content: center; align-items: center; padding: 20px; backdrop-filter: blur(4px); }
        .chat-modal-content { background: #1e1e1e; width: 100%; max-width: 400px; border-radius: 16px; padding: 20px; border: 1px solid #333; box-shadow: 0 10px 30px rgba(0,0,0,0.8); display: flex; flex-direction: column; gap: 15px; direction: rtl; }
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
            <input type="text" id="username" placeholder="نام شما (مثلاً علی)" value="user_%%RANDOM%%">
            <input type="text" id="roomname" placeholder="نام اتاق" value="mafia-room">
            <button id="joinBtn">ورود به بازی</button>
            <div class="version-tag">Version: %%VERSION%%</div>
        </div>
    </div>

    <div id="gameRoom">
        <div class="top-bar">
            <div class="top-left-actions">
                <button class="exit-btn" id="leaveBtn">خروج</button>
                <button class="icon-btn" id="openChatBtn">✉️</button>
            </div>
            <div class="room-info">
                <div class="room-name" id="displayRoomName">mafia-room</div>
                <div class="game-version">%%VERSION%%</div>
            </div>
        </div>

        <div id="notificationArea"></div>

        <div id="tableContainer">
            <div class="center-table">⚙️</div>
        </div>

        <div class="bottom-bar">
            <button class="action-btn" id="raiseHandBtn">✋</button>
            
            <div class="mic-btn-wrapper">
                <div class="mic-btn-container">
                    <svg class="timer-ring">
                        <circle class="timer-circle" cx="45" cy="45" r="40"></circle>
                    </svg>
                    <button class="mic-btn closed" id="micBtn">
                        <span class="mic-icon">🎙️</span>
                    </button>
                </div>
                <div id="audio-visualizer">
                    <div id="audio-visualizer-bar"></div>
                </div>
            </div>
            
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
        const LIVEKIT_URL = "%%LIVEKIT_URL%%";
        const room = new LivekitClient.Room();
        
        const loginUI = document.getElementById('loginUI');
        const gameRoom = document.getElementById('gameRoom');
        const tableContainer = document.getElementById('tableContainer');
        const notificationArea = document.getElementById('notificationArea');
        
        const micBtn = document.getElementById('micBtn');
        const raiseHandBtn = document.getElementById('raiseHandBtn');
        const visualizerContainer = document.getElementById('audio-visualizer');
        const visualizerBar = document.getElementById('audio-visualizer-bar');
        
        const chatModal = document.getElementById('chatModal');
        const openChatBtn = document.getElementById('openChatBtn');
        const cancelModalBtn = document.getElementById('cancelModalBtn');
        const sendModalMsgBtn = document.getElementById('sendModalMsgBtn');
        const modalChatInput = document.getElementById('modalChatInput');
        
        const timerCircle = document.querySelector('.timer-circle');
        const circleLength = 2 * Math.PI * 40;

        let localUser = null;
        let isHandRaised = false;
        
        let micInterval = null;
        let cooldownInterval = null;
        let timeLeft = 60;
        let isCooldown = false;

        let audioCtx = null;
        let analyser = null;
        let dataArray = null;
        let micStream = null;

        const seatPriority = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

        function createSeats() {
            for (let i = 1; i <= 16; i++) {
                const seat = document.createElement('div');
                seat.className = 'seat seat-' + i + ' empty';
                seat.id = 'seat-' + i;
                seat.innerHTML = '<div class="avatar-box">💺<div class="seat-number">' + i + '</div><div class="hand-indicator">✋</div></div><div class="seat-name">صندلی ' + i + '</div>';
                tableContainer.appendChild(seat);
            }
        }
        createSeats();

        function showNotification(text, sender, isSystem) {
            const toast = document.createElement('div');
            toast.className = 'toast-msg';
            if (isSystem) {
                toast.innerHTML = '<span class="check-icon">✅</span> <span>' + text + '</span>';
            } else {
                toast.innerHTML = '<span class="sender-name">' + sender + ':</span> <span>' + text + '</span>';
            }
            notificationArea.appendChild(toast);
            setTimeout(function() { toast.classList.add('show'); }, 10);
            setTimeout(function() {
                toast.classList.remove('show');
                toast.classList.add('hide');
                setTimeout(function() { toast.remove(); }, 300);
            }, 15000);
        }

        function assignSeat(identity, isMuted) {
            let assignedSeat = null;
            for (let i = 0; i < seatPriority.length; i++) {
                const seat = document.getElementById('seat-' + seatPriority[i]);
                if (seat.classList.contains('empty') || seat.getAttribute('data-identity') === identity) {
                    assignedSeat = seat; 
                    break;
                }
            }

            if (assignedSeat) {
                assignedSeat.classList.remove('empty');
                assignedSeat.setAttribute('data-identity', identity);
                assignedSeat.querySelector('.seat-name').innerText = identity;
                
                const avatarBox = assignedSeat.querySelector('.avatar-box');
                for (let i = 0; i < avatarBox.childNodes.length; i++) {
                    if (avatarBox.childNodes[i].nodeType === 3 && avatarBox.childNodes[i].nodeValue.trim() !== '') {
                        avatarBox.childNodes[i].nodeValue = identity.charAt(0).toUpperCase();
                        break;
                    }
                }
                updateSeatMicState(identity, isMuted);
                return assignedSeat;
            }
        }

        function updateSeatMicState(identity, isMuted) {
            const seat = document.querySelector('.seat[data-identity="' + identity + '"]');
            if (seat) {
                const avatar = seat.querySelector('.avatar-box');
                if (isMuted) {
                    avatar.classList.remove('mic-open');
                } else {
                    avatar.classList.add('mic-open');
                }
            }
        }

        function startMicTimer() {
            isCooldown = false;
            timeLeft = 60;
            timerCircle.style.strokeDasharray = circleLength;
            timerCircle.style.strokeDashoffset = 0;
            timerCircle.style.stroke = '#ffd700'; 
            
            clearInterval(micInterval);
            micInterval = setInterval(function() {
                timeLeft -= 0.1;
                if (timeLeft <= 0) {
                    timeLeft = 0;
                    closeMicAndCooldown();
                } else {
                    const offset = circleLength - (timeLeft / 60) * circleLength;
                    timerCircle.style.strokeDashoffset = offset;
                }
            }, 100);
        }

        function closeMicAndCooldown() {
            isCooldown = true;
            clearInterval(micInterval);
            room.localParticipant.setMicrophoneEnabled(false);
            micBtn.classList.remove('open');
            micBtn.classList.add('cooldown');
            stopVisualizer();

            let cooldown = 3.0;
            timerCircle.style.stroke = '#dc3545'; 
            timerCircle.style.strokeDashoffset = circleLength; 

            clearInterval(cooldownInterval);
            cooldownInterval = setInterval(function() {
                cooldown -= 0.1;
                if (cooldown <= 0) {
                    clearInterval(cooldownInterval);
                    isCooldown = false;
                    timerCircle.style.strokeDashoffset = 0; 
                    micBtn.classList.remove('cooldown');
                    micBtn.classList.add('closed');
                    micBtn.querySelector('.mic-icon').innerText = '🎙️';
                } else {
                    micBtn.querySelector('.mic-icon').innerText = Math.ceil(cooldown);
                    const fillOffset = (cooldown / 3.0) * circleLength;
                    timerCircle.style.strokeDashoffset = fillOffset;
                }
            }, 100);
        }

        function startVisualizer() {
            if (!room.localParticipant.isMicrophoneEnabled) return;
            const pub = room.localParticipant.getTrackPublication(LivekitClient.Track.Source.Microphone);
            if (!pub || !pub.track) return;
            
            micStream = new MediaStream([pub.track.mediaStreamTrack]);
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioCtx.createAnalyser();
            const source = audioCtx.createMediaStreamSource(micStream);
            source.connect(analyser);
            analyser.fftSize = 256;
            dataArray = new Uint8Array(analyser.frequencyBinCount);
            visualizerContainer.style.display = 'block';

            function draw() {
                if (!room.localParticipant.isMicrophoneEnabled) return;
                requestAnimationFrame(draw);
                
                analyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) { sum += dataArray[i]; }
                let average = sum / dataArray.length;
                
                // نمایش نوار بر اساس صدا
                let widthPercent = (average / 255) * 100;
                if(widthPercent < 5) widthPercent = 5;
                visualizerBar.style.width = widthPercent + '%';
            }
            draw();
        }

        function stopVisualizer() {
            if (audioCtx) { audioCtx.close(); audioCtx = null; }
            visualizerBar.style.width = '0%';
            visualizerContainer.style.display = 'none';
        }

        room.on(LivekitClient.RoomEvent.TrackSubscribed, function(track) {
            if (track.kind === 'audio') document.getElementById('audio-container').appendChild(track.attach());
        });

        room.on(LivekitClient.RoomEvent.ParticipantConnected, function(participant) {
            assignSeat(participant.identity, !participant.isMicrophoneEnabled);
            showNotification('وارد اتاق شد', participant.identity, true);
        });

        room.on(LivekitClient.RoomEvent.ParticipantDisconnected, function(participant) {
            const seat = document.querySelector('.seat[data-identity="' + participant.identity + '"]');
            if (seat) {
                seat.classList.add('empty');
                seat.classList.remove('hand-raised');
                seat.querySelector('.avatar-box').classList.remove('mic-open');
                seat.removeAttribute('data-identity');
            }
            showNotification('از اتاق خارج شد', participant.identity, true);
        });

        // آپدیت وضعیت میکروفن باز/بسته دیگران
        room.on(LivekitClient.RoomEvent.TrackMuted, function(pub, participant) {
            if (pub.kind === 'audio') updateSeatMicState(participant.identity, true);
        });
        room.on(LivekitClient.RoomEvent.TrackUnmuted, function(pub, participant) {
            if (pub.kind === 'audio') updateSeatMicState(participant.identity, false);
        });

        room.on(LivekitClient.RoomEvent.Disconnected, function() {
            micBtn.classList.add('disconnected');
            micBtn.classList.remove('closed', 'open', 'cooldown');
            stopVisualizer();
            showNotification('ارتباط با سرور قطع شد', 'سیستم', true);
        });
        room.on(LivekitClient.RoomEvent.Reconnecting, function() {
            micBtn.classList.add('disconnected');
        });
        room.on(LivekitClient.RoomEvent.Reconnected, function() {
            micBtn.classList.remove('disconnected');
            if(room.localParticipant.isMicrophoneEnabled) {
                micBtn.classList.add('open');
            } else {
                micBtn.classList.add('closed');
            }
        });

        room.on(LivekitClient.RoomEvent.DataReceived, function(payload, participant) {
            const data = JSON.parse(new TextDecoder().decode(payload));
            if (data.type === 'chat') {
                showNotification(data.text, participant.identity, false);
            } 
            else if (data.type === 'hand') {
                const seat = document.querySelector('.seat[data-identity="' + participant.identity + '"]');
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

        document.getElementById('joinBtn').onclick = async function() {
            const user = document.getElementById('username').value.trim();
            const rm = document.getElementById('roomname').value.trim();
            if (!user || !rm) return alert('اسم و نام اتاق را وارد کن!');
            
            const btn = document.getElementById('joinBtn');
            btn.innerText = 'در حال اتصال...';
            btn.disabled = true;
            localUser = user;
            micBtn.classList.add('disconnected');

            try {
                const res = await fetch('/token?room=' + encodeURIComponent(rm) + '&user=' + encodeURIComponent(user));
                const data = await res.json();
                if(data.error) throw new Error(data.error);

                await room.connect(LIVEKIT_URL, data.token);
                await room.localParticipant.setMicrophoneEnabled(false); 
                
                loginUI.style.display = 'none';
                gameRoom.style.display = 'flex';
                document.getElementById('displayRoomName').innerText = rm;
                
                micBtn.classList.remove('disconnected');
                micBtn.classList.add('closed');
                
                assignSeat(user, true);
                showNotification('شما وارد اتاق شدید', user, true);
                
            } catch (e) {
                alert('خطا: ' + e.message);
                btn.innerText = 'ورود به بازی';
                btn.disabled = false;
                micBtn.classList.remove('disconnected');
            }
        };

        micBtn.onclick = async function() {
            if (isCooldown || micBtn.classList.contains('disconnected')) return;

            const isMicOn = room.localParticipant.isMicrophoneEnabled;
            if (!isMicOn) {
                await room.localParticipant.setMicrophoneEnabled(true);
                micBtn.classList.remove('closed');
                micBtn.classList.add('open');
                micBtn.querySelector('.mic-icon').innerText = '🎙️';
                updateSeatMicState(localUser, false);
                startMicTimer();
                setTimeout(startVisualizer, 300);
            } else {
                updateSeatMicState(localUser, true);
                closeMicAndCooldown();
            }
        };

        raiseHandBtn.onclick = function() {
            isHandRaised = !isHandRaised;
            sendData({ type: 'hand', state: isHandRaised });
            
            const mySeat = document.querySelector('.seat[data-identity="' + localUser + '"]');
            if (isHandRaised) {
                raiseHandBtn.classList.add('active');
                if(mySeat) mySeat.classList.add('hand-raised');
            } else {
                raiseHandBtn.classList.remove('active');
                if(mySeat) mySeat.classList.remove('hand-raised');
            }
        };

        openChatBtn.onclick = function() {
            chatModal.style.display = 'flex';
            modalChatInput.value = '';
            modalChatInput.focus();
        };

        cancelModalBtn.onclick = function() { chatModal.style.display = 'none'; };

        sendModalMsgBtn.onclick = function() {
            const text = modalChatInput.value.trim();
            if (!text) return;
            sendData({ type: 'chat', text: text });
            showNotification(text, localUser, false);
            chatModal.style.display = 'none';
        };

        chatModal.onclick = function(e) {
            if (e.target === chatModal) chatModal.style.display = 'none';
        };

        document.getElementById('leaveBtn').onclick = async function() {
            if(confirm('آیا می‌خواهید از اتاق خارج شوید؟')) {
                await room.disconnect();
                window.location.reload();
            }
        };
    </script>
</body>
</html>
