/* =========================================================
   JARVIS WebOS - Window Manager (PC & Android Compatible)
   ========================================================= */

let topZIndex = 100;
const openWindows = new Map();

const AppRegistry = {};

function registerApp(appId, launchFn) {
    AppRegistry[appId] = launchFn;
}

function openWindow(appId) {
    if (openWindows.has(appId)) {
        const existingWin = openWindows.get(appId);
        if (existingWin.style.display === "none") {
            existingWin.style.display = "flex";
        }
        bringToFront(existingWin);
        return;
    }

    if (!AppRegistry[appId]) {
        console.warn(`App "${appId}" is not registered yet.`);
        return;
    }

    const appData = AppRegistry[appId]();
    const win = createWindow(appId, appData);
    openWindows.set(appId, win);
    bringToFront(win);

    if (typeof appData.onInit === "function") {
        appData.onInit(win);
    }
}

function createWindow(appId, { title = "Application", icon = "fa-window-maximize", content = "", width = 480, height = 360 }) {
    const desktop = document.getElementById("desktop");

    const isMobile = window.innerWidth <= 768;
    const targetWidth = isMobile ? Math.min(width, window.innerWidth - 20) : Math.min(width, window.innerWidth - 40);
    const targetHeight = isMobile ? Math.min(height, window.innerHeight - 120) : Math.min(height, window.innerHeight - 100);

    const win = document.createElement("div");
    win.className = "os-window";
    win.id = `win-${appId}`;
    win.style.width = `${targetWidth}px`;
    win.style.height = `${targetHeight}px`;

    const offset = (openWindows.size * 25) % 120;
    const initialLeft = isMobile ? 10 : Math.max(20, Math.min(60 + offset, window.innerWidth - targetWidth - 20));
    const initialTop = isMobile ? 20 : Math.max(20, Math.min(60 + offset, window.innerHeight - targetHeight - 80));
    win.style.left = `${initialLeft}px`;
    win.style.top = `${initialTop}px`;

    win.innerHTML = `
        <div class="window-header">
            <div class="window-title">
                <i class="fa-solid ${icon}"></i>
                <span>${title}</span>
            </div>
            <div class="window-controls">
                <button class="win-btn btn-min" title="Minimize"></button>
                <button class="win-btn btn-max" title="Maximize"></button>
                <button class="win-btn btn-close" title="Close"></button>
            </div>
        </div>
        <div class="window-body">
            ${content}
        </div>
    `;

    desktop.appendChild(win);
    createDockItem(appId, icon, title, win);
    setupWindowInteractions(win, appId);

    return win;
}

function setupWindowInteractions(win, appId) {
    const header = win.querySelector(".window-header");
    const minBtn = win.querySelector(".btn-min");
    const maxBtn = win.querySelector(".btn-max");
    const closeBtn = win.querySelector(".btn-close");

    win.addEventListener("mousedown", () => bringToFront(win));
    win.addEventListener("touchstart", () => bringToFront(win), { passive: true });

    if (minBtn) {
        minBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            win.style.display = "none";
            updateDockActiveState();
        });
    }

    let isMaximized = false;
    let preMaxStyles = {};

    if (maxBtn) {
        maxBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            if (!isMaximized) {
                preMaxStyles = {
                    top: win.style.top,
                    left: win.style.left,
                    width: win.style.width,
                    height: win.style.height,
                    borderRadius: win.style.borderRadius
                };
                win.style.top = "0px";
                win.style.left = "0px";
                win.style.width = "100vw";
                win.style.height = "calc(100vh - 60px)";
                win.style.borderRadius = "0px";
                isMaximized = true;
            } else {
                win.style.top = preMaxStyles.top;
                win.style.left = preMaxStyles.left;
                win.style.width = preMaxStyles.width;
                win.style.height = preMaxStyles.height;
                win.style.borderRadius = preMaxStyles.borderRadius || "12px";
                isMaximized = false;
            }
            bringToFront(win);
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            closeWindow(appId);
        });
    }

    // Drag-and-Drop Implementation
    if (header) {
        let isDragging = false;
        let startX = 0, startY = 0, initialWinX = 0, initialWinY = 0;

        const startDrag = (e) => {
            if (e.target.closest(".window-controls") || isMaximized) return;
            isDragging = true;
            
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            
            startX = clientX;
            startY = clientY;
            initialWinX = win.offsetLeft;
            initialWinY = win.offsetTop;
            bringToFront(win);
        };

        const onDragMove = (e) => {
            if (!isDragging) return;
            
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            const dx = clientX - startX;
            const dy = clientY - startY;

            const maxLeft = window.innerWidth - win.offsetWidth;
            const maxTop = window.innerHeight - win.offsetHeight - 60;

            win.style.left = `${Math.max(0, Math.min(initialWinX + dx, maxLeft))}px`;
            win.style.top = `${Math.max(0, Math.min(initialWinY + dy, maxTop))}px`;
        };

        const stopDrag = () => {
            isDragging = false;
        };

        header.addEventListener("mousedown", startDrag);
        document.addEventListener("mousemove", onDragMove);
        document.addEventListener("mouseup", stopDrag);

        header.addEventListener("touchstart", startDrag, { passive: true });
        document.addEventListener("touchmove", onDragMove, { passive: true });
        document.addEventListener("touchend", stopDrag);
    }
}

function closeWindow(appId) {
    if (!openWindows.has(appId)) return;
    const win = openWindows.get(appId);
    win.remove();
    openWindows.delete(appId);

    const dockIcon = document.getElementById(`dock-${appId}`);
    if (dockIcon) dockIcon.remove();
}

function bringToFront(win) {
    topZIndex++;
    win.style.zIndex = topZIndex;

    document.querySelectorAll(".os-window").forEach(w => w.classList.remove("active-window"));
    win.classList.add("active-window");
    updateDockActiveState();
}

function createDockItem(appId, icon, title, win) {
    const dockContainer = document.getElementById("open-apps-dock");
    if (!dockContainer) return;

    const dockItem = document.createElement("div");
    dockItem.className = "dock-icon";
    dockItem.id = `dock-${appId}`;
    dockItem.title = title;
    dockItem.innerHTML = `<i class="fa-solid ${icon}"></i>`;

    const toggleApp = () => {
        if (win.style.display === "none") {
            win.style.display = "flex";
            bringToFront(win);
        } else if (win.classList.contains("active-window")) {
            win.style.display = "none";
            updateDockActiveState();
        } else {
            bringToFront(win);
        }
    };

    dockItem.addEventListener("click", toggleApp);
    dockContainer.appendChild(dockItem);
}

function updateDockActiveState() {
    document.querySelectorAll(".dock-icon").forEach(icon => {
        const appId = icon.id.replace("dock-", "");
        const win = openWindows.get(appId);
        if (win && win.style.display !== "none" && win.classList.contains("active-window")) {
            icon.style.borderColor = "var(--primary-color)";
            icon.style.boxShadow = "var(--glow-shadow)";
        } else {
            icon.style.borderColor = "transparent";
            icon.style.boxShadow = "none";
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".desktop-icon").forEach(icon => {
        icon.addEventListener("click", () => {
            const appId = icon.getAttribute("data-app");
            if (appId) openWindow(appId);
        });
    });
});
