// ====== KONFIGURATION ======
const CONFIG = {
    city: 'Trollhättan',
    country: 'SE',
    apiKey: '073b784fec004c9e4c9d07dfaac9d689',
    updateInterval: 300000, // 5 minuter
    units: 'metric',
    language: 'sv'
};

// Väderikoner mappning
const WEATHER_ICONS = {
    // Clear
    '01d': 'fas fa-sun',
    '01n': 'fas fa-moon',
    
    // Few clouds
    '02d': 'fas fa-cloud-sun',
    '02n': 'fas fa-cloud-moon',
    
    // Scattered clouds
    '03d': 'fas fa-cloud',
    '03n': 'fas fa-cloud',
    
    // Broken clouds
    '04d': 'fas fa-cloud',
    '04n': 'fas fa-cloud',
    
    // Shower rain
    '09d': 'fas fa-cloud-showers-heavy',
    '09n': 'fas fa-cloud-showers-heavy',
    
    // Rain
    '10d': 'fas fa-cloud-rain',
    '10n': 'fas fa-cloud-rain',
    
    // Thunderstorm
    '11d': 'fas fa-bolt',
    '11n': 'fas fa-bolt',
    
    // Snow
    '13d': 'fas fa-snowflake',
    '13n': 'fas fa-snowflake',
    
    // Mist
    '50d': 'fas fa-smog',
    '50n': 'fas fa-smog'
};

// Väderklasser för bakgrundsbilder
const WEATHER_CLASSES = {
    'clear': 'clear',
    'clouds': 'clouds',
    'rain': 'rain',
    'drizzle': 'rain',
    'thunderstorm': 'thunderstorm',
    'snow': 'snow',
    'mist': 'mist',
    'smoke': 'mist',
    'haze': 'mist',
    'dust': 'mist',
    'fog': 'mist',
    'sand': 'mist',
    'ash': 'mist',
    'squall': 'windy',
    'tornado': 'windy'
};

// Svensk översättning av väderförhållanden
const WEATHER_TRANSLATIONS = {
    'clear sky': 'Klart',
    'few clouds': 'Lätt molnig',
    'scattered clouds': 'Spridda moln',
    'broken clouds': 'Mulet',
    'overcast clouds': 'Mulet',
    'shower rain': 'Regnskurar',
    'rain': 'Regn',
    'thunderstorm': 'Åska',
    'snow': 'Snö',
    'mist': 'Dimma',
    'fog': 'Dimma',
    'haze': 'Disigt',
    'dust': 'Dammigt',
    'smoke': 'Rökigt',
    'sand': 'Sandstorm',
    'ash': 'Aska',
    'squall': 'Byvind',
    'tornado': 'Tornado',
    'drizzle': 'Duggregn'
};

// ====== GLOBALA VARIABLER ======
let weatherData = null;
let forecastData = null;
let lastUpdateTime = null;

// ====== HUVUDFUNKTIONER ======

// Funktion för att uppdatera klockan
function updateClock() {
    const now = new Date();
    
    // Uppdatera tid
    const timeElement = document.getElementById('time');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    timeElement.textContent = `${hours}:${minutes}:${seconds}`;
    
    // Uppdatera datum
    const dateElement = document.getElementById('date');
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = now.toLocaleDateString('sv-SE', options);
    dateElement.textContent = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
    
    // Uppdatera solposition om vi har data
    if (weatherData) {
        updateSunPosition(now);
    }
}

