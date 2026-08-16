/* =========================================
   JARVIS WebOS - Holographic Calculator
   ========================================= */

registerApp("calc", () => {
    return {
        title: "Quantum Calculator",
        icon: "fa-calculator",
        width: 320,
        height: 480,
        content: `
            <div style="display: flex; flex-direction: column; height: 100%; gap: 15px; padding: 5px;">
                
                <!-- Calculator Display -->
                <div style="background: rgba(0,0,0,0.6); border: 1px solid var(--primary-dim); border-radius: 8px; padding: 15px; display: flex; flex-direction: column; align-items: flex-end; justify-content: flex-end; height: 90px; box-shadow: inset 0 0 15px rgba(0,0,0,0.8);">
                    <div id="calc-history" style="font-size: 0.85rem; color: var(--text-muted); font-family: monospace; min-height: 1.2em;"></div>
                    <div id="calc-display" style="font-size: 2.5rem; color: var(--primary-color); font-family: monospace; font-weight: bold; text-shadow: var(--glow-shadow); letter-spacing: 2px;">0</div>
                </div>

                <!-- Calculator Keypad -->
                <div id="calc-keypad" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; flex: 1;">
                    <button class="calc-btn calc-action" style="color: var(--danger); border-color: rgba(255,0,60,0.4);" data-action="clear">C</button>
                    <button class="calc-btn calc-action" data-action="delete"><i class="fa-solid fa-delete-left"></i></button>
                    <button class="calc-btn calc-op" data-op="%">%</button>
                    <button class="calc-btn calc-op" data-op="/">÷</button>
                    
                    <button class="calc-btn calc-num" data-num="7">7</button>
                    <button class="calc-btn calc-num" data-num="8">8</button>
                    <button class="calc-btn calc-num" data-num="9">9</button>
                    <button class="calc-btn calc-op" data-op="*">×</button>
                    
                    <button class="calc-btn calc-num" data-num="4">4</button>
                    <button class="calc-btn calc-num" data-num="5">5</button>
                    <button class="calc-btn calc-num" data-num="6">6</button>
                    <button class="calc-btn calc-op" data-op="-">−</button>
                    
                    <button class="calc-btn calc-num" data-num="1">1</button>
                    <button class="calc-btn calc-num" data-num="2">2</button>
                    <button class="calc-btn calc-num" data-num="3">3</button>
                    <button class="calc-btn calc-op" data-op="+">+</button>
                    
                    <button class="calc-btn calc-num" style="grid-column: span 2;" data-num="0">0</button>
                    <button class="calc-btn calc-num" data-num=".">.</button>
                    <button class="calc-btn calc-eq" data-action="calculate" style="background: var(--primary-dim); color: var(--primary-color); border-color: var(--primary-color);">=</button>
                </div>
            </div>

            <style>
                .calc-btn {
                    background: rgba(0,0,0,0.4);
                    border: 1px solid var(--glass-border);
                    color: var(--text-main);
                    border-radius: 6px;
                    font-size: 1.2rem;
                    font-family: monospace;
                    cursor: pointer;
                    transition: 0.1s ease-in-out;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                .calc-btn:active {
                    transform: scale(0.95);
                }
                .calc-btn:hover {
                    background: rgba(255,255,255,0.05);
                    box-shadow: inset 0 0 10px var(--primary-dim);
                    border-color: var(--primary-color);
                }
                .calc-op {
                    color: #ffbd44;
                    font-size: 1.4rem;
                }
                .calc-eq:hover {
                    background: var(--primary-color) !important;
                    color: #000 !important;
                    box-shadow: var(--glow-shadow) !important;
                }
            </style>
        `,
        onInit: (win) => {
            const display = win.querySelector("#calc-display");
            const history = win.querySelector("#calc-history");
            
            let currentInput = "0";
            let previousInput = "";
            let operator = null;
            let shouldResetScreen = false;

            function updateScreen() {
                // Formatting for long numbers
                if (currentInput.length > 12) {
                    display.style.fontSize = "1.5rem";
                } else if (currentInput.length > 8) {
                    display.style.fontSize = "2rem";
                } else {
                    display.style.fontSize = "2.5rem";
                }
                display.textContent = currentInput;
            }

            function appendNumber(num) {
                if (currentInput === "0" && num !== "." || shouldResetScreen) {
                    currentInput = "";
                    shouldResetScreen = false;
                }
                if (num === "." && currentInput.includes(".")) return;
                currentInput += num;
                updateScreen();
            }

            function chooseOperator(op) {
                if (operator !== null && !shouldResetScreen) calculate();
                previousInput = currentInput;
                operator = op;
                history.textContent = `${previousInput} ${op}`;
                shouldResetScreen = true;
            }

            function calculate() {
                if (operator === null || shouldResetScreen) return;
                
                let prev = parseFloat(previousInput);
                let current = parseFloat(currentInput);
                let result;

                switch (operator) {
                    case "+": result = prev + current; break;
                    case "-": result = prev - current; break;
                    case "*": result = prev * current; break;
                    case "/": 
                        if (current === 0) {
                            result = "ERROR";
                        } else {
                            result = prev / current; 
                        }
                        break;
                    case "%": result = prev % current; break;
                    default: return;
                }

                // Handle precision issues (e.g. 0.1 + 0.2 = 0.30000000000000004)
                if (typeof result === "number") {
                    result = Math.round(result * 100000000) / 100000000;
                }

                currentInput = result.toString();
                history.textContent = `${previousInput} ${operator} ${current} =`;
                operator = null;
                shouldResetScreen = true;
                updateScreen();
            }

            function clear() {
                currentInput = "0";
                previousInput = "";
                operator = null;
                history.textContent = "";
                updateScreen();
            }

            function deleteNum() {
                if (shouldResetScreen) return;
                currentInput = currentInput.slice(0, -1);
                if (currentInput === "") currentInput = "0";
                updateScreen();
            }

            // Bind Events
            win.querySelectorAll(".calc-num").forEach(btn => {
                btn.addEventListener("click", () => appendNumber(btn.getAttribute("data-num")));
            });

            win.querySelectorAll(".calc-op").forEach(btn => {
                btn.addEventListener("click", () => chooseOperator(btn.getAttribute("data-op")));
            });

            win.querySelector("[data-action='calculate']").addEventListener("click", calculate);
            win.querySelector("[data-action='clear']").addEventListener("click", clear);
            win.querySelector("[data-action='delete']").addEventListener("click", deleteNum);
            
            // Allow Keyboard input for the calculator if window is focused
            win.addEventListener("keydown", (e) => {
                if (e.key >= 0 && e.key <= 9 || e.key === ".") appendNumber(e.key);
                if (e.key === "=" || e.key === "Enter") calculate();
                if (e.key === "Backspace") deleteNum();
                if (e.key === "Escape") clear();
                if (e.key === "+" || e.key === "-" || e.key === "*" || e.key === "/" || e.key === "%") {
                    chooseOperator(e.key);
                }
            });
            // Make the window focusable to receive keydown events
            win.tabIndex = -1;
        }
    };
});
