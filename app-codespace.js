/* =========================================
   JARVIS WebOS - Python Code Space
   ========================================= */

registerApp("codespace", () => {
    return {
        title: "Python Code Space",
        icon: "fa-python",
        width: 700,
        height: 550,
        content: `
            <div style="display: flex; flex-direction: column; height: 100%; gap: 10px;">
                
                <!-- Toolbar -->
                <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.5); padding: 10px; border: 1px solid var(--glass-border); border-radius: 6px;">
                    <div id="py-status" style="font-family: monospace; font-size: 0.9rem; color: #ffbd44; font-weight: bold; letter-spacing: 1px;">
                        <i class="fa-solid fa-circle-notch fa-spin"></i> DOWNLOADING PYTHON CORE...
                    </div>
                    <button id="py-run" disabled style="opacity: 0.5; padding: 8px 20px; background: rgba(0, 240, 255, 0.15); border: 1px solid var(--primary-color); color: var(--primary-color); border-radius: 4px; cursor: pointer; font-weight: bold; font-family: monospace; transition: 0.2s;">
                        <i class="fa-solid fa-play"></i> EXECUTE PROTOCOL
                    </button>
                </div>

                <!-- Code Editor Area -->
                <div style="flex: 1; display: flex; flex-direction: column; border: 1px solid var(--primary-dim); border-radius: 6px; overflow: hidden;">
                    <div style="background: rgba(0, 240, 255, 0.1); padding: 5px 10px; font-family: monospace; font-size: 0.8rem; color: var(--primary-color); border-bottom: 1px solid var(--primary-dim);">
                        > script.py
                    </div>
                    <textarea id="py-editor" spellcheck="false" style="flex: 1; width: 100%; background: rgba(0,0,0,0.7); border: none; color: #e2f1f8; font-family: 'Courier New', Courier, monospace; font-size: 1rem; padding: 15px; outline: none; resize: none;"></textarea>
                </div>

                <!-- Console Output Area -->
                <div style="height: 150px; display: flex; flex-direction: column; border: 1px solid var(--glass-border); border-radius: 6px; overflow: hidden;">
                    <div style="background: rgba(0, 0, 0, 0.8); padding: 5px 10px; font-family: monospace; font-size: 0.8rem; color: var(--text-muted); border-bottom: 1px solid var(--glass-border);">
                        > TERMINAL OUTPUT
                    </div>
                    <pre id="py-output" style="flex: 1; margin: 0; background: #020617; color: #00ff88; font-family: 'Courier New', Courier, monospace; font-size: 0.9rem; padding: 10px; overflow-y: auto; white-space: pre-wrap;"></pre>
                </div>

            </div>
        `,
        onInit: (win) => {
            const statusText = win.querySelector("#py-status");
            const runBtn = win.querySelector("#py-run");
            const editor = win.querySelector("#py-editor");
            const outputArea = win.querySelector("#py-output");

            // Default Python Code
            editor.value = `# JARVIS OS - Python Neural Engine\n# Awaiting commands...\n\ndef greet_captain():\n    print("Welcome back, Captain.")\n    print("Systems are fully operational.")\n\ngreet_captain()\n\n# Try doing some math:\nprint("Calculation:", 24 * 7)`;

            // Helper to write to our holographic terminal
            function appendOutput(text, isError = false) {
                const span = document.createElement("span");
                span.textContent = text + "\n";
                if (isError) {
                    span.style.color = "var(--danger)";
                }
                outputArea.appendChild(span);
                outputArea.scrollTop = outputArea.scrollHeight;
            }

            // Load Pyodide Engine Dynamically
            async function bootPythonEngine() {
                try {
                    // Check if script is already injected (if window is closed and reopened)
                    if (!document.getElementById("pyodide-script")) {
                        const script = document.createElement("script");
                        script.id = "pyodide-script";
                        script.src = "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js";
                        document.head.appendChild(script);

                        // Wait for script to load
                        await new Promise((resolve) => {
                            script.onload = resolve;
                        });
                    }

                    // Initialize Pyodide and redirect print() to our HTML terminal
                    if (!window.pyodideInstance) {
                        window.pyodideInstance = await loadPyodide({
                            stdout: (text) => appendOutput(text)
                        });
                    }

                    // Update UI to Ready State
                    statusText.innerHTML = `<i class="fa-solid fa-check" style="color: #00ff88;"></i> ENGINE ONLINE`;
                    statusText.style.color = "#00ff88";
                    
                    runBtn.disabled = false;
                    runBtn.style.opacity = "1";
                    
                    // Hover effect for active button
                    runBtn.addEventListener("mouseover", () => runBtn.style.background = "var(--primary-color)");
                    runBtn.addEventListener("mouseover", () => runBtn.style.color = "#000");
                    runBtn.addEventListener("mouseout", () => runBtn.style.background = "rgba(0, 240, 255, 0.15)");
                    runBtn.addEventListener("mouseout", () => runBtn.style.color = "var(--primary-color)");

                } catch (err) {
                    statusText.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ENGINE FAILURE`;
                    statusText.style.color = "var(--danger)";
                    appendOutput("CRITICAL ERROR LOADING PYTHON: " + err.message, true);
                }
            }

            // Execute code on Run button click
            runBtn.addEventListener("click", async () => {
                const code = editor.value;
                outputArea.innerHTML = ""; // Clear previous output
                
                if (!window.pyodideInstance) {
                    appendOutput("SYSTEM ERROR: Python engine is not initialized.", true);
                    return;
                }

                try {
                    // Run the Python code
                    await window.pyodideInstance.runPythonAsync(code);
                    appendOutput("\n[Process completed]", false);
                } catch (err) {
                    // Catch and display Python syntax errors
                    appendOutput(err.toString(), true);
                }
            });

            // Start boot sequence when window opens
            bootPythonEngine();
        }
    };
});
