/* ==========================================================================
   J.A.R.V.I.S. OS - WINDOW MANAGER ENGINE (v8.6 - STABILITY PATCH)
   CHANGES FROM v8.5:
   - Drag bounds now clamp on all four sides. The old code only checked
     `if (newTop < 0) newTop = 0` — nothing stopped a window from being
     dragged off the left, right, or bottom edge entirely.
   - closeWindow() referenced a CSS animation ("windowOpen 0.2s reverse")
     that didn't exist anywhere in the stylesheet, so windows never
     actually animated out. Now uses the real .closing class / windowClose
     keyframe defined in os-theme.css.
   - createDockIcon's click handler no longer assumes the window element
     still exists (guards against a stale dock icon after a crash/close).
   ========================================================================== */

"use strict";

window.JARVIS = window.JARVIS || {};

window.JARVIS.WindowManager = {

    // ==========================================================================
    // 1. CREATE & SPAWN WINDOW
    // ==========================================================================
    createWindow(appData) {
        if (!appData || !appData.id) return;

        if (window.JARVIS.State.activeWindows.has(appData.id)) {
            this.restoreWindow(appData.id);
            return;
        }

        window.JARVIS.Logger.log('WINDOW', `Spawning interface for ${appData.name}`);

        const appWindow = document.createElement("div");
        appWindow.className = "glass-window active-window";
        appWindow.id = `window-${appData.id}`;

        const width = appData.width || 360;
        const height = appData.height || 480;
        appWindow.style.width = `${width}px`;
        appWindow.style.height = `${height}px`;

        window.JARVIS.State.highestZIndex++;
        appWindow.style.zIndex = window.JARVIS.State.highestZIndex;

        appWindow.innerHTML = `
            <div class="window-header" id="header-${appData.id}">
                <span class="window-title">${appData.name}</span>
                <div class="window-controls">
                    <button class="win-btn btn-min" data-action="minimize" title="Minimize"></button>
                    <button class="win-btn btn-max" data-action="maximize" title="Maximize"></button>
                    <button class="win-btn btn-close" data-action="close" title="Close"></button>
                </div>
            </div>
            <div class="window-content" id="content-${appData.id}">
                ${appData.ui || '<div style="padding:20px;">No UI Data Provided.</div>'}
            </div>
        `;

        document.getElementById("desktop-workspace").appendChild(appWindow);
        window.JARVIS.State.activeWindows.set(appData.id, appWindow);

        this.setupWindowControls(appWindow, appData.id);
        this.makeDraggable(appWindow, document.getElementById(`header-${appData.id}`));
        this.createDockIcon(appData);

        appWindow.addEventListener("pointerdown", () => this.focusWindow(appData.id));
    },

    // ==========================================================================
    // 2. WINDOW CONTROLS (Close, Maximize, Minimize)
    // ==========================================================================
    setupWindowControls(appWindow, appId) {
        const controls = appWindow.querySelector('.window-controls');

        controls.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
        });

        controls.addEventListener('click', (e) => {
            if (e.target.dataset.action === 'close') this.closeWindow(appId);
            if (e.target.dataset.action === 'maximize') this.toggleMaximize(appId);
            if (e.target.dataset.action === 'minimize') this.minimizeWindow(appId);
        });
    },

    closeWindow(appId) {
        if (window.AudioFX) window.AudioFX.playBeep(400, "square", 0.08);

        const appWindow = window.JARVIS.State.activeWindows.get(appId);
        const dockIcon = document.getElementById(`dock-${appId}`);

        if (appWindow) {
            appWindow.classList.add("closing");
            setTimeout(() => appWindow.remove(), 200);
        }
        if (dockIcon) dockIcon.remove();

        window.JARVIS.State.activeWindows.delete(appId);
        window.JARVIS.Logger.log('WINDOW', `Terminated ${appId}`);
    },

    toggleMaximize(appId) {
        if (window.AudioFX) window.AudioFX.playBeep(700, "triangle", 0.05);
        const appWindow = window.JARVIS.State.activeWindows.get(appId);
        if (appWindow) {
            appWindow.classList.toggle("maximized");
            this.focusWindow(appId);
        }
    },

    minimizeWindow(appId) {
        if (window.AudioFX) window.AudioFX.playBeep(600, "sine", 0.05);
        const appWindow = window.JARVIS.State.activeWindows.get(appId);
        if (appWindow) {
            appWindow.style.display = "none";
            const dockIcon = document.getElementById(`dock-${appId}`);
            if (dockIcon) dockIcon.classList.remove('active');
        }
    },

    restoreWindow(appId) {
        if (window.AudioFX) window.AudioFX.playBeep(850, "sine", 0.05);
        const appWindow = window.JARVIS.State.activeWindows.get(appId);
        if (appWindow) {
            appWindow.style.display = "flex";
            this.focusWindow(appId);
            const dockIcon = document.getElementById(`dock-${appId}`);
            if (dockIcon) dockIcon.classList.add('active');
        }
    },

    focusWindow(appId) {
        const appWindow = window.JARVIS.State.activeWindows.get(appId);
        if (appWindow && appWindow.style.zIndex != window.JARVIS.State.highestZIndex) {
            window.JARVIS.State.highestZIndex++;
            appWindow.style.zIndex = window.JARVIS.State.highestZIndex;

            document.querySelectorAll('.glass-window').forEach(win => win.classList.remove('active-window'));
            appWindow.classList.add('active-window');
        }
    },

    // ==========================================================================
    // 3. UNIVERSAL DRAG ENGINE (Touch & Mouse Support)
    // ==========================================================================
    makeDraggable(appWindow, header) {
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        header.addEventListener("pointerdown", (e) => {
            if (e.target.closest(".window-controls") || appWindow.classList.contains("maximized")) return;

            isDragging = true;
            this.focusWindow(appWindow.id.replace('window-', ''));

            const rect = appWindow.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;
            startX = e.clientX;
            startY = e.clientY;

            header.setPointerCapture(e.pointerId);
            header.style.cursor = "grabbing";
        });

        header.addEventListener("pointermove", (e) => {
            if (!isDragging) return;

            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            let newLeft = initialLeft + deltaX;
            let newTop = initialTop + deltaY;

            // Full bounds clamp — keep at least a grabbable sliver of the
            // header on screen at all times, on every side, not just the top.
            const taskbarHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--taskbar-height')) || 56;
            const minVisible = 60; // px of the window that must stay reachable
            const viewportW = window.innerWidth;
            const viewportH = window.innerHeight;
            const winRect = appWindow.getBoundingClientRect();

            const minLeft = -(winRect.width - minVisible);
            const maxLeft = viewportW - minVisible;
            const minTop = 0;
            const maxTop = viewportH - taskbarHeight - 40; // keep header grabbable above taskbar

            if (newLeft < minLeft) newLeft = minLeft;
            if (newLeft > maxLeft) newLeft = maxLeft;
            if (newTop < minTop) newTop = minTop;
            if (newTop > maxTop) newTop = maxTop;

            appWindow.style.left = `${newLeft}px`;
            appWindow.style.top = `${newTop}px`;

            appWindow.style.right = 'auto';
            appWindow.style.bottom = 'auto';
        });

        const endDrag = (e) => {
            if (!isDragging) return;
            isDragging = false;
            header.releasePointerCapture(e.pointerId);
            header.style.cursor = "grab";
        };

        header.addEventListener("pointerup", endDrag);
        header.addEventListener("pointercancel", endDrag);
    },

    // ==========================================================================
    // 4. TASKBAR DOCK INTEGRATION
    // ==========================================================================
    createDockIcon(appData) {
        const dock = document.getElementById("dock-apps");
        if (!dock || document.getElementById(`dock-${appData.id}`)) return;

        const icon = document.createElement("div");
        icon.className = "dock-icon active";
        icon.id = `dock-${appData.id}`;
        icon.title = appData.name;

        const appState = window.JARVIS.State.getApp(appData.id);
        icon.innerHTML = appState ? appState.icon : "◈";

        icon.addEventListener("click", () => {
            const appWindow = window.JARVIS.State.activeWindows.get(appData.id);
            if (!appWindow) {
                // Window is gone (closed/crashed) but the dock icon lingered — clean it up.
                icon.remove();
                return;
            }
            if (appWindow.style.display === "none") {
                this.restoreWindow(appData.id);
            } else if (appWindow.classList.contains("active-window")) {
                this.minimizeWindow(appData.id);
            } else {
                this.focusWindow(appData.id);
            }
        });

        dock.appendChild(icon);
    }
};
