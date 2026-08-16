/* =========================================
   JARVIS WebOS - Clock & Chronometer Suite
   ========================================= */

registerApp("clock", () => {
    return {
        title: "Chronometer Matrix",
        icon: "fa-clock",
        width: 540,
        height: 480,
        content: `
            <div style="display: flex; flex-direction: column; height: 100%; gap: 12px;">
                <!-- Navigation Tabs -->
                <div style="display: flex; gap: 8px; border-bottom: 1px solid var(--glass-border); padding-bottom: 10px;">
                    <button class="clk-tab active" data-tab="world" style="flex: 1;"><i class="fa-solid fa-earth-americas"></i> World</button>
                    <button class="clk-tab" data-tab="stopwatch" style="flex: 1;"><i class="fa-solid fa-stopwatch"></i> Stopwatch</button>
                    <button class="clk-tab" data-tab="timer" style="flex: 1;"><i class="fa-solid fa-hourglass-half"></i> Timer</button>
                    <button class="clk-tab" data-tab="alarm" style="flex: 1;"><i class="fa-solid fa-bell"></i> Alarm</button>
                </div>

                <!-- TAB 1: World Clock -->
                <div id="tab-world" class="clk-view" style="display: flex; flex-direction: column; gap: 14px;">
                    <div style="text-align: center; background: rgba(0,0,0,0.5); padding: 15px; border-radius: 8px; border: 1px solid var(--primary-dim);">
                        <div style="font-size: 0.8rem; color: var(--primary-color); letter-spacing: 2px; text-transform: uppercase;">Primary Local Time</div>
                        <div id="clk-local-time" style="font-size: 2.5rem; font-family: monospace; font-weight: bold; color: var(--text-main); margin: 5px 0;">00:00:00</div>
                        <div id="clk-local-date" style="font-size: 0.85rem; color: var(--text-muted);">---</div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <div class="clk-zone-card"><span>London (GMT)</span><strong id="clk-london">--:--</strong></div>
                        <div class="clk-zone-card"><span>New York (EST)</span><strong id="clk-ny">--:--</strong></div>
                        <div class="clk-zone-card"><span>Tokyo (JST)</span><strong id="clk-tokyo">--:--</strong></div>
                        <div class="clk-zone-card"><span>Sydney (AEST)</span><strong id="clk-sydney">--:--</strong></div>
                    </div>
                </div>

                <!-- TAB 2: Stopwatch -->
                <div id="tab-stopwatch" class="clk-view" style="display: none; flex-direction: column; gap: 15px; text-align: center;">
                    <div id="sw-display" style="font-size: 3rem; font-family: monospace; font-weight: bold; color: var(--primary-color); text-shadow: var(--glow-shadow); margin: 15px 0;">00:00.00</div>
                    <div style="display: flex; justify-content: center; gap: 12px;">
                        <button id="sw-start-btn" class="clk-btn"><i class="fa-solid fa-play"></i> Start</button>
                        <button id="sw-lap-btn" class="clk-btn" disabled><i class="fa-solid fa-flag"></i> Lap</button>
                        <button id="sw-reset-btn" class="clk-btn" style="border-color: var(--danger); color: var(--danger);"><i class="fa-solid fa-rotate-left"></i> Reset</button>
                    </div>
                    <div id="sw-laps" style="flex: 1; max-height: 140px; overflow-y: auto; background: rgba(0,0,0,0.4); border-radius: 6px; padding: 8px; border: 1px solid var(--glass-border); font-family: monospace; font-size: 0.85rem; text-align: left;"></div>
                </div>

                <!-- TAB 3: Countdown Timer -->
                <div id="tab-timer" class="clk-view" style="display: none; flex-direction: column; gap: 15px; text-align: center;">
                    <div id="tm-setup" style="display: flex; justify-content: center; align-items: center; gap: 10px; margin-top: 10px;">
                        <input type="number" id="tm-min" min="0" max="99" value="5" style="width: 70px; padding: 10px; background: rgba(0,0,0,0.6); border: 1px solid var(--primary-dim); color: var(--text-main); font-size: 1.5rem; text-align: center; border-radius: 6px; outline: none; font-family: monospace;">
                        <span style="font-size: 1.5rem; color: var(--primary-color);">m</span>
                        <input type="number" id="tm-sec" min="0" max="59" value="0" style="width: 70px; padding: 10px; background: rgba(0,0,0,0.6); border: 1px solid var(--primary-dim); color: var(--text-main); font-size: 1.5rem; text-align: center; border-radius: 6px; outline: none; font-family: monospace;">
                        <span style="font-size: 1.5rem; color: var(--primary-color);">s</span>
                    </div>
                    <div id="tm-display" style="display: none; font-size: 3.2rem; font-family: monospace; font-weight: bold; color: var(--primary-color); text-shadow: var(--glow-shadow);">05:00</div>
                    <div style="display: flex; justify-content: center; gap: 12px; margin-top: 10px;">
                        <button id="tm-start-btn" class="clk-btn"><i class="fa-solid fa-play"></i> Start</button>
                        <button id="tm-cancel-btn" class="clk-btn" style="display: none; border-color: var(--danger); color: var(--danger);"><i class="fa-solid fa-xmark"></i> Cancel</button>
                    </div>
                </div>

                <!-- TAB 4: Alarm -->
                <div id="tab-alarm" class="clk-view" style="display: none; flex-direction: column; gap: 15px;">
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <input type="time" id="alarm-time-input" style="flex: 1; padding: 10px; background: rgba(0,0,0,0.6); border: 1px solid var(--glass-border); color: var(--text-main); border-radius: 6px; outline: none; font-family: monospace; font-size: 1rem;">
                        <button id="alarm-set-btn" class="clk-btn"><i class="fa-solid fa-plus"></i> Arm Alarm</button>
                    </div>
                    <div id="alarm-list" style="display: flex; flex-direction: column; gap: 8px; flex: 1; overflow-y: auto; max-height: 200px;">
                        <!-- Armed alarms populated here -->
                    </div>
                </div>
            </div>

            <style>
                .clk-tab {
                    padding: 8px;
                    background: transparent;
                    border: 1px solid var(--glass-border);
                    color: var(--text-muted);
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.85rem;
                    transition: 0.2s;
                }
                .clk-tab.active, .clk-tab:hover {
                    background: var(--primary-dim);
                    color: var(--primary-color);
                    border-color: var(--primary-color);
                }
                .clk-btn {
                    padding: 8px 18px;
                    background: var(--primary-dim);
                    border: 1px solid var(--primary-color);
                    color: var(--primary-color);
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: bold;
                    transition: 0.2s;
                }
                .clk-btn:hover:not(:disabled) {
                    background: var(--primary-color);
                    color: #000;
                }
                .clk-btn:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                }
                .clk-zone-card {
                    background: rgba(0,0,0,0.4);
                    padding: 10px 14px;
                    border-radius: 6px;
                    border: 1px solid var(--glass-border);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 0.85rem;
                }
                .clk-zone-card strong {
                    color: var(--primary-color);
                    font-family: monospace;
                    font-size: 1rem;
                }
            </style>
        `,
        onInit: (win) => {
            // Built-in Synthesizer Sound Generator for Alerts
            function triggerAlarmBeep() {
                try {
                    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                    for (let i = 0; i < 3; i++) {
                        setTimeout(() => {
                            const osc = audioCtx.createOscillator();
                            const gain = audioCtx.createGain();
                            osc.type = "sawtooth";
                            osc.frequency.value = 880; // A5 tone
                            gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
                            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
                            osc.connect(gain);
                            gain.connect(audioCtx.destination);
                            osc.start();
                            osc.stop(audioCtx.currentTime + 0.25);
                        }, i * 350);
                    }
                } catch (e) {
                    console.warn("Audio Context alert blocked: ", e);
                }
            }

            // Tab Navigation
            const tabs = win.querySelectorAll(".clk-tab");
            const views = win.querySelectorAll(".clk-view");
            tabs.forEach(tab => {
                tab.addEventListener("click", () => {
                    tabs.forEach(t => t.classList.remove("active"));
                    views.forEach(v => v.style.display = "none");
                    tab.classList.add("active");
                    const target = win.querySelector(`#tab-${tab.dataset.tab}`);
                    if (target) target.style.display = "flex";
                });
            });

            // 1. World Clock Updater
            const localTimeEl = win.querySelector("#clk-local-time");
            const localDateEl = win.querySelector("#clk-local-date");
            const londonEl = win.querySelector("#clk-london");
            const nyEl = win.querySelector("#clk-ny");
            const tokyoEl = win.querySelector("#clk-tokyo");
            const sydneyEl = win.querySelector("#clk-sydney");

            function updateWorldClocks() {
                const now = new Date();
                localTimeEl.textContent = now.toLocaleTimeString();
                localDateEl.textContent = now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });

                const fmt = (tz) => new Intl.DateTimeFormat([], { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(now);
                londonEl.textContent = fmt("Europe/London");
                nyEl.textContent = fmt("America/New_York");
                tokyoEl.textContent = fmt("Asia/Tokyo");
                sydneyEl.textContent = fmt("Australia/Sydney");

                // Alarm Verification Routine
                checkAlarms(now);
            }
            const clockInterval = setInterval(updateWorldClocks, 1000);
            updateWorldClocks();

            // 2. Stopwatch Logic
            let swInterval = null;
            let swStartTime = 0;
            let swElapsedTime = 0;
            const swDisplay = win.querySelector("#sw-display");
            const swStartBtn = win.querySelector("#sw-start-btn");
            const swLapBtn = win.querySelector("#sw-lap-btn");
            const swResetBtn = win.querySelector("#sw-reset-btn");
            const swLaps = win.querySelector("#sw-laps");

            function formatStopwatch(ms) {
                const totalSeconds = Math.floor(ms / 1000);
                const minutes = Math.floor(totalSeconds / 60);
                const seconds = totalSeconds % 60;
                const centiseconds = Math.floor((ms % 1000) / 10);
                return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}`;
            }

            swStartBtn.addEventListener("click", () => {
                if (!swInterval) {
                    swStartTime = performance.now() - swElapsedTime;
                    swInterval = setInterval(() => {
                        swElapsedTime = performance.now() - swStartTime;
                        swDisplay.textContent = formatStopwatch(swElapsedTime);
                    }, 30);
                    swStartBtn.innerHTML = `<i class="fa-solid fa-pause"></i> Pause`;
                    swLapBtn.disabled = false;
                } else {
                    clearInterval(swInterval);
                    swInterval = null;
                    swStartBtn.innerHTML = `<i class="fa-solid fa-play"></i> Resume`;
                    swLapBtn.disabled = true;
                }
            });

            swLapBtn.addEventListener("click", () => {
                if (swInterval) {
                    const lapTime = formatStopwatch(swElapsedTime);
                    const lapItem = document.createElement("div");
                    lapItem.style.padding = "4px 0";
                    lapItem.style.borderBottom = "1px solid rgba(255,255,255,0.05)";
                    lapItem.innerHTML = `<span style="color: var(--primary-color)">LAP ${swLaps.children.length + 1}</span>: ${lapTime}`;
                    swLaps.prepend(lapItem);
                }
            });

            swResetBtn.addEventListener("click", () => {
                clearInterval(swInterval);
                swInterval = null;
                swElapsedTime = 0;
                swDisplay.textContent = "00:00.00";
                swStartBtn.innerHTML = `<i class="fa-solid fa-play"></i> Start`;
                swLapBtn.disabled = true;
                swLaps.innerHTML = "";
            });

            // 3. Countdown Timer Logic
            let tmInterval = null;
            let tmRemainingSeconds = 0;
            const tmMin = win.querySelector("#tm-min");
            const tmSec = win.querySelector("#tm-sec");
            const tmSetup = win.querySelector("#tm-setup");
            const tmDisplay = win.querySelector("#tm-display");
            const tmStartBtn = win.querySelector("#tm-start-btn");
            const tmCancelBtn = win.querySelector("#tm-cancel-btn");

            function updateTimerDisplay() {
                const m = Math.floor(tmRemainingSeconds / 60);
                const s = tmRemainingSeconds % 60;
                tmDisplay.textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
            }

            tmStartBtn.addEventListener("click", () => {
                const total = (parseInt(tmMin.value) || 0) * 60 + (parseInt(tmSec.value) || 0);
                if (total <= 0) return;

                tmRemainingSeconds = total;
                updateTimerDisplay();
                tmSetup.style.display = "none";
                tmDisplay.style.display = "block";
                tmStartBtn.style.display = "none";
                tmCancelBtn.style.display = "inline-block";

                tmInterval = setInterval(() => {
                    tmRemainingSeconds--;
                    updateTimerDisplay();
                    if (tmRemainingSeconds <= 0) {
                        clearInterval(tmInterval);
                        tmInterval = null;
                        triggerAlarmBeep();
                        alert("JARVIS TIMER PROTOCOL EXPIRED");
                        resetTimer();
                    }
                }, 1000);
            });

            function resetTimer() {
                clearInterval(tmInterval);
                tmInterval = null;
                tmSetup.style.display = "flex";
                tmDisplay.style.display = "none";
                tmStartBtn.style.display = "inline-block";
                tmCancelBtn.style.display = "none";
            }
            tmCancelBtn.addEventListener("click", resetTimer);

            // 4. Alarm Logic
            const alarms = [];
            const alarmInput = win.querySelector("#alarm-time-input");
            const alarmSetBtn = win.querySelector("#alarm-set-btn");
            const alarmList = win.querySelector("#alarm-list");

            alarmSetBtn.addEventListener("click", () => {
                const val = alarmInput.value;
                if (!val || alarms.includes(val)) return;
                alarms.push(val);
                renderAlarms();
            });

            function renderAlarms() {
                alarmList.innerHTML = "";
                alarms.forEach((timeStr, idx) => {
                    const row = document.createElement("div");
                    row.style.display = "flex";
                    row.style.justifyContent = "space-between";
                    row.style.alignItems = "center";
                    row.style.padding = "8px 12px";
                    row.style.background = "rgba(0,0,0,0.5)";
                    row.style.border = "1px solid var(--primary-dim)";
                    row.style.borderRadius = "6px";
                    row.innerHTML = `
                        <span style="font-family: monospace; font-size: 1.1rem; color: var(--text-main);"><i class="fa-solid fa-bell" style="color: var(--primary-color); margin-right: 8px;"></i> ${timeStr}</span>
                        <button class="alarm-del-btn" style="background: none; border: none; color: var(--danger); cursor: pointer; font-size: 1rem;"><i class="fa-solid fa-trash"></i></button>
                    `;
                    row.querySelector(".alarm-del-btn").addEventListener("click", () => {
                        alarms.splice(idx, 1);
                        renderAlarms();
                    });
                    alarmList.appendChild(row);
                });
            }

            function checkAlarms(now) {
                const currentHM = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
                if (now.getSeconds() === 0) {
                    const matchIndex = alarms.indexOf(currentHM);
                    if (matchIndex !== -1) {
                        triggerAlarmBeep();
                        alert(`JARVIS ALARM TRIGGERED: ${currentHM}`);
                    }
                }
            }
        }
    };
});