// Funktion för att uppdatera solposition
function updateSunPosition(currentTime) {
    if (!weatherData || !weatherData.sys) return;
    
    const sunrise = new Date(weatherData.sys.sunrise * 1000);
    const sunset = new Date(weatherData.sys.sunset * 1000);
    
    const dayLength = sunset - sunrise;
    const currentPos = currentTime - sunrise;
    
    let percentage = 0;
    if (currentPos > 0 && currentPos < dayLength) {
        percentage = (currentPos / dayLength) * 100;
    } else if (currentPos <= 0) {
        percentage = 0;
    } else {
        percentage = 100;
    }
    
    // Begränsa mellan 5% och 95%
    percentage = Math.max(5, Math.min(95, percentage));
    
    const sunElement = document.getElementById('sun-position');
    const currentTimeElement = document.getElementById('current-sun-time');
    
    if (sunElement) {
        sunElement.style.left = `${percentage}%`;
    }
    
    if (currentTimeElement) {
        const hours = String(currentTime.getHours()).padStart(2, '0');
        const minutes = String(currentTime.getMinutes()).padStart(2, '0');
        currentTimeElement.textContent = `${hours}:${minutes}`;
    }
    
    // Beräkna och visa dagljuslängd
    const daylightHours = Math.floor(dayLength / (1000 * 60 * 60));
    const daylightMinutes = Math.floor((dayLength % (1000 * 60 * 60)) / (1000 * 60));
    const nightHours = 24 - daylightHours - 1;
    const nightMinutes = 60 - daylightMinutes;
    
    const daylightElement = document.getElementById('daylight-hours');
    const nightElement = document.getElementById('night-hours');
    
    if (daylightElement) {
        daylightElement.textContent = `Dag: ${daylightHours}h ${daylightMinutes}m`;
    }
    
    if (nightElement) {
        nightElement.textContent = `Natt: ${nightHours}h ${nightMinutes}m`;
    }
}

// Funktion för att hämta väderdata
async function fetchWeatherData() {
    const currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${CONFIG.city},${CONFIG.country}&appid=${CONFIG.apiKey}&units=${CONFIG.units}&lang=${CONFIG.language}`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${CONFIG.city},${CONFIG.country}&appid=${CONFIG.apiKey}&units=${CONFIG.units}&lang=${CONFIG.language}`;
    
    try {
        const [currentResponse, forecastResponse] = await Promise.all([
            fetch(currentUrl),
            fetch(forecastUrl)
        ]);
        
        if (!currentResponse.ok || !forecastResponse.ok) {
            throw new Error('Kunde inte hämta väderdata');
        }
        
        const currentData = await currentResponse.json();
        const forecastData = await forecastResponse.json();
        
        return { current: currentData, forecast: forecastData };
    } catch (error) {
        console.error('Fel vid hämtning av väderdata:', error);
        showError('Kunde inte hämta väderdata. Kontrollera internetanslutning.');
        return null;
    }
}

// Funktion för att uppdatera bakgrund baserat på väder
function updateWeatherBackground(weatherCondition) {
    const backgroundElement = document.getElementById('weather-background');
    const condition = weatherCondition.toLowerCase();
    
    // Hitta rätt klass för väderförhållandet
    let weatherClass = 'default';
    for (const [key, value] of Object.entries(WEATHER_CLASSES)) {
        if (condition.includes(key)) {
            weatherClass = value;
            break;
        }
    }
    
    // Ta bort alla väderklasser och lägg till rätt
    backgroundElement.className = 'weather-background ' + weatherClass;
}

// Funktion för att översätta väderbeskrivning
function translateWeatherDescription(description) {
    const desc = description.toLowerCase();
    for (const [key, value] of Object.entries(WEATHER_TRANSLATIONS)) {
        if (desc.includes(key)) {
            return value;
        }
    }
    return description.charAt(0).toUpperCase() + description.slice(1);
}

