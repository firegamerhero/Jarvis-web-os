/* =========================================
   JARVIS WebOS - File Manager
   ========================================= */

registerApp("filemgr", () => {
    return {
        title: "System Explorer",
        icon: "fa-folder-tree",
        width: 650,
        height: 450,
        content: `
            <div style="display: flex; height: 100%; gap: 10px;">
                
                <!-- Sidebar -->
                <div style="width: 180px; display: flex; flex-direction: column; gap: 10px; border-right: 1px solid var(--primary-dim); padding-right: 10px;">
                    <div style="color: var(--primary-color); font-size: 0.8rem; font-family: monospace; letter-spacing: 1px;">DIRECTORIES</div>
                    
                    <button class="fm-nav-btn active" data-path="documents">
                        <i class="fa-solid fa-folder-open"></i> Documents
                    </button>
                    <button class="fm-nav-btn" data-path="system">
                        <i class="fa-solid fa-server"></i> Core System
                    </button>
                    <button class="fm-nav-btn" data-path="archives">
                        <i class="fa-solid fa-box-archive"></i> Archives
                    </button>
                    
                    <div style="margin-top: auto; padding: 10px; background: rgba(0,0,0,0.5); border-radius: 6px; border: 1px solid var(--glass-border); font-size: 0.75rem; color: var(--text-muted); text-align: center;">
                        <div><i class="fa-solid fa-hard-drive"></i> STORAGE</div>
                        <div style="color: var(--primary-color); margin-top: 5px;">NOMINAL</div>
                    </div>
                </div>

                <!-- Main File Area -->
                <div style="flex: 1; display: flex; flex-direction: column;">
                    
                    <!-- Path Bar -->
                    <div style="display: flex; align-items: center; background: rgba(0,0,0,0.4); border: 1px solid var(--glass-border); border-radius: 6px; padding: 8px 12px; margin-bottom: 10px; font-family: monospace; font-size: 0.9rem;">
                        <i class="fa-solid fa-terminal" style="color: var(--primary-color); margin-right: 10px;"></i>
                        <span id="fm-path-text" style="color: var(--text-main);">C:\\JARVIS\\Documents</span>
                    </div>

                    <!-- File Grid -->
                    <div id="fm-grid" style="flex: 1; overflow-y: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 15px; align-content: flex-start;">
                        <!-- Files will be injected here -->
                    </div>
                    
                </div>
            </div>

            <style>
                .fm-nav-btn {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    width: 100%;
                    padding: 10px;
                    background: transparent;
                    border: 1px solid transparent;
                    color: var(--text-muted);
                    border-radius: 6px;
                    cursor: pointer;
                    text-align: left;
                    transition: 0.2s;
                }
                .fm-nav-btn:hover {
                    background: rgba(255,255,255,0.05);
                    color: var(--text-main);
                }
                .fm-nav-btn.active {
                    background: var(--primary-dim);
                    border-color: var(--primary-color);
                    color: var(--primary-color);
                    box-shadow: inset 0 0 10px rgba(0, 240, 255, 0.1);
                }
                .fm-file-card {
                    background: rgba(0,0,0,0.4);
                    border: 1px solid var(--glass-border);
                    border-radius: 8px;
                    padding: 15px 10px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    cursor: pointer;
                    transition: 0.2s;
                    position: relative;
                }
                .fm-file-card:hover {
                    background: var(--primary-dim);
                    border-color: var(--primary-color);
                    transform: translateY(-2px);
                    box-shadow: var(--glow-shadow);
                }
                .fm-file-icon {
                    font-size: 2.5rem;
                    color: var(--primary-color);
                    margin-bottom: 10px;
                }
                .fm-file-name {
                    font-size: 0.85rem;
                    color: var(--text-main);
                    word-break: break-all;
                    font-family: monospace;
                }
                /* Context Menu / File Actions Overlay */
                .fm-file-actions {
                    position: absolute;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.85);
                    border-radius: 8px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    gap: 8px;
                    opacity: 0;
                    pointer-events: none;
                    transition: 0.2s;
                }
                .fm-file-card:hover .fm-file-actions {
                    opacity: 1;
                    pointer-events: auto;
                }
                .fm-action-btn {
                    background: transparent;
                    border: 1px solid var(--primary-color);
                    color: var(--primary-color);
                    padding: 4px 10px;
                    border-radius: 4px;
                    font-size: 0.75rem;
                    cursor: pointer;
                    width: 80%;
                    transition: 0.2s;
                }
                .fm-action-btn:hover {
                    background: var(--primary-color);
                    color: #000;
                }
                .fm-action-btn.delete {
                    border-color: var(--danger);
                    color: var(--danger);
                }
                .fm-action-btn.delete:hover {
                    background: var(--danger);
                    color: #fff;
                }
            </style>
        `,
        onInit: (win) => {
            const navBtns = win.querySelectorAll(".fm-nav-btn");
            const pathText = win.querySelector("#fm-path-text");
            const grid = win.querySelector("#fm-grid");

            // Navigation Logic
            navBtns.forEach(btn => {
                btn.addEventListener("click", () => {
                    navBtns.forEach(b => b.classList.remove("active"));
                    btn.classList.add("active");
                    
                    const path = btn.getAttribute("data-path");
                    if (path === "documents") {
                        pathText.textContent = "C:\\JARVIS\\Documents";
                        renderDocuments();
                    } else if (path === "system") {
                        pathText.textContent = "C:\\JARVIS\\Core_System";
                        renderFakeSystemFiles();
                    } else {
                        pathText.textContent = "C:\\JARVIS\\Archives";
                        grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); margin-top: 20px;"><i class="fa-solid fa-box-open fa-2x"></i><br>Archives Empty</div>`;
                    }
                });
            });

            function renderDocuments() {
                grid.innerHTML = "";
                let hasFiles = false;

                // Loop through local storage to find notes
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key.startsWith("jarvis_note_")) {
                        hasFiles = true;
                        const fileName = key.replace("jarvis_note_", "");
                        
                        const card = document.createElement("div");
                        card.className = "fm-file-card";
                        card.innerHTML = `
                            <i class="fa-solid fa-file-lines fm-file-icon"></i>
                            <div class="fm-file-name">${fileName}.txt</div>
                            <div class="fm-file-actions">
                                <button class="fm-action-btn open-btn"><i class="fa-solid fa-pen-to-square"></i> Edit</button>
                                <button class="fm-action-btn delete delete-btn"><i class="fa-solid fa-trash"></i> Del</button>
                            </div>
                        `;

                        // Edit Button: Opens Notepad and loads this file
                        card.querySelector(".open-btn").addEventListener("click", (e) => {
                            e.stopPropagation();
                            localStorage.setItem("jarvis_last_note", fileName); // Set target for notepad
                            if (typeof openWindow === "function") {
                                openWindow("notes"); // Call window manager to open Notepad
                            }
                        });

                        // Delete Button: Removes from storage and re-renders
                        card.querySelector(".delete-btn").addEventListener("click", (e) => {
                            e.stopPropagation();
                            if (confirm(`Delete protocol authorized for ${fileName}?`)) {
                                localStorage.removeItem(key);
                                // If it was the last opened note, clear that reference too
                                if (localStorage.getItem("jarvis_last_note") === fileName) {
                                    localStorage.removeItem("jarvis_last_note");
                                }
                                renderDocuments(); // Refresh view
                            }
                        });

                        grid.appendChild(card);
                    }
                }

                if (!hasFiles) {
                    grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); margin-top: 20px;"><i class="fa-solid fa-folder-open fa-2x"></i><br>No Documents Found</div>`;
                }
            }

            function renderFakeSystemFiles() {
                grid.innerHTML = `
                    <div class="fm-file-card">
                        <i class="fa-solid fa-gear fm-file-icon" style="color: #ffbd44;"></i>
                        <div class="fm-file-name">boot.dll</div>
                    </div>
                    <div class="fm-file-card">
                        <i class="fa-solid fa-shield-halved fm-file-icon" style="color: var(--danger);"></i>
                        <div class="fm-file-name">security.sys</div>
                    </div>
                    <div class="fm-file-card">
                        <i class="fa-solid fa-network-wired fm-file-icon"></i>
                        <div class="fm-file-name">network.cfg</div>
                    </div>
                    <div class="fm-file-card">
                        <i class="fa-brands fa-python fm-file-icon" style="color: #4B8BBE;"></i>
                        <div class="fm-file-name">py_core.bin</div>
                    </div>
                `;
            }

            // Initial Render
            renderDocuments();
        }
    };
});
