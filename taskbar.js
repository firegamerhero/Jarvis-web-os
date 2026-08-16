/* =========================================
   JARVIS WebOS - Taskbar Engine
   ========================================= */

document.addEventListener("DOMContentLoaded", () => {
    initTaskbar();
    initStartMenu();
});

function initStartMenu() {
    const startBtn = document.getElementById("start-btn");
    const startMenu = document.getElementById("start-menu");
    const searchInput = document.getElementById("sys-search");
    const startItems = document.querySelectorAll(".start-app-item");

    // Toggle Start Menu
    startBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (startMenu.style.display === "flex") {
            startMenu.style.display = "none";
            startBtn.style.transform = "rotate(0deg)";
        } else {
            startMenu.style.display = "flex";
            startBtn.style.transform = "rotate(90deg)";
            searchInput.focus();
        }
    });

    // Close Menu when clicking outside
    document.addEventListener("click", (e) => {
        if (!startMenu.contains(e.target) && e.target !== startBtn) {
            startMenu.style.display = "none";
            startBtn.style.transform = "rotate(0deg)";
        }
    });

    // Search Bar Filter Logic
    searchInput.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase();
        startItems.forEach(item => {
            const appName = item.textContent.toLowerCase();
            if (appName.includes(query)) {
                item.style.display = "flex";
            } else {
                item.style.display = "none";
            }
        });
    });

    // Click App in Start Menu
    startItems.forEach(item => {
        item.addEventListener("click", () => {
            const appId = item.getAttribute("data-app");
            if (appId && typeof openWindow === "function") {
                openWindow(appId);
                startMenu.style.display = "none";
                startBtn.style.transform = "rotate(0deg)";
            }
        });
    });
}

function initTaskbar() {
    // 1. Clock & Date Widget
    const timeDisplay = document.getElementById("time-display");
    const dateDisplay = document.getElementById("date-display");
    const clockWidget = document.getElementById("clock-widget");

    if (timeDisplay && dateDisplay) {
        setInterval(() => {
            const now = new Date();
            timeDisplay.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            dateDisplay.textContent = now.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }, 1000);

        if (clockWidget) {
            clockWidget.style.cursor = "pointer";
            clockWidget.addEventListener("click", () => {
                if (typeof openWindow === "function") openWindow('clock');
            });
        }
    }

    // 2. Battery Percentage Widget
    const batteryPct = document.getElementById("battery-pct");
    const batteryWidget = document.getElementById("battery-widget");

    if (batteryPct && 'getBattery' in navigator) {
        navigator.getBattery().then(battery => {
            function updateBattery() {
                const level = Math.round(battery.level * 100);
                batteryPct.textContent = `${level}%`;
                
                const icon = batteryWidget.querySelector('i');
                if (icon) {
                    if (battery.charging) icon.className = "fa-solid fa-bolt";
                    else if (level > 80) icon.className = "fa-solid fa-battery-full";
                    else if (level > 40) icon.className = "fa-solid fa-battery-half";
                    else icon.className = "fa-solid fa-battery-quarter";
                }
            }
            updateBattery();
            battery.addEventListener('levelchange', updateBattery);
            battery.addEventListener('chargingchange', updateBattery);
        });
    }

    // 3. Weather Widget
    const weatherWidget = document.getElementById("weather-widget");
    const weatherData = document.getElementById("weather-data");

    if (weatherData && weatherWidget) {
        const weatherIcon = weatherWidget.querySelector('i');
        
        function fetchWeather() {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(pos => {
                    const lat = pos.coords.latitude;
                    const lon = pos.coords.longitude;
                    const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
                    
                    fetch(apiUrl)
                        .then(res => res.json())
                        .then(data => {
                            const temp = Math.round(data.current_weather.temperature);
                            const code = data.current_weather.weathercode;
                            weatherData.textContent = `${temp}°C`;

                            if (weatherIcon) {
                                if (code === 0) weatherIcon.className = "fa-solid fa-sun";
                                else if (code > 0 && code <= 3) weatherIcon.className = "fa-solid fa-cloud-sun";
                                else if (code >= 45 && code <= 48) weatherIcon.className = "fa-solid fa-smog";
                                else if (code >= 51 && code <= 67) weatherIcon.className = "fa-solid fa-cloud-rain";
                                else if (code >= 71 && code <= 77) weatherIcon.className = "fa-solid fa-snowflake";
                                else if (code >= 80 && code <= 82) weatherIcon.className = "fa-solid fa-cloud-showers-heavy";
                                else if (code >= 95) weatherIcon.className = "fa-solid fa-cloud-bolt";
                            }
                        })
                        .catch(() => weatherData.textContent = "Error");
                }, () => {
                    weatherData.textContent = "Loc Denied";
                });
            } else {
                weatherData.textContent = "Not Supported";
            }
        }
        
        fetchWeather();
        setInterval(fetchWeather, 1800000); 
    }
}
// Replace the drag listener inside setupWindowInteractions in wm.js:
let isDragging = false;
let startX, startY, initialWinX, initialWinY;

function startDrag(e) {
    if (e.target.closest(".window-controls") || isMaximized) return;
    isDragging = true;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    startX = clientX;
    startY = clientY;
    initialWinX = win.offsetLeft;
    initialWinY = win.offsetTop;
    bringToFront(win);
}

function onDragMove(e) {
    if (!isDragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const dx = clientX - startX;
    const dy = clientY - startY;

    const maxLeft = window.innerWidth - win.offsetWidth;
    const maxTop = window.innerHeight - win.offsetHeight - 60;

    win.style.left = `${Math.max(0, Math.min(initialWinX + dx, maxLeft))}px`;
    win.style.top = `${Math.max(0, Math.min(initialWinY + dy, maxTop))}px`;
}

function stopDrag() {
    isDragging = false;
}

// Mouse events
header.addEventListener("mousedown", startDrag);
document.addEventListener("mousemove", onDragMove);
document.addEventListener("mouseup", stopDrag);

// Touch events for Android / Mobile
header.addEventListener("touchstart", startDrag, { passive: false });
document.addEventListener("touchmove", onDragMove, { passive: false });
document.addEventListener("touchend", stopDrag);