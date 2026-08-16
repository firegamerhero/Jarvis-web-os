/* =========================================
   JARVIS WebOS - Calendar & Reminders
   ========================================= */

registerApp("calendar", () => {
    return {
        title: "Tactical Calendar",
        icon: "fa-calendar-days",
        width: 650,
        height: 500,
        content: `
            <div style="display: flex; height: 100%; gap: 15px;">
                
                <!-- Left: Calendar Grid -->
                <div style="flex: 1.2; display: flex; flex-direction: column; background: rgba(0,0,0,0.4); border: 1px solid var(--glass-border); border-radius: 8px; padding: 15px;">
                    
                    <!-- Month Header -->
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <button id="cal-prev" class="cal-nav-btn"><i class="fa-solid fa-chevron-left"></i></button>
                        <h3 id="cal-month-year" style="color: var(--primary-color); font-family: monospace; font-size: 1.2rem; letter-spacing: 1px; text-transform: uppercase;">MONTH YYYY</h3>
                        <button id="cal-next" class="cal-nav-btn"><i class="fa-solid fa-chevron-right"></i></button>
                    </div>

                    <!-- Days of Week -->
                    <div style="display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 10px; font-weight: bold;">
                        <div>SU</div><div>MO</div><div>TU</div><div>WE</div><div>TH</div><div>FR</div><div>SA</div>
                    </div>

                    <!-- Calendar Days Grid -->
                    <div id="cal-grid" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px; flex: 1;">
                        <!-- Days injected via JS -->
                    </div>
                </div>

                <!-- Right: Reminders Panel -->
                <div style="flex: 0.8; display: flex; flex-direction: column; gap: 10px;">
                    
                    <!-- Selected Date Header -->
                    <div style="background: var(--primary-dim); border: 1px solid var(--primary-color); padding: 10px; border-radius: 6px; text-align: center;">
                        <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Selected Date</div>
                        <div id="rem-date-display" style="color: var(--text-main); font-weight: bold; font-size: 1.1rem; font-family: monospace;">---</div>
                    </div>

                    <!-- Reminders List -->
                    <div id="rem-list" style="flex: 1; overflow-y: auto; background: rgba(0,0,0,0.3); border: 1px solid var(--glass-border); border-radius: 6px; padding: 10px; display: flex; flex-direction: column; gap: 8px;">
                        <!-- Reminders injected here -->
                    </div>

                    <!-- Add Reminder Input -->
                    <div style="display: flex; gap: 5px;">
                        <input type="text" id="rem-input" placeholder="New Reminder..." style="flex: 1; padding: 8px 10px; background: rgba(0,0,0,0.6); border: 1px solid var(--primary-dim); color: var(--text-main); border-radius: 6px; outline: none; font-family: monospace; font-size: 0.9rem;">
                        <button id="rem-add-btn" style="padding: 8px 12px; background: var(--primary-dim); border: 1px solid var(--primary-color); color: var(--primary-color); border-radius: 6px; cursor: pointer; transition: 0.2s;">
                            <i class="fa-solid fa-plus"></i>
                        </button>
                    </div>

                </div>
            </div>

            <style>
                .cal-nav-btn {
                    background: transparent;
                    border: 1px solid var(--primary-dim);
                    color: var(--primary-color);
                    padding: 5px 10px;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: 0.2s;
                }
                .cal-nav-btn:hover {
                    background: var(--primary-color);
                    color: #000;
                }
                .cal-day {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    border: 1px solid transparent;
                    border-radius: 4px;
                    cursor: pointer;
                    color: var(--text-main);
                    font-family: monospace;
                    transition: 0.2s;
                    position: relative;
                }
                .cal-day:hover {
                    border-color: var(--primary-dim);
                    background: rgba(255,255,255,0.05);
                }
                .cal-day.active {
                    background: var(--primary-dim);
                    border-color: var(--primary-color);
                    color: var(--primary-color);
                    font-weight: bold;
                    box-shadow: inset 0 0 8px rgba(0, 240, 255, 0.2);
                }
                .cal-day.today {
                    color: #ffbd44; /* Highlight current real-world day */
                    font-weight: bold;
                }
                .cal-day.has-reminder::after {
                    content: '';
                    position: absolute;
                    bottom: 3px;
                    width: 4px;
                    height: 4px;
                    border-radius: 50%;
                    background: var(--primary-color);
                    box-shadow: var(--glow-shadow);
                }
                .cal-day.empty {
                    cursor: default;
                    pointer-events: none;
                }
                .rem-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    background: rgba(0,0,0,0.5);
                    padding: 8px 10px;
                    border-radius: 4px;
                    border-left: 3px solid var(--primary-color);
                    font-size: 0.85rem;
                }
                .rem-del-btn {
                    background: none;
                    border: none;
                    color: var(--danger);
                    cursor: pointer;
                    opacity: 0.6;
                    transition: 0.2s;
                }
                .rem-item:hover .rem-del-btn {
                    opacity: 1;
                }
            </style>
        `,
        onInit: (win) => {
            const grid = win.querySelector("#cal-grid");
            const monthYearText = win.querySelector("#cal-month-year");
            const prevBtn = win.querySelector("#cal-prev");
            const nextBtn = win.querySelector("#cal-next");
            
            const remDateDisplay = win.querySelector("#rem-date-display");
            const remList = win.querySelector("#rem-list");
            const remInput = win.querySelector("#rem-input");
            const remAddBtn = win.querySelector("#rem-add-btn");

            let currentDate = new Date(); // The month currently being viewed
            let selectedDateStr = ""; // The specific day clicked (YYYY-MM-DD)

            // Load saved reminders from LocalStorage
            function getReminders() {
                const stored = localStorage.getItem("jarvis_reminders");
                return stored ? JSON.parse(stored) : {};
            }

            function saveReminders(data) {
                localStorage.setItem("jarvis_reminders", JSON.stringify(data));
            }

            function formatDateString(year, month, day) {
                return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            }

            function renderCalendar() {
                grid.innerHTML = "";
                
                const year = currentDate.getFullYear();
                const month = currentDate.getMonth();
                
                const firstDay = new Date(year, month, 1).getDay();
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                
                // Set Header
                const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
                monthYearText.textContent = `${monthNames[month]} ${year}`;

                const realToday = new Date();
                const isCurrentMonth = realToday.getFullYear() === year && realToday.getMonth() === month;
                const reminders = getReminders();

                // Empty slots before first day
                for (let i = 0; i < firstDay; i++) {
                    const emptyDiv = document.createElement("div");
                    emptyDiv.className = "cal-day empty";
                    grid.appendChild(emptyDiv);
                }

                // Days
                for (let day = 1; day <= daysInMonth; day++) {
                    const dayDiv = document.createElement("div");
                    dayDiv.className = "cal-day";
                    dayDiv.textContent = day;
                    
                    const dateStr = formatDateString(year, month, day);

                    // Add classes for styling
                    if (isCurrentMonth && day === realToday.getDate()) {
                        dayDiv.classList.add("today");
                    }
                    if (dateStr === selectedDateStr) {
                        dayDiv.classList.add("active");
                    }
                    if (reminders[dateStr] && reminders[dateStr].length > 0) {
                        dayDiv.classList.add("has-reminder");
                    }

                    // Click event to select day
                    dayDiv.addEventListener("click", () => {
                        selectedDateStr = dateStr;
                        remDateDisplay.textContent = new Date(year, month, day).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
                        renderCalendar(); // Re-render to update 'active' class
                        renderReminders();
                    });

                    grid.appendChild(dayDiv);
                }
            }

            function renderReminders() {
                remList.innerHTML = "";
                
                if (!selectedDateStr) {
                    remList.innerHTML = `<div style="text-align: center; color: var(--text-muted); margin-top: 20px; font-size: 0.85rem;">Select a date to view/add tasks.</div>`;
                    return;
                }

                const reminders = getReminders();
                const dayReminders = reminders[selectedDateStr] || [];

                if (dayReminders.length === 0) {
                    remList.innerHTML = `<div style="text-align: center; color: var(--text-muted); margin-top: 20px; font-size: 0.85rem;">No active protocols for this date.</div>`;
                    return;
                }

                dayReminders.forEach((text, index) => {
                    const item = document.createElement("div");
                    item.className = "rem-item";
                    item.innerHTML = `
                        <span style="color: var(--text-main); font-family: monospace;">${text}</span>
                        <button class="rem-del-btn"><i class="fa-solid fa-trash"></i></button>
                    `;

                    // Delete Reminder
                    item.querySelector(".rem-del-btn").addEventListener("click", () => {
                        dayReminders.splice(index, 1);
                        if (dayReminders.length === 0) {
                            delete reminders[selectedDateStr];
                        } else {
                            reminders[selectedDateStr] = dayReminders;
                        }
                        saveReminders(reminders);
                        renderReminders();
                        renderCalendar(); // Update dot indicators
                    });

                    remList.appendChild(item);
                });
            }

            // Add new reminder logic
            function addReminder() {
                const text = remInput.value.trim();
                if (!text || !selectedDateStr) return;

                const reminders = getReminders();
                if (!reminders[selectedDateStr]) {
                    reminders[selectedDateStr] = [];
                }
                reminders[selectedDateStr].push(text);
                saveReminders(reminders);
                
                remInput.value = "";
                renderReminders();
                renderCalendar();
            }

            remAddBtn.addEventListener("click", addReminder);
            remInput.addEventListener("keypress", (e) => {
                if (e.key === "Enter") addReminder();
            });

            // Change Month Navigation
            prevBtn.addEventListener("click", () => {
                currentDate.setMonth(currentDate.getMonth() - 1);
                renderCalendar();
            });

            nextBtn.addEventListener("click", () => {
                currentDate.setMonth(currentDate.getMonth() + 1);
                renderCalendar();
            });

            // Initialize: Select today by default
            const today = new Date();
            selectedDateStr = formatDateString(today.getFullYear(), today.getMonth(), today.getDate());
            remDateDisplay.textContent = today.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
            
            renderCalendar();
            renderReminders();
        }
    };
});
