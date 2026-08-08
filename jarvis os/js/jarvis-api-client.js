/* ==========================================================================
   J.A.R.V.I.S. OS - MASTER API & STATE CLIENT (v8.6 - STABILITY PATCH)
   CHANGES FROM v8.5:
   - Added global window.onerror / unhandledrejection -> Diagnostics hook
     (previously uncaught errors outside try/catch just vanished silently)
   - Added JS-level pinch-zoom / double-tap-zoom prevention. The
     "user-scalable=no" meta tag is ignored by many Android browsers for
     accessibility reasons, so the meta tag alone never reliably worked.
   ========================================================================== */

"use strict";

// ==========================================================================
// 1. GLOBAL NAMESPACE INITIALIZATION
// ==========================================================================
window.JARVIS = window.JARVIS || {};

// ==========================================================================
// 2. SYSTEM CONSTANTS & CONFIGURATION
// ==========================================================================
window.JARVIS.Config = {
    API_URL: "http://localhost:8000/api", // Your future Python backend
    TIMEOUT_MS: 5000,
    MAX_RETRIES: 3,
    SIMULATION_MODE: true, // Flip to false once your Python server is live
    VERSION: "8.6.0",
    DEVICE_TYPE: /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
};

// ==========================================================================
// 3. MASTER STATE MANAGER (The Brain)
// ==========================================================================
window.JARVIS.State = {
    installedApps: new Map(),
    activeWindows: new Map(),
    activeWidgets: new Set(),
    highestZIndex: 100,
    isBooting: true,
    systemLocked: false,
    networkStatus: 'offline',

    getApp(appId) {
        return this.installedApps.get(appId) || null;
    },

    registerApp(appData) {
        if (!appData || !appData.id) return false;
        this.installedApps.set(appData.id, appData);
        return true;
    }
};

// ==========================================================================
// 4. ADVANCED SYSTEM LOGGER
// ==========================================================================
window.JARVIS.Logger = {
    log(module, message, data = null) {
        console.log(`%c[${module}]%c ${message}`, 'color: #00f3ff; font-weight: bold;', 'color: #e0f7fc;', data || '');
    },
    warn(module, message, data = null) {
        console.warn(`%c[${module}]%c ${message}`, 'color: #ffcc00; font-weight: bold;', 'color: #e0f7fc;', data || '');
    },
    error(module, message, error = null) {
        console.error(`%c[${module} ERROR]%c ${message}`, 'color: #ff3b30; font-weight: bold;', 'color: #ff3b30;', error || '');
        window.JARVIS.Diagnostics.recordError(module, message, error);
    }
};

// ==========================================================================
// 5. DIAGNOSTICS & CRASH HANDLER (Kernel Panic)
// ==========================================================================
window.JARVIS.Diagnostics = {
    errorLog: [],

    recordError(module, message, error) {
        this.errorLog.push({ time: new Date().toLocaleTimeString(), module, message, error: String(error) });
    },

    triggerKernelPanic(fatalReason) {
        const crashScreen = document.getElementById('system-crash-screen');
        const errorLogUI = document.getElementById('crash-error-log');

        if (crashScreen && errorLogUI) {
            let logDump = `FATAL ERROR: ${fatalReason}<br><br>--- STACK TRACE ---<br>`;
            this.errorLog.slice(-5).forEach(err => {
                logDump += `[${err.time}] ${err.module}: ${err.message}<br>`;
            });

            errorLogUI.innerHTML = logDump;
            crashScreen.classList.remove('hidden');
            window.JARVIS.Logger.error('KERNEL', 'System halted due to fatal exception.', fatalReason);
        }
    },

    rebootSystem() {
        window.location.reload();
    }
};

document.getElementById('btn-reboot-system')?.addEventListener('click', window.JARVIS.Diagnostics.rebootSystem);

