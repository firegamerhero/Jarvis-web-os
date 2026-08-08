/* ==========================================================================
   J.A.R.V.I.S. OS - MASTER UI & HARDWARE KERNEL (v8.6 - STABILITY PATCH)
   CHANGES FROM v8.5:
   - Removed {alpha:false} from canvas context — it was making the canvas
     opaque, which silently broke the rgba() fade-trail effect the whole
     particle system depends on
   - Audio unlock listener now uses capture phase, so a stopPropagation()
     on a window-control button no longer prevents audio from unlocking
     if that happens to be the user's first tap
   - Clock is now 12-hour with AM/PM
   - Weather icon gets a pulse-in transition when it updates instead of
     just snapping to the new emoji
   - New Voice module: speaks the boot greeting with a synced caption
   ========================================================================== */

"use strict";

window.JARVIS = window.JARVIS || {};

// ==========================================================================
// 1. GLOBAL AUDIO SYNTHESIZER (No MP3s needed)
// ==========================================================================
window.AudioFX = {
    ctx: null,
    unlocked: false,

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },

    unlock() {
        if (this.unlocked) return;
        this.init();
        const buffer = this.ctx.createBuffer(1, 1, 22050);
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.ctx.destination);
        source.start(0);
        this.unlocked = true;
        window.JARVIS.Logger?.log('AUDIO', 'Web Audio API Unlocked & Ready.');
    },

    playBeep(freq = 800, type = "sine", duration = 0.08, vol = 0.05) {
        try {
            this.init();
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

            gain.gain.setValueAtTime(vol, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {
            // Audio context is strictly locked until user taps the screen
        }
    }
};

// capture:true so a child element's stopPropagation() can't block this
// from ever firing (window-control buttons do exactly that)
document.addEventListener('pointerdown', () => window.AudioFX.unlock(), { once: true, capture: true });


// ==========================================================================
// 2. 60FPS REACTIVE BACKGROUND ENGINE (Rings + Particles)
// ==========================================================================
window.JARVIS.BackgroundEngine = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    particles: [],
    angle: 0,
    pointer: { x: -1000, y: -1000 },
    isRunning: false,

    init() {
        this.canvas = document.getElementById("jarvis-canvas");
        if (!this.canvas) return;

        // NOTE: no {alpha:false} here — that was forcing the canvas opaque
        // and killing the rgba() fade-trail effect below.
        this.ctx = this.canvas.getContext("2d");
        this.resize();

        window.addEventListener("resize", () => this.resize());
        window.addEventListener("pointermove", (e) => {
            this.pointer.x = e.clientX;
            this.pointer.y = e.clientY;
        });

        this.particles = Array.from({ length: 60 }, () => this.createParticle());

        this.isRunning = true;
        this.render();
        window.JARVIS.Logger?.log('UI', 'Canvas Background Engine initialized at 60FPS.');
    },

    resize() {
        this.width = this.canvas.width = window.innerWidth;
        this.height = this.canvas.height = window.innerHeight;
    },

    createParticle() {
        return {
            x: Math.random() * this.width,
            y: Math.random() * this.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            size: Math.random() * 2 + 0.5,
            baseAlpha: Math.random() * 0.5 + 0.1
        };
    },

    render() {
        if (!this.isRunning) return;

        this.ctx.fillStyle = "rgba(1, 2, 5, 0.3)";
        this.ctx.fillRect(0, 0, this.width, this.height);

        const centerX = this.width / 2;
        const centerY = this.height / 2;

        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        this.angle += 0.002;

        this.ctx.rotate(this.angle);
        this.ctx.strokeStyle = "rgba(0, 243, 255, 0.08)";
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 220, 0, Math.PI * 2);
        this.ctx.stroke();

        this.ctx.rotate(-this.angle * 2.5);
        this.ctx.strokeStyle = "rgba(0, 243, 255, 0.15)";
        this.ctx.setLineDash([15, 15, 5, 10]);
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 150, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.restore();

        this.particles.forEach((p) => {
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0) p.x = this.width;
            if (p.x > this.width) p.x = 0;
            if (p.y < 0) p.y = this.height;
            if (p.y > this.height) p.y = 0;

            this.ctx.fillStyle = `rgba(0, 243, 255, ${p.baseAlpha})`;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();

            const dx = this.pointer.x - p.x;
            const dy = this.pointer.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 150) {
                const opacity = 0.4 * (1 - dist / 150);
                this.ctx.strokeStyle = `rgba(0, 243, 255, ${opacity})`;
                this.ctx.lineWidth = 0.5;
                this.ctx.beginPath();
                this.ctx.moveTo(p.x, p.y);
                this.ctx.lineTo(this.pointer.x, this.pointer.y);
                this.ctx.stroke();
            }
        });

        requestAnimationFrame(() => this.render());
    }
};


