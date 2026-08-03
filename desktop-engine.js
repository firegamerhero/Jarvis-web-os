/* ==========================================================================
   J.A.R.V.I.S. OS - MASTER DESKTOP ENGINE (v8.6 - STABILITY PATCH)
   CHANGES FROM v8.5:
   - init() now also verifies #dynamic-folders-container exists before
     continuing (createFolder would previously throw a hard, silent
     TypeError if that element was ever missing from the DOM)
   - JSON.parse on folder contents wrapped in try/catch — a corrupted
     dataset attribute used to crash the drop handler entirely
   ========================================================================== */

"use strict";

window.JARVIS = window.JARVIS || {};

window.JARVIS.Desktop = {

    workspace: null,
    contextMenu: null,
    menuList: null,
    folderContainer: null,
    longPressTimer: null,
    activeTarget: null,

    gridSizeX: 95,
    gridSizeY: 110,

    init() {
        this.workspace = document.getElementById("desktop-workspace");
        this.contextMenu = document.getElementById("os-context-menu");
        this.menuList = document.getElementById("context-menu-list");
        this.folderContainer = document.getElementById("dynamic-folders-container");

        if (!this.workspace || !this.contextMenu || !this.folderContainer) {
            window.JARVIS.Logger?.error('DESKTOP', 'Critical DOM elements missing for Desktop Engine.');
            return;
        }

        this.setupContextMenu();
        this.bindGlobalEvents();

        window.JARVIS.Logger?.log('DESKTOP', 'Workspace Engine Online. Physics active.');
    },

    // ==========================================================================
    // 1. DYNAMIC CONTEXT MENU (Right-Click & Long-Press)
    // ==========================================================================
    setupContextMenu() {
        document.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            this.triggerMenu(e.clientX, e.clientY, e.target);
        });

        document.addEventListener("pointerdown", (e) => {
            if (!e.target.closest("#os-context-menu")) {
                this.hideMenu();
            }

            if (e.button !== 0) return;

            this.longPressTimer = setTimeout(() => {
                if (window.AudioFX) window.AudioFX.playBeep(400, "square", 0.05);
                this.triggerMenu(e.clientX, e.clientY, e.target);
            }, 600);
        });

        document.addEventListener("pointermove", () => clearTimeout(this.longPressTimer));
        document.addEventListener("pointerup", () => clearTimeout(this.longPressTimer));
        document.addEventListener("pointercancel", () => clearTimeout(this.longPressTimer));
    },

    triggerMenu(x, y, target) {
        const appIcon = target.closest(".app-shortcut");
        const folder = target.closest(".folder-drop-target");

        this.activeTarget = appIcon || folder || null;

        let menuHTML = '';

        if (this.activeTarget && this.activeTarget.classList.contains('folder-drop-target')) {
            menuHTML = `
                <li class="context-item" data-action="open-folder"><span class="context-icon">📂</span> Open Folder</li>
                <li class="context-item" data-action="rename-folder"><span class="context-icon">✏️</span> Rename Folder</li>
                <div class="context-divider"></div>
                <li class="context-item" data-action="delete-folder" style="color: var(--crimson-core);"><span class="context-icon">🗑️</span> Delete Folder</li>
            `;
        }
        else if (this.activeTarget) {
            menuHTML = `
                <li class="context-item" data-action="open-app"><span class="context-icon">🚀</span> Launch Application</li>
                <li class="context-item" data-action="clone-app"><span class="context-icon">👥</span> Clone App Instance</li>
                <div class="context-divider"></div>
                <li class="context-item" data-action="uninstall-app" style="color: var(--crimson-core);"><span class="context-icon">⚠️</span> Uninstall / Remove</li>
            `;
        }
        else {
            menuHTML = `
                <li class="context-item" data-action="new-folder"><span class="context-icon">📁</span> Create New Folder</li>
                <li class="context-item" data-action="add-widget"><span class="context-icon">🧩</span> Add Desktop Widget</li>
                <div class="context-divider"></div>
                <li class="context-item" data-action="change-theme"><span class="context-icon">🎨</span> Cycle Neon Matrix</li>
                <li class="context-item" data-action="refresh-os"><span class="context-icon">🔄</span> Reload API Workspace</li>
            `;
        }

        this.menuList.innerHTML = menuHTML;

        this.contextMenu.classList.remove("hidden");
        const menuWidth = this.contextMenu.offsetWidth || 240;
        const menuHeight = this.contextMenu.offsetHeight || 200;

        let posX = x;
        let posY = y;

        if (x + menuWidth > window.innerWidth) posX = window.innerWidth - menuWidth - 10;
        if (y + menuHeight > window.innerHeight) posY = window.innerHeight - menuHeight - 10;

        this.contextMenu.style.left = `${posX}px`;
        this.contextMenu.style.top = `${posY}px`;

        this.bindMenuActions();
    },

    hideMenu() {
        if (this.contextMenu) {
            this.contextMenu.classList.add("hidden");
        }
    },

    // ==========================================================================
    // 2. CONTEXT MENU ACTIONS CONTROLLER
    // ==========================================================================
    bindMenuActions() {
        const items = this.menuList.querySelectorAll('.context-item');

        items.forEach(item => {
            item.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.hideMenu();
                this.executeAction(action);
            });
        });
    },

    executeAction(action) {
        if (window.AudioFX) window.AudioFX.playBeep(1000, "sine", 0.05);

        try {
            switch(action) {
                case 'new-folder':
                    this.createFolder();
                    break;
                case 'refresh-os':
                    window.JARVIS.Notifications?.show('System', 'Reloading Workspace API...', 'info');
                    setTimeout(() => window.location.reload(), 1000);
                    break;
                case 'clone-app':
                    this.cloneTargetApp();
                    break;
                case 'change-theme':
                    this.cycleThemeColor();
                    break;
                case 'uninstall-app':
                    if (this.activeTarget) {
                        this.activeTarget.style.transform = "scale(0)";
                        setTimeout(() => this.activeTarget.remove(), 300);
                        window.JARVIS.Notifications?.show('Removed', 'Application instance deleted.', 'success');
                    }
                    break;
                case 'open-app':
                    if (this.activeTarget) this.activeTarget.click();
                    break;
                default:
                    window.JARVIS.Logger?.warn('DESKTOP', `Unhandled action: ${action}`);
            }
        } catch (error) {
            window.JARVIS.Logger?.error('DESKTOP', `Action failed: ${action}`, error);
        }
    },

    // ==========================================================================
    // 3. FOLDER CREATION & CLONING LOGIC
    // ==========================================================================
    createFolder(name = "New Folder", initialContents = []) {
        const folderId = `folder-${Date.now()}`;
        const folder = document.createElement("div");
        folder.className = "app-shortcut draggable-app folder-drop-target";
        folder.id = folderId;

        folder.dataset.contents = JSON.stringify(initialContents);

        folder.innerHTML = `
            <div class="app-icon-wrapper" style="border-color: var(--gold-core); box-shadow: var(--gold-glow); background: rgba(255,204,0,0.1);">
                <div class="folder-icon-grid">
                    <!-- Mini icons will populate here -->
                </div>
            </div>
            <span class="app-name">${name}</span>
        `;

        this.folderContainer.appendChild(folder);
        this.makeDraggable(folder);

        folder.addEventListener('click', (e) => {
            if (folder.dataset.justDropped === "true") return;

            window.JARVIS.WindowManager?.createWindow({
                id: folderId,
                name: name,
                width: 450,
                height: 350,
                ui: `<div style="padding:20px; color:var(--text-muted); text-align:center;">
                        <br><br><span style="font-size:40px;">📁</span><br><br>
                        Folder directory interface loading...<br>API connection required to read contents.
                     </div>`
            });
        });

        window.JARVIS.Notifications?.show('System', 'New Folder Allocated.', 'success');
    },

    cloneTargetApp() {
        if (!this.activeTarget) return;

        const clone = this.activeTarget.cloneNode(true);
        const originalId = clone.dataset.appId || clone.id;

        clone.id = `${originalId}-clone-${Math.floor(Math.random() * 1000)}`;
        clone.dataset.appId = originalId;

        const nameNode = clone.querySelector(".app-name");
        if (nameNode) nameNode.innerText = `${nameNode.innerText} (Copy)`;

        clone.style.position = 'relative';
        clone.style.left = 'auto';
        clone.style.top = 'auto';

        document.getElementById("desktop-icons").appendChild(clone);

        this.makeDraggable(clone);
        clone.addEventListener("click", (e) => {
            if (clone.dataset.justDropped !== "true") {
                window.JARVIS.Core?.requestAppLaunch(originalId);
            }
        });

        window.JARVIS.Notifications?.show('System', 'Application instance cloned.', 'success');
    },

    cycleThemeColor() {
        const colors = [
            { core: '#00f3ff', dim: 'rgba(0,243,255,0.4)' },
            { core: '#ff00ff', dim: 'rgba(255,0,255,0.4)' },
            { core: '#00ff66', dim: 'rgba(0,255,102,0.4)' },
            { core: '#ff3b30', dim: 'rgba(255,59,48,0.4)' }
        ];

        let currentIndex = parseInt(document.body.dataset.themeIndex || '0');
        currentIndex = (currentIndex + 1) % colors.length;
        document.body.dataset.themeIndex = currentIndex;

        const nextColor = colors[currentIndex];
        document.documentElement.style.setProperty('--cyan-core', nextColor.core);
        document.documentElement.style.setProperty('--cyan-dim', nextColor.dim);
        document.documentElement.style.setProperty('--cyan-glow', `0 0 15px ${nextColor.dim}`);

        window.JARVIS.Notifications?.show('UI Matrix', 'Theme color cycled.', 'info');
    },

    // ==========================================================================
    // 4. DESKTOP ICON PHYSICS (Drag & Drop)
    // ==========================================================================
    bindGlobalEvents() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1 && node.classList.contains('draggable-app')) {
                        this.makeDraggable(node);
                    }
                });
            });
        });

        const desktopIcons = document.getElementById('desktop-icons');
        if (desktopIcons) {
            observer.observe(desktopIcons, { childList: true });
        }
    },

    makeDraggable(element) {
        let isDragging = false;
        let startX, startY, initialX, initialY;
        let hasMoved = false;

        element.addEventListener("pointerdown", (e) => {
            if (e.button !== 0 || e.target.closest('button')) return;

            isDragging = true;
            hasMoved = false;

            const rect = element.getBoundingClientRect();

            if (element.style.position !== "absolute") {
                element.style.position = "absolute";
                element.style.left = `${rect.left}px`;
                element.style.top = `${rect.top}px`;
                this.workspace.appendChild(element);
            }

            startX = e.clientX;
            startY = e.clientY;
            initialX = element.offsetLeft;
            initialY = element.offsetTop;

            element.setPointerCapture(e.pointerId);
            element.classList.add("app-dragging");

            if (window.AudioFX) window.AudioFX.playBeep(600, "sine", 0.02, 0.01);
        });

        element.addEventListener("pointermove", (e) => {
            if (!isDragging) return;

            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                hasMoved = true;
            }

            element.style.left = `${initialX + dx}px`;
            element.style.top = `${initialY + dy}px`;
        });

        element.addEventListener("pointerup", (e) => {
            if (!isDragging) return;
            isDragging = false;

            element.releasePointerCapture(e.pointerId);
            element.classList.remove("app-dragging");

            if (hasMoved) {
                element.dataset.justDropped = "true";
                setTimeout(() => { element.dataset.justDropped = "false"; }, 150);

                if (window.AudioFX) window.AudioFX.playBeep(400, "sine", 0.02, 0.01);

                this.handleDropCollision(element, e.clientX, e.clientY);
            }
        });
    },

    handleDropCollision(draggedElement, mouseX, mouseY) {
        draggedElement.style.visibility = 'hidden';
        const elementBelow = document.elementFromPoint(mouseX, mouseY);
        draggedElement.style.visibility = 'visible';

        if (elementBelow) {
            const dropFolder = elementBelow.closest('.folder-drop-target');

            if (dropFolder && dropFolder !== draggedElement) {
                if (window.AudioFX) window.AudioFX.playBeep(1100, "triangle", 0.1);

                const folderRect = dropFolder.getBoundingClientRect();
                draggedElement.style.transition = "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
                draggedElement.style.left = `${folderRect.left + (folderRect.width/2) - (draggedElement.offsetWidth/2)}px`;
                draggedElement.style.top = `${folderRect.top + (folderRect.height/2) - (draggedElement.offsetHeight/2)}px`;
                draggedElement.style.transform = "scale(0.1) rotate(180deg)";
                draggedElement.style.opacity = "0";

                setTimeout(() => {
                    const appName = draggedElement.querySelector('.app-name')?.innerText || "App";

                    let contents = [];
                    try {
                        contents = JSON.parse(dropFolder.dataset.contents || "[]");
                    } catch (err) {
                        window.JARVIS.Logger?.warn('DESKTOP', 'Corrupted folder contents, resetting.', err);
                        contents = [];
                    }
                    contents.push(appName);
                    dropFolder.dataset.contents = JSON.stringify(contents);

                    const nameEl = dropFolder.querySelector(".app-name");
                    if (nameEl) nameEl.innerText = `Folder (${contents.length})`;

                    const miniGrid = dropFolder.querySelector('.folder-icon-grid');
                    if (miniGrid && contents.length <= 4) {
                        const miniIcon = document.createElement('div');
                        miniIcon.className = 'folder-mini-icon';
                        miniIcon.innerText = draggedElement.querySelector('.app-icon-wrapper')?.innerText.substring(0, 1) || "📦";
                        miniGrid.appendChild(miniIcon);
                    }

                    draggedElement.remove();
                }, 300);

                return;
            }
        }

        let currentLeft = parseInt(draggedElement.style.left);
        let currentTop = parseInt(draggedElement.style.top);

        draggedElement.style.transition = "left 0.2s, top 0.2s";
        draggedElement.style.left = `${Math.round(currentLeft / 10) * 10}px`;
        draggedElement.style.top = `${Math.round(currentTop / 10) * 10}px`;

        setTimeout(() => { draggedElement.style.transition = "transform 0.2s"; }, 250);
    }
};

// ==========================================================================
// 5. INITIALIZE DESKTOP ENGINE ON LOAD
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    if (window.JARVIS) {
        setTimeout(() => window.JARVIS.Desktop.init(), 600);
    }
});
