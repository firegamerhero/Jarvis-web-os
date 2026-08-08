/* ==========================================================================
   J.A.R.V.I.S. OS - MASTER UI & HARDWARE KERNEL (v8.5)
   AUTHOR: SYSTEM
   DESCRIPTION: Handles Web Audio Synthesis, 60FPS Reactive Background, 
   Start Menu Logic, Hardware Sensors (Battery/Clock), and API Weather.
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
        // Play a silent buffer to unlock audio engine on mobile devices
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

// Unlock audio on the very first tap anywhere on the screen
document.addEventListener('pointerdown', () => window.AudioFX.unlock(), { once: true });


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
        
        this.ctx = this.canvas.getContext("2d", { alpha: false });
        this.resize();
        
        window.addEventListener("resize", () => this.resize());
        window.addEventListener("pointermove", (e) => {
            this.pointer.x = e.clientX;
            this.pointer.y = e.clientY;
        });

        // Generate 60 Floating Data Nodes
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

        // Dark fade effect to leave trails
        this.ctx.fillStyle = "rgba(1, 2, 5, 0.3)";
        this.ctx.fillRect(0, 0, this.width, this.height);

        const centerX = this.width / 2;
        const centerY = this.height / 2;

        // --- DRAW HUD RINGS ---
        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        this.angle += 0.002;
        
        // Outer Ring
        this.ctx.rotate(this.angle);
        this.ctx.strokeStyle = "rgba(0, 243, 255, 0.08)";
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 220, 0, Math.PI * 2);
        this.ctx.stroke();

        // Inner Dashed Tech Ring
        this.ctx.rotate(-this.angle * 2.5);
        this.ctx.strokeStyle = "rgba(0, 243, 255, 0.15)";
        this.ctx.setLineDash([15, 15, 5, 10]);
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 150, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.restore();

        // --- DRAW PARTICLES ---
        this.particles.forEach((p) => {
            p.x += p.vx;
            p.y += p.vy;

            // Screen Wrap
            if (p.x < 0) p.x = this.width;
            if (p.x > this.width) p.x = 0;
            if (p.y < 0) p.y = this.height;
            if (p.y > this.height) p.y = 0;

            // Core Draw
            this.ctx.fillStyle = `rgba(0, 243, 255, ${p.baseAlpha})`;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();

            // Connect to pointer logic
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

        // Toggle Start Menu
        this.btnEl.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });

        // Close when clicking outside on the desktop
        document.getElementById('desktop-workspace')?.addEventListener('pointerdown', () => {
            if (this.isOpen) this.close();
        });

        // Search filtering logic
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
        // Focus search box automatically for fast typing
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
        
        // Pull from State (which gets data from the API)
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
            const name = item.querySelector('.start-app-name').innerText.toLowerCase();
            if (name.includes(query)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
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

        // Sync loops
        setInterval(() => this.updateClock(), 1000); // 1 sec
        setInterval(() => this.fetchWeather(), 900000); // 15 mins
        
        window.JARVIS.Logger?.log('UI', 'Hardware sensors engaged.');
    },

    updateClock() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        
        const clockDisplay = document.getElementById("clock-display");
        const dateDisplay = document.getElementById("date-display");
        
        if (clockDisplay) clockDisplay.innerText = `${hours}:${minutes}`;
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
            // Using Open-Meteo free tier for live weather
            const response = await fetch("https://api.open-meteo.com/v1/forecast?latitude=26.85&longitude=80.95&current_weather=true");
            if (!response.ok) throw new Error("Weather API Down");
            
            const data = await response.json();
            const code = data.current_weather.weathercode;
            const temp = Math.round(data.current_weather.temperature);
            
            tempElem.innerText = `${temp}°C`;
            
            // WMO Weather interpretation codes
            if (code === 0) iconElem.innerText = "☀️";
            else if (code >= 1 && code <= 3) iconElem.innerText = "☁️";
            else if (code >= 45 && code <= 48) iconElem.innerText = "🌫️";
            else if (code >= 51 && code <= 67) iconElem.innerText = "🌧️";
            else if (code >= 71 && code <= 77) iconElem.innerText = "❄️";
            else if (code >= 95) iconElem.innerText = "🌩️";
            else iconElem.innerText = "🌤️";
            
        } catch (error) {
            window.JARVIS.Logger?.warn('HARDWARE', 'Weather sync failed.', error);
            tempElem.innerText = "Offline";
            iconElem.innerText = "⚠️";
        }
    }
};

// ==========================================================================
// 5. BOOTSTRAP MODULES ON LOAD
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    // Only initialize if the namespace exists
    if (window.JARVIS) {
        setTimeout(() => {
            window.JARVIS.BackgroundEngine.init();
            window.JARVIS.StartMenu.init();
            window.JARVIS.Hardware.init();
        }, 100);
    }
});