// ==========================================================================
// 6. GLOBAL ERROR TRAP
// Catches errors that happen outside any try/catch block (a typo in an
// event handler, a null reference in a click callback, etc). Previously
// these just failed silently in the console with no record in Diagnostics
// and no user-facing signal at all.
// ==========================================================================
window.addEventListener('error', (e) => {
    window.JARVIS.Logger.error('GLOBAL', e.message || 'Uncaught exception', e.error || e);
});
window.addEventListener('unhandledrejection', (e) => {
    window.JARVIS.Logger.error('PROMISE', 'Unhandled promise rejection', e.reason);
});

// ==========================================================================
// 7. SYSTEM GUARDS (Mobile Gesture Lockdown)
// The viewport meta tag's user-scalable=no is ignored by many Android
// browsers for accessibility reasons, so pinch-zoom must be blocked in JS
// as well. Also blocks the double-tap-to-zoom gesture.
// ==========================================================================
(function systemGuards() {
    document.addEventListener('touchmove', (e) => {
        if (e.touches.length > 1) e.preventDefault();
    }, { passive: false });

    document.addEventListener('gesturestart', (e) => e.preventDefault());
    document.addEventListener('gesturechange', (e) => e.preventDefault());

    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) e.preventDefault();
        lastTouchEnd = now;
    }, { passive: false });
})();

