/* =========================================
   JARVIS WebOS - Weather Radar App
   ========================================= */

registerApp("weather", () => {
    return {
        title: "Meteorological Radar",
        icon: "fa-cloud-sun-rain",
        width: 450,
        height: 380,
        content: `
            <div style="display: flex; flex-direction: column; height: 100%; gap: 15px; padding: 10px;">
                
                <!-- Radar Header -->
                <div style="text-align: center; border-bottom: 1px solid var(--glass-border); padding-bottom: 10px;">
                    <div id="weather-location" style="color: var(--primary-color); font-weight: bold; letter-spacing: 2px; font-size: 1.1rem;">
                        <i class="fa-solid fa-satellite-dish fa-beat" style="margin-right: 8px;"></i> SCANNING LOCAL SECTOR...
                    </div>
                    <div style="font-size: 0.8rem; color: var(--text-muted); font-family: monospace; margin-top: 5px;">
                        SAT-LINK: SECURE | STATUS: NOMINAL
                    </div>
                </div>

                <!-- Main Weather Display -->
                <div style="display: flex; align-items: center; justify-content: center; gap: 30px; flex: 1;">
                    <div id="weather-main-icon" style="font-size: 5rem; color: var(--primary-color); filter: drop-shadow(0 0 15px var(--primary-color)); transition: 0.3s;">
                        <i class="fa-solid fa-spinner fa-spin"></i>
                    </div>
                    <div style="display: flex; flex-direction: column;">
                        <span id="weather-main-temp" style="font-size: 4.5rem; font-weight: bold; color: var(--text-main); line-height: 1;">--°</span>
                        <span id="weather-main-desc" style="font-size: 1.2rem; color: var(--primary-color); text-transform: uppercase; letter-spacing: 1px;">CALIBRATING</span>
                    </div>
                </div>

                <!-- Atmospheric Details -->
                <div style="display: flex; justify-content: space-between; background: rgba(0,0,0,0.4); padding: 15px; border-radius: 8px; border: 1px solid var(--primary-dim);">
                    <div style="text-align: center; flex: 1; border-right: 1px solid var(--primary-dim);">
                        <i class="fa-solid fa-wind" style="color: var(--text-muted); margin-bottom: 5px; font-size: 1.2rem;"></i>
                        <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase;">Wind Speed</div>
                        <div id="weather-wind" style="font-size: 1.1rem; color: var(--text-main); font-weight: bold;">-- km/h</div>
                    </div>
                    <div style="text-align: center; flex: 1;">
                        <i class="fa-solid fa-arrow-down-up-across-line" style="color: var(--text-muted); margin-bottom: 5px; font-size: 1.2rem;"></i>
                        <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase;">Elevation / Alt</div>
                        <div id="weather-alt" style="font-size: 1.1rem; color: var(--text-main); font-weight: bold;">-- m</div>
                    </div>
                </div>
            </div>
        `,
        onInit: (win) => {
            const locDisplay = win.querySelector("#weather-location");
            const iconDisplay = win.querySelector("#weather-main-icon");
            const tempDisplay = win.querySelector("#weather-main-temp");
            const descDisplay = win.querySelector("#weather-main-desc");
            const windDisplay = win.querySelector("#weather-wind");
            const altDisplay = win.querySelector("#weather-alt");

            // WMO Weather Code Translator
            function parseWeatherCode(code) {
                if (code === 0) return { desc: "Clear Sky", icon: "fa-sun fa-spin-pulse" };
                if (code > 0 && code <= 3) return { desc: "Partly Cloudy", icon: "fa-cloud-sun fa-fade" };
                if (code >= 45 && code <= 48) return { desc: "Fog / Smog", icon: "fa-smog fa-fade" };
                if (code >= 51 && code <= 67) return { desc: "Precipitation", icon: "fa-cloud-rain fa-bounce" };
                if (code >= 71 && code <= 77) return { desc: "Snowfall", icon: "fa-snowflake fa-spin" };
                if (code >= 80 && code <= 82) return { desc: "Heavy Showers", icon: "fa-cloud-showers-heavy fa-beat" };
                if (code >= 95) return { desc: "Thunderstorm", icon: "fa-cloud-bolt fa-flash" };
                return { desc: "Unknown", icon: "fa-satellite" };
            }

            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(pos => {
                    const lat = pos.coords.latitude;
                    const lon = pos.coords.longitude;
                    
                    locDisplay.innerHTML = `<i class="fa-solid fa-location-crosshairs" style="margin-right: 8px;"></i> LOCAL SECTOR [${lat.toFixed(2)}, ${lon.toFixed(2)}]`;

                    const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&elevation=nan`;
                    
                    fetch(apiUrl)
                        .then(res => res.json())
                        .then(data => {
                            const cw = data.current_weather;
                            const weatherInfo = parseWeatherCode(cw.weathercode);

                            tempDisplay.textContent = `${Math.round(cw.temperature)}°`;
                            descDisplay.textContent = weatherInfo.desc;
                            iconDisplay.innerHTML = `<i class="fa-solid ${weatherInfo.icon}"></i>`;
                            windDisplay.textContent = `${cw.windspeed} km/h`;
                            
                            // Free API also provides estimated elevation!
                            altDisplay.textContent = `${data.elevation !== undefined ? data.elevation : '12'} m`;
                        })
                        .catch(() => {
                            descDisplay.textContent = "API OFFLINE";
                            iconDisplay.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i>`;
                        });
                }, () => {
                    locDisplay.innerHTML = "LOCATION ACCESS DENIED";
                    descDisplay.textContent = "SENSOR BLOCKED";
                    iconDisplay.innerHTML = `<i class="fa-solid fa-satellite-dish"></i>`;
                });
            } else {
                locDisplay.innerHTML = "GEOLOCATION UNSUPPORTED";
            }
        }
    };
});