// Funktion för att uppdatera aktuellt väder
function updateCurrentWeather(data) {
    if (!data) return;
    
    weatherData = data;
    
    // Uppdatera temperatur
    document.getElementById('current-temp').textContent = Math.round(data.main.temp);
    document.getElementById('feels-like-temp').textContent = `${Math.round(data.main.feels_like)}°`;
    document.getElementById('brief-temp').textContent = `${Math.round(data.main.temp)}°`;
    
    // Uppdatera väderbeskrivning
    const description = translateWeatherDescription(data.weather[0].description);
    document.getElementById('weather-description').textContent = description;
    document.getElementById('brief-condition').textContent = description;
    
    // Uppdatera väderdetaljer
    document.getElementById('weather-details').textContent = 
        `Vädret i Trollhättan är ${description.toLowerCase()} med en temperatur på ${Math.round(data.main.temp)}°C.`;
    
    // Uppdatera väderikon
    const iconCode = data.weather[0].icon;
    const iconElement = document.getElementById('weather-main-icon');
    if (WEATHER_ICONS[iconCode]) {
        iconElement.className = WEATHER_ICONS[iconCode];
    }
    
    // Uppdatera väderstatistik
    document.getElementById('wind-speed').textContent = `${Math.round(data.wind.speed)} m/s`;
    document.getElementById('humidity').textContent = `${data.main.humidity}%`;
    document.getElementById('pressure').textContent = `${data.main.pressure} hPa`;
    document.getElementById('visibility').textContent = data.visibility ? `${Math.round(data.visibility / 1000)} km` : 'N/A';
    
    // Uppdatera soltider
    const sunrise = new Date(data.sys.sunrise * 1000);
    const sunset = new Date(data.sys.sunset * 1000);
    
    document.getElementById('sunrise-time').textContent = 
        `${String(sunrise.getHours()).padStart(2, '0')}:${String(sunrise.getMinutes()).padStart(2, '0')}`;
    
    document.getElementById('sunset-time').textContent = 
        `${String(sunset.getHours()).padStart(2, '0')}:${String(sunset.getMinutes()).padStart(2, '0')}`;
    
    // Uppdatera statistik
    document.getElementById('temp-max').textContent = `${Math.round(data.main.temp_max)}°`;
    document.getElementById('temp-min').textContent = `${Math.round(data.main.temp_min)}°`;
    document.getElementById('wind-gust').textContent = data.wind.gust ? `${Math.round(data.wind.gust)} m/s` : 'N/A';
    
    // Uppdatera bakgrund baserat på väder
    updateWeatherBackground(data.weather[0].main);
    
    // Uppdatera solposition nu
    updateSunPosition(new Date());
}

// Funktion för att uppdatera prognos
function updateForecast(data) {
    if (!data || !data.list) return;
    
    forecastData = data;
    const forecastDays = document.getElementById('forecast-days');
    forecastDays.innerHTML = '';
    
    // Gruppera prognos per dag
    const dailyForecasts = {};
    data.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dateKey = date.toISOString().split('T')[0];
        
        if (!dailyForecasts[dateKey]) {
            dailyForecasts[dateKey] = [];
        }
        
        dailyForecasts[dateKey].push(item);
    });
    
    // Skapa prognos för nästa 5 dagar
    const forecastDates = Object.keys(dailyForecasts).sort();
    const next5Days = forecastDates.slice(1, 6); // Hoppa över idag
    
    next5Days.forEach(dateKey => {
        const dayForecasts = dailyForecasts[dateKey];
        const date = new Date(dateKey);
        
        // Hitta mittpunkten för dagen (kl 12)
        const middayForecast = dayForecasts.find(item => {
            const hour = new Date(item.dt * 1000).getHours();
            return hour >= 11 && hour <= 13;
        }) || dayForecasts[Math.floor(dayForecasts.length / 2)];
        
        // Beräkna medeltemperatur
        const avgTemp = Math.round(
            dayForecasts.reduce((sum, item) => sum + item.main.temp, 0) / dayForecasts.length
        );
        
        // Skapa prognoselement
        const forecastElement = document.createElement('div');
        forecastElement.className = 'forecast-day fade-in';
        
        const dayName = date.toLocaleDateString('sv-SE', { weekday: 'short' });
        const dayDate = date.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
        const condition = translateWeatherDescription(middayForecast.weather[0].description);
        const iconCode = middayForecast.weather[0].icon;
        const iconClass = WEATHER_ICONS[iconCode] || 'fas fa-cloud';
        
        forecastElement.innerHTML = `
            <div class="day-name">${dayName.toUpperCase()}</div>
            <div class="day-date">${dayDate}</div>
            <div class="day-icon"><i class="${iconClass}"></i></div>
            <div class="day-temp">${avgTemp}°</div>
            <div class="day-condition">${condition}</div>
            <div class="day-details">
                <div class="detail">
                    <i class="fas fa-temperature-low"></i>
                    <span>${Math.round(middayForecast.main.feels_like)}°</span>
                </div>
                <div class="detail">
                    <i class="fas fa-wind"></i>
                    <span>${Math.round(middayForecast.wind.speed)} m/s</span>
                </div>
                <div class="detail">
                    <i class="fas fa-tint"></i>
                    <span>${middayForecast.main.humidity}%</span>
                </div>
            </div>
        `;
        
        forecastDays.appendChild(forecastElement);
    });
}