// ==========================================================================
// 3. START MENU CONTROLLER
// ==========================================================================
window.JARVIS.StartMenu = {
    isOpen: false,
    menuEl: null,
    btnEl: null,
    searchInput: null,

    init() {
        this.menuEl = document.getElementById('start-menu');
        this.btnEl = document.getElementById('start-btn');
        this.searchInput = document.getElementById('start-search');

        if (!this.menuEl || !this.btnEl) return;

        this.btnEl.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });

        document.getElementById('desktop-workspace')?.addEventListener('pointerdown', () => {
            if (this.isOpen) this.close();
        });

        this.searchInput?.addEventListener('input', (e) => this.handleSearch(e.target.value));

        window.JARVIS.Logger?.log('UI', 'Start Menu Controller hooked.');
    },

    toggle() {
        if (window.AudioFX) window.AudioFX.playBeep(this.isOpen ? 400 : 700, "square", 0.05);
        this.isOpen ? this.close() : this.open();
    },

    open() {
        this.isOpen = true;
        this.menuEl.classList.remove('hidden');
        this.btnEl.classList.add('active');
        this.populateMenu();
        setTimeout(() => this.searchInput?.focus(), 300);
    },

    close() {
        this.isOpen = false;
        this.menuEl.classList.add('hidden');
        this.btnEl.classList.remove('active');
        if (this.searchInput) this.searchInput.value = '';
    },

    populateMenu() {
        const appList = document.getElementById('start-app-list');
        if (!appList) return;

        appList.innerHTML = '';

        if (window.JARVIS.State.installedApps.size === 0) {
            appList.innerHTML = '<div class="start-empty-msg">No applications installed yet.</div>';
            return;
        }

        window.JARVIS.State.installedApps.forEach(app => {
            const el = document.createElement('div');
            el.className = 'start-app-item';
            el.innerHTML = `
                <div class="start-app-icon">${app.icon}</div>
                <div class="start-app-name">${app.name}</div>
            `;
            el.addEventListener('click', () => {
                this.close();
                window.JARVIS.Core.requestAppLaunch(app.id);
            });
            appList.appendChild(el);
        });
    },

    handleSearch(query) {
        query = query.toLowerCase();
        const items = document.querySelectorAll('.start-app-item');

        items.forEach(item => {
            const nameEl = item.querySelector('.start-app-name');
            if (!nameEl) return;
            const name = nameEl.innerText.toLowerCase();
            item.style.display = name.includes(query) ? 'flex' : 'none';
        });
    }
};