// ==========================================================================
// 8. NOTIFICATION ENGINE (Toasts)
// ==========================================================================
window.JARVIS.Notifications = {
    show(title, message, type = 'info', duration = 4000) {
        const container = document.getElementById('notification-center');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast-notification ${type}`;
        toast.innerHTML = `
            <div class="toast-title">${title}</div>
            <div class="toast-msg">${message}</div>
        `;

        container.appendChild(toast);

        if (window.AudioFX) window.AudioFX.playBeep(type === 'error' ? 300 : 800, 'sine', 0.1);

        setTimeout(() => {
            toast.style.animation = 'slideInRight 0.4s reverse forwards';
            setTimeout(() => toast.remove(), 400);
        }, duration);
    }
};

// ==========================================================================
// 9. API FETCH ENGINE (With Retries & Timeout)
// ==========================================================================
window.JARVIS.API = {

    async fetchWithTimeout(endpoint, options = {}) {
        const { timeout = window.JARVIS.Config.TIMEOUT_MS } = options;

        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(`${window.JARVIS.Config.API_URL}${endpoint}`, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(id);
            return response;
        } catch (error) {
            clearTimeout(id);
            throw error;
        }
    },

    async request(endpoint, method = 'GET', data = null, retries = window.JARVIS.Config.MAX_RETRIES) {
        window.JARVIS.Logger.log('API', `Requesting ${endpoint}...`);

        for (let i = 0; i < retries; i++) {
            try {
                const options = { method, headers: { 'Content-Type': 'application/json' } };
                if (data) options.body = JSON.stringify(data);

                const response = await this.fetchWithTimeout(endpoint, options);

                if (!response.ok) throw new Error(`HTTP ${response.status}`);

                const json = await response.json();
                const indicator = document.getElementById('network-indicator');
                if (indicator) indicator.style.color = 'var(--matrix-green)';
                return json;

            } catch (error) {
                window.JARVIS.Logger.warn('API', `Attempt ${i + 1} failed for ${endpoint}: ${error.message}`);
                if (i === retries - 1) {
                    const indicator = document.getElementById('network-indicator');
                    if (indicator) indicator.style.color = 'var(--crimson-core)';

                    if (window.JARVIS.Config.SIMULATION_MODE) {
                        window.JARVIS.Logger.warn('API', `Switching to Simulation Mock Data for ${endpoint}`);
                        return window.JARVIS.MockDB.routeMock(endpoint);
                    }
                    throw error;
                }
                await new Promise(res => setTimeout(res, 1000 * (i + 1)));
            }
        }
    }
};

// ==========================================================================
// 10. CORE OS FUNCTIONS (Booting & Loading)
// ==========================================================================
window.JARVIS.Core = {

    async bootSequence() {
        window.JARVIS.Logger.log('BOOT', 'Initiating Boot Sequence...');

        try {
            await window.JARVIS.API.request('/health/ping');
            document.getElementById('boot-log-2')?.classList.remove('hidden');

            const desktopData = await window.JARVIS.API.request('/desktop/apps');
            if (desktopData && desktopData.apps) {
                desktopData.apps.forEach(app => window.JARVIS.State.registerApp(app));
            }
            document.getElementById('boot-log-3')?.classList.remove('hidden');

            const widgetData = await window.JARVIS.API.request('/desktop/widgets');
            if (widgetData && widgetData.widgets) {
                window.JARVIS.Logger.log('WIDGETS', 'Loaded widget manifests.', widgetData);
            }
            document.getElementById('boot-log-4')?.classList.remove('hidden');

            this.renderDesktop();
            document.getElementById('boot-log-5')?.classList.remove('hidden');

            setTimeout(() => {
                document.getElementById('boot-screen')?.classList.add('hide-boot');
                window.JARVIS.State.isBooting = false;
                window.JARVIS.Notifications.show('System Online', 'API Backend Connected Successfully.', 'success');
                window.JARVIS.Voice?.greet();
            }, 1500);

        } catch (error) {
            window.JARVIS.Diagnostics.triggerKernelPanic("Failed to establish API Backend connection and Simulation Mode is disabled.");
        }
    },

    renderDesktop() {
        const desktopGrid = document.getElementById('desktop-icons');
        if (!desktopGrid) return;

        desktopGrid.innerHTML = '';

        window.JARVIS.State.installedApps.forEach(app => {
            if (app.showOnDesktop !== false) {
                const icon = document.createElement('div');
                icon.className = 'app-shortcut draggable-app';
                icon.dataset.appId = app.id;

                const borderStyle = app.borderColor ? `border-color: ${app.borderColor}; box-shadow: 0 0 15px ${app.borderColor}40;` : '';

                icon.innerHTML = `
                    <div class="app-icon-wrapper" style="${borderStyle}">${app.icon}</div>
                    <span class="app-name">${app.name}</span>
                `;

                icon.addEventListener('click', () => {
                    // Ignore the click that fires right after a drag-drop
                    if (icon.dataset.justDropped === 'true') return;
                    this.requestAppLaunch(app.id);
                });
                desktopGrid.appendChild(icon);
            }
        });
    },

    async requestAppLaunch(appId) {
        if (window.AudioFX) window.AudioFX.playBeep(900, "sine", 0.05);

        window.JARVIS.Logger.log('SYSTEM', `User requested launch for: ${appId}`);

        if (!window.JARVIS.WindowManager) {
            window.JARVIS.Logger.warn('SYSTEM', 'Window Manager is not loaded yet.');
            window.JARVIS.Notifications.show('Not Ready', 'System still starting up — try again in a second.', 'error');
            return;
        }

        if (window.JARVIS.State.activeWindows.has(appId)) {
            window.JARVIS.WindowManager.restoreWindow(appId);
            return;
        }

        try {
            const appPayload = await window.JARVIS.API.request(`/app/${appId}/launch`);

            if (appPayload && appPayload.status === 'success') {
                window.JARVIS.WindowManager.createWindow(appPayload.data);
            } else {
                throw new Error("Invalid payload received from Backend.");
            }
        } catch (error) {
            window.JARVIS.Logger.error('SYSTEM', `Launch failed for ${appId}`, error);
            window.JARVIS.Notifications.show('Launch Failed', `Could not fetch ${appId} from server.`, 'error');
        }
    }
};

// ==========================================================================
// 11. SIMULATION MOCK DATABASE
// Stand-in for your Python backend. Every app you add — game, system tool,
// widget — should describe itself the same way these do: an id, a
// name/icon for the launcher, and a launch payload with the window's UI.
// That's the API contract; swap SIMULATION_MODE to false once Python
// actually serves these same shapes and nothing else in the OS has to change.
// ==========================================================================
window.JARVIS.MockDB = {
    routeMock(endpoint) {
        if (endpoint.includes('/health/ping')) return { status: 'success' };
        if (endpoint.includes('/desktop/apps')) return this.getMockApps();
        if (endpoint.includes('/desktop/widgets')) return { widgets: [] };
        if (endpoint.includes('/launch')) {
            const appId = endpoint.split('/')[2];
            return this.getMockAppPayload(appId);
        }
        throw new Error("404 Mock Route Not Found");
    },

    getMockApps() {
        return {
            status: "success",
            apps: [
                { id: "terminal", name: "Terminal", icon: "⚡", category: "system" },
                { id: "files", name: "Files", icon: "📁", category: "system", borderColor: "var(--gold-core)" },
                { id: "myjarvis", name: "My JARVIS", icon: "🧠", category: "system", borderColor: "var(--cyan-core)" },
                { id: "gallery", name: "Gallery", icon: "🖼️", category: "media" },
                { id: "camera", name: "Camera", icon: "📷", category: "media" },
                { id: "appstore", name: "App Store", icon: "🛒", category: "system", borderColor: "#ff00ff" },
                { id: "drift", name: "Supra Drift", icon: "🏎️", category: "games" },
                { id: "settings", name: "Settings", icon: "⚙️", category: "system" }
            ]
        };
    },

    getMockAppPayload(appId) {
        const db = {
            "settings": {
                id: "settings", name: "Settings", width: 400, height: 500,
                ui: `
                    <div class="app-settings">
                        <div class="settings-header">SYSTEM CONFIG</div>
                        <div class="settings-group">
                            <div class="settings-group-title">API Connections</div>
                            <div class="setting-row">
                                <div class="setting-label">Simulation Mode</div>
                                <label class="toggle-switch"><input type="checkbox" checked disabled><span class="toggle-slider"></span></label>
                            </div>
                            <div class="setting-row" style="margin-top:10px;">
                                <div class="setting-label" style="font-size:11px; color:var(--text-muted);">Python Server Offline. Using Mock DB.</div>
                            </div>
                        </div>
                    </div>
                `
            },
            "appstore": {
                id: "appstore", name: "App Store", width: 700, height: 550,
                ui: `
                    <div class="app-store">
                        <div class="store-hero">
                            <h1>MARK-8 REPOSITORY</h1>
                        </div>
                        <div class="store-grid">
                            <div class="store-card">
                                <div class="store-card-icon">🐍</div>
                                <div class="store-card-info">
                                    <div class="store-card-title">Python IDE</div>
                                    <div class="store-card-desc">Code directly in the OS.</div>
                                    <button class="btn-install" onclick="JARVIS.Notifications.show('Install','Connecting to server...','info')">INSTALL</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `
            },
            "terminal": {
                id: "terminal", name: "Terminal", width: 500, height: 400,
                ui: `
                    <div class="app-terminal">
                        <div class="term-output" id="term-log">
                            <div>J.A.R.V.I.S. Core Terminal Online.</div>
                            <div>Awaiting Python Backend Connection...</div>
                        </div>
                        <div class="term-input-line">
                            <span>></span><input type="text" class="term-input" disabled placeholder="Terminal Locked (API Offline)">
                        </div>
                    </div>
                `
            }
        };

        if (db[appId]) return { status: 'success', data: db[appId] };

        return {
            status: 'success',
            data: {
                id: appId, name: appId.toUpperCase(), width: 350, height: 300,
                ui: `<div style="padding:20px; text-align:center; color:var(--cyan-core); font-family:var(--font-mono);">
                        <h3>[ APP DATA PENDING ]</h3>
                        <p style="margin-top:15px; color:var(--text-muted); font-size:12px;">This application requires the Python Backend to compile.</p>
                     </div>`
            }
        };
    }
};

// ==========================================================================
// 12. SYSTEM IGNITION (Wait for DOM, then Boot)
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    if (window.JARVIS && window.JARVIS.Core) {
        setTimeout(() => window.JARVIS.Core.bootSequence(), 500);
    }
});
