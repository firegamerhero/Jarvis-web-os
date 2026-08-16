/* =========================================
   JARVIS WebOS - Notes App
   ========================================= */

registerApp("notes", () => {
    return {
        title: "Notepad",
        icon: "fa-file-lines",
        width: 500,
        height: 400,
        content: `
            <div style="display: flex; flex-direction: column; height: 100%; gap: 10px;">
                <div style="display: flex; gap: 10px;">
                    <input type="text" id="note-title" placeholder="Filename (e.g. Secret_Code)" 
                           style="flex: 1; padding: 8px 12px; background: rgba(0,0,0,0.5); border: 1px solid var(--glass-border); color: var(--text-main); border-radius: 6px; outline: none; font-family: monospace;">
                    
                    <button id="note-save" style="padding: 8px 15px; background: var(--primary-dim); border: 1px solid var(--primary-color); color: var(--primary-color); border-radius: 6px; cursor: pointer; font-weight: bold; transition: 0.2s;">
                        <i class="fa-solid fa-floppy-disk"></i> Save
                    </button>
                    
                    <button id="note-clear" style="padding: 8px 15px; background: rgba(255,0,60,0.15); border: 1px solid var(--danger); color: var(--danger); border-radius: 6px; cursor: pointer; font-weight: bold; transition: 0.2s;">
                        <i class="fa-solid fa-trash"></i> Clear
                    </button>
                </div>
                
                <textarea id="note-content" placeholder="Start typing... (Auto-saves as you type)" 
                          style="flex: 1; resize: none; padding: 12px; background: rgba(0,0,0,0.4); border: 1px solid var(--glass-border); color: var(--text-main); border-radius: 6px; font-family: 'Segoe UI', sans-serif; font-size: 1rem; outline: none; line-height: 1.5;"></textarea>
                
                <div id="note-status" style="font-size: 0.8rem; color: var(--text-muted); text-align: right; font-family: monospace;">
                    System Ready
                </div>
            </div>
        `,
        onInit: (win) => {
            const titleInput = win.querySelector("#note-title");
            const contentArea = win.querySelector("#note-content");
            const saveBtn = win.querySelector("#note-save");
            const clearBtn = win.querySelector("#note-clear");
            const statusText = win.querySelector("#note-status");

            let autoSaveTimeout;

            // Load the last opened note or default to 'Untitled'
            const lastNoteTitle = localStorage.getItem("jarvis_last_note") || "Untitled";
            titleInput.value = lastNoteTitle;
            contentArea.value = localStorage.getItem("jarvis_note_" + lastNoteTitle) || "";

            // Core Save Function
            function saveNote() {
                const title = titleInput.value.trim() || "Untitled";
                const content = contentArea.value;
                
                // Save to browser memory
                localStorage.setItem("jarvis_note_" + title, content);
                localStorage.setItem("jarvis_last_note", title);
                
                // Update Status UI
                statusText.textContent = "Last saved: " + new Date().toLocaleTimeString();
                statusText.style.color = "var(--primary-color)";
                
                setTimeout(() => {
                    statusText.style.color = "var(--text-muted)";
                }, 2000);
            }

            // Auto-save typing with debounce (waits 1 sec after you stop typing to save)
            contentArea.addEventListener("input", () => {
                statusText.textContent = "Typing...";
                statusText.style.color = "var(--text-muted)";
                clearTimeout(autoSaveTimeout);
                autoSaveTimeout = setTimeout(saveNote, 1000);
            });

            // When user changes the file name, try to load that file if it exists
            titleInput.addEventListener("change", () => {
                const newTitle = titleInput.value.trim() || "Untitled";
                const existingContent = localStorage.getItem("jarvis_note_" + newTitle);
                
                if (existingContent !== null) {
                    contentArea.value = existingContent;
                    statusText.textContent = `Loaded file: ${newTitle}`;
                } else {
                    contentArea.value = ""; // New file
                    statusText.textContent = `Created new file: ${newTitle}`;
                }
                saveNote();
            });

            // Manual Save Button Animation & Logic
            saveBtn.addEventListener("click", () => {
                saveNote();
                saveBtn.style.background = "var(--primary-color)";
                saveBtn.style.color = "#000";
                setTimeout(() => {
                    saveBtn.style.background = "var(--primary-dim)";
                    saveBtn.style.color = "var(--primary-color)";
                }, 250);
            });

            // Clear Button Logic
            clearBtn.addEventListener("click", () => {
                if(confirm("Are you sure you want to clear this file?")) {
                    contentArea.value = "";
                    saveNote();
                }
            });
        }
    };
});