// Funktion för att uppdatera luftkvalitet (simulerad - OpenWeatherMap kräver annat API)
function updateAirQuality() {
    // Simulerad luftkvalitetsdata
    const aqi = Math.floor(Math.random() * 50) + 1; // 1-50 bra kvalitet
    const pm25 = (Math.random() * 10).toFixed(1);
    const pm10 = (Math.random() * 20).toFixed(1);
    const ozone = Math.floor(Math.random() * 60) + 20;
    
    document.getElementById('aqi-value').textContent = aqi;
    document.getElementById('pm25').textContent = `${pm25} µg/m³`;
    document.getElementById('pm10').textContent = `${pm10} µg/m³`;
    document.getElementById('ozone').textContent = ozone;
    
    let aqiDescription = '';
    if (aqi <= 50) {
        aqiDescription = 'Utmärkt luftkvalitet. Perfekt för utomhusaktiviteter.';
    } else if (aqi <= 100) {
        aqiDescription = 'God luftkvalitet. Normal för Trollhättan.';
    } else if (aqi <= 150) {
        aqiDescription = 'Något försämrad kvalitet. Känsliga personer bör vara försiktiga.';
    } else {
        aqiDescription = 'Dålig luftkvalitet. Begränsa utomhusvistelse.';
    }
    
    document.getElementById('aqi-description').textContent = aqiDescription;
}

// Funktion för att visa felmeddelande
function showError(message) {
    const briefCondition = document.getElementById('brief-condition');
    briefCondition.textContent = 'Kunde inte hämta väder';
    briefCondition.style.color = 'var(--accent-red)';
    
    console.error('Väder Dashboard Fel:', message);
}

// Funktion för att uppdatera senast uppdaterad tid
function updateLastUpdatedTime() {
    const now = new Date();
    lastUpdateTime = now;
    
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    document.getElementById('last-updated-time').textContent = `${hours}:${minutes}`;
}

// Huvuduppdateringsfunktion
async function updateWeatherDashboard() {
    try {
        // Visa laddningsindikator
        const refreshBtn = document.getElementById('refresh-btn');
        refreshBtn.classList.add('spin');
        
        const data = await fetchWeatherData();
        
        if (data) {
            updateCurrentWeather(data.current);
            updateForecast(data.forecast);
            updateAirQuality();
            updateLastUpdatedTime();
        }
        
        // Dölj laddningsindikator
        refreshBtn.classList.remove('spin');
    } catch (error) {
        console.error('Fel vid uppdatering:', error);
        showError('Uppdatering misslyckades');
        
        const refreshBtn = document.getElementById('refresh-btn');
        refreshBtn.classList.remove('spin');
    }
}

// Funktion för att initiera dashboarden
async function initDashboard() {
    // Starta klockan
    updateClock();
    setInterval(updateClock, 1000);
    
    // Lägg till event listeners
    document.getElementById('refresh-btn').addEventListener('click', updateWeatherDashboard);
    
    // Hantera forecast navigation
    const forecastContainer = document.querySelector('.forecast-container');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    
    if (prevBtn && nextBtn) {
        prevBtn.addEventListener('click', () => {
            forecastContainer.scrollBy({ left: -200, behavior: 'smooth' });
        });
        
        nextBtn.addEventListener('click', () => {
            forecastContainer.scrollBy({ left: 200, behavior: 'smooth' });
        });
    }
    
    // Touch/swipe support för mobil
    let touchStartX = 0;
    let touchEndX = 0;
    
    forecastContainer?.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    });
    
    forecastContainer?.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });
    
    function handleSwipe() {
        const threshold = 50;
        const diff = touchStartX - touchEndX;
        
        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                forecastContainer.scrollBy({ left: 200, behavior: 'smooth' });
            } else {
                forecastContainer.scrollBy({ left: -200, behavior: 'smooth' });
            }
        }
    }
    
    // Initial uppdatering
    await updateWeatherDashboard();
    
    // Sätt upp automatisk uppdatering
    setInterval(updateWeatherDashboard, CONFIG.updateInterval);
}

// Starta dashboarden när sidan laddas
document.addEventListener('DOMContentLoaded', initDashboard);

// Exponera uppdateringsfunktionen globalt för manuella uppdateringar
window.updateWeatherDashboard = updateWeatherDashboard;