// ==========================================================================
// 4. HARDWARE SENSORS (Clock, Battery, Weather API)
// ==========================================================================
window.JARVIS.Hardware = {

    init() {
        this.updateClock();
        this.updateBattery();
        this.fetchWeather();

        setInterval(() => this.updateClock(), 1000);
        setInterval(() => this.fetchWeather(), 900000); // 15 mins

        window.JARVIS.Logger?.log('UI', 'Hardware sensors engaged.');
    },

    updateClock() {
        const now = new Date();
        let hours = now.getHours();
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const period = hours >= 12 ? 'PM' : 'AM';

        hours = hours % 12;
        if (hours === 0) hours = 12; // 0 -> 12 for midnight/noon

        const clockDisplay = document.getElementById("clock-display");
        const dateDisplay = document.getElementById("date-display");

        if (clockDisplay) clockDisplay.innerText = `${hours}:${minutes} ${period}`;
        if (dateDisplay) dateDisplay.innerText = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    },

    async updateBattery() {
        const batteryDisplay = document.getElementById("battery-display");
        if (!batteryDisplay) return;

        if (navigator.getBattery) {
            try {
                const battery = await navigator.getBattery();

                const updateStatus = () => {
                    const level = Math.round(battery.level * 100);
                    const isCharging = battery.charging;
                    batteryDisplay.innerText = `${isCharging ? "⚡" : "🔋"} ${level}%`;

                    if (level <= 15 && !isCharging) {
                        batteryDisplay.style.color = "var(--crimson-core)";
                        batteryDisplay.classList.add("critical-pulse");
                    } else {
                        batteryDisplay.style.color = "inherit";
                        batteryDisplay.classList.remove("critical-pulse");
                    }
                };

                updateStatus();
                battery.addEventListener("levelchange", updateStatus);
                battery.addEventListener("chargingchange", updateStatus);
            } catch (e) {
                batteryDisplay.style.display = "none";
            }
        } else {
            batteryDisplay.style.display = "none";
        }
    },

    async fetchWeather() {
        const tempElem = document.getElementById("weather-temp");
        const iconElem = document.getElementById("weather-icon");
        if (!tempElem || !iconElem) return;

        try {
            const response = await fetch("https://api.open-meteo.com/v1/forecast?latitude=26.85&longitude=80.95&current_weather=true");
            if (!response.ok) throw new Error("Weather API Down");

            const data = await response.json();
            const code = data.current_weather.weathercode;
            const temp = Math.round(data.current_weather.temperature);

            tempElem.innerText = `${temp}°C`;

            let nextIcon = "🌤️";
            if (code === 0) nextIcon = "☀️";
            else if (code >= 1 && code <= 3) nextIcon = "☁️";
            else if (code >= 45 && code <= 48) nextIcon = "🌫️";
            else if (code >= 51 && code <= 67) nextIcon = "🌧️";
            else if (code >= 71 && code <= 77) nextIcon = "❄️";
            else if (code >= 95) nextIcon = "🌩️";

            // Replay the pulse-in animation every time the icon actually changes
            if (iconElem.innerText !== nextIcon) {
                iconElem.innerText = nextIcon;
                iconElem.classList.remove('weather-pulse');
                void iconElem.offsetWidth; // force reflow so the animation can restart
                iconElem.classList.add('weather-pulse');
            }

        } catch (error) {
            window.JARVIS.Logger?.warn('HARDWARE', 'Weather sync failed.', error);
            tempElem.innerText = "Offline";
            iconElem.innerText = "⚠️";
        }
    }
};

// ==========================================================================
// 5. VOICE GREETING (Web Speech Synthesis)
// Speaks once, on first boot, with a synced on-screen caption. Browsers
// require a user gesture before playing audio on mobile — if speech
// synthesis is blocked, the caption still displays so the greeting is
// never silently lost.
// ==========================================================================
window.JARVIS.Voice = {
    hasGreeted: false,
    GREETING: "Hi, I am Jarvis, your virtual A.I. assistant. Ready to help on your command.",

    greet() {
        if (this.hasGreeted) return;
        this.hasGreeted = true;

        this.showCaption(this.GREETING);

        if (!('speechSynthesis' in window)) {
            window.JARVIS.Logger?.warn('VOICE', 'speechSynthesis not supported on this browser.');
            return;
        }

        try {
            const utter = new SpeechSynthesisUtterance(this.GREETING);
            utter.rate = 0.95;
            utter.pitch = 0.85;
            utter.volume = 1;

            utter.onend = () => this.hideCaption();
            utter.onerror = () => this.hideCaption();

            // Some browsers need voices loaded async before speak() works reliably
            const voices = window.speechSynthesis.getVoices();
            if (voices.length) {
                const preferred = voices.find(v => /male|david|daniel/i.test(v.name)) || voices[0];
                if (preferred) utter.voice = preferred;
            }

            window.speechSynthesis.speak(utter);
        } catch (e) {
            window.JARVIS.Logger?.warn('VOICE', 'Speech synthesis failed to start.', e);
            setTimeout(() => this.hideCaption(), 3500);
        }
    },

    showCaption(text) {
        let caption = document.getElementById('voice-caption');
        if (!caption) {
            caption = document.createElement('div');
            caption.id = 'voice-caption';
            document.body.appendChild(caption);
        }
        caption.textContent = text;
        caption.classList.remove('hidden');
    },

    hideCaption() {
        const caption = document.getElementById('voice-caption');
        if (caption) {
            setTimeout(() => caption.classList.add('hidden'), 400);
        }
    }
};

// ==========================================================================
// 6. BOOTSTRAP MODULES ON LOAD
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    if (window.JARVIS) {
        setTimeout(() => {
            window.JARVIS.BackgroundEngine.init();
            window.JARVIS.StartMenu.init();
            window.JARVIS.Hardware.init();
        }, 100);
    }
});
