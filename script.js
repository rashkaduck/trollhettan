// ====== KONFIGURATION ======
const CONFIG = {
  city: 'Trollhättan',
  country: 'SE',
  apiKey: '073b784fec004c9e4c9d07dfaac9d689',
  updateInterval: 300000, // 5 minuter
  language: 'sv',
  units: 'metric'
};

// Svensk översättning av väderförhållanden
const WEATHER_TRANSLATIONS = {
  'clear sky': 'Klart himmel',
  'few clouds': 'Lätt molnig',
  'scattered clouds': 'Växlande molnig',
  'broken clouds': 'Mulet',
  'overcast clouds': 'Mulet',
  'mist': 'Dimma',
  'fog': 'Tät dimma',
  'light rain': 'Lätt regn',
  'moderate rain': 'Regn',
  'heavy rain': 'Kraftigt regn',
  'light snow': 'Lätt snöfall',
  'snow': 'Snöfall',
  'heavy snow': 'Kraftigt snöfall',
  'light shower': 'Lätt skur',
  'shower': 'Skur',
  'heavy shower': 'Kraftig skur',
  'thunderstorm': 'Åska',
  'haze': 'Disigt',
  'dust': 'Dammigt',
  'smoke': 'Rökigt',
  'sand': 'Sandstorm'
};

// Ikonmappning
const WEATHER_ICONS = {
  'clear': 'fas fa-sun',
  'clouds': 'fas fa-cloud',
  'rain': 'fas fa-cloud-rain',
  'snow': 'fas fa-snowflake',
  'thunderstorm': 'fas fa-bolt',
  'drizzle': 'fas fa-cloud-rain',
  'mist': 'fas fa-smog',
  'smoke': 'fas fa-smog',
  'haze': 'fas fa-smog',
  'dust': 'fas fa-smog',
  'fog': 'fas fa-smog',
  'sand': 'fas fa-wind',
  'ash': 'fas fa-volcano',
  'squall': 'fas fa-wind',
  'tornado': 'fas fa-tornado'
};

// ====== GLOBALA VARIABLER ======
let currentWeatherData = null;
let forecastData = null;

// ====== HANTERA RESPONSIVITET ======
function getCurrentBreakpoint() {
  const width = window.innerWidth;
  
  if (width < 375) return 'xs';
  if (width < 768) return 'sm';
  if (width < 1024) return 'md';
  if (width < 1280) return 'lg';
  if (width < 1440) return 'xl';
  if (width < 1920) return '2xl';
  if (width < 2560) return '3xl';
  return '4xl';
}

function updateResponsiveLayout() {
  const breakpoint = getCurrentBreakpoint();
  
  // Justera layout baserat på breakpoint
  switch(breakpoint) {
    case 'xs':
    case 'sm':
      document.body.classList.add('mobile-view');
      document.body.classList.remove('tablet-view', 'desktop-view');
      break;
    case 'md':
      document.body.classList.add('tablet-view');
      document.body.classList.remove('mobile-view', 'desktop-view');
      break;
    default:
      document.body.classList.add('desktop-view');
      document.body.classList.remove('mobile-view', 'tablet-view');
  }
  
  // Uppdatera solposition för aktuell skärmstorlek
  if (currentWeatherData) {
    updateSunPosition(currentWeatherData);
  }
}

// ====== TID OCH DATUM ======
function updateTime() {
  const timeEl = document.getElementById('time');
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  timeEl.textContent = `${hours}:${minutes}:${seconds}`;
}

function updateDate() {
  const dateEl = document.getElementById('date');
  const now = new Date();
  const day = now.toLocaleDateString('sv-SE', { weekday: 'long' });
  const date = now.getDate();
  const month = now.toLocaleDateString('sv-SE', { month: 'long' });
  const year = now.getFullYear();
  
  // Formatera datum
  dateEl.textContent = `IDAG · ${date} ${month.toUpperCase()} ${year}`;
}

// ====== VÄDERDATA ======
function translateWeather(description) {
  const desc = description.toLowerCase();
  for (const [key, value] of Object.entries(WEATHER_TRANSLATIONS)) {
    if (desc.includes(key)) {
      return value;
    }
  }
  return description.charAt(0).toUpperCase() + description.slice(1);
}

function getWeatherIcon(weatherMain) {
  return WEATHER_ICONS[weatherMain.toLowerCase()] || WEATHER_ICONS.clouds;
}

async function fetchWeatherData() {
  const currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${CONFIG.city},${CONFIG.country}&appid=${CONFIG.apiKey}&units=${CONFIG.units}&lang=${CONFIG.language}`;
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${CONFIG.city},${CONFIG.country}&appid=${CONFIG.apiKey}&units=${CONFIG.units}&lang=${CONFIG.language}`;
  
  try {
    const [currentResponse, forecastResponse] = await Promise.all([
      fetch(currentUrl),
      fetch(forecastUrl)
    ]);
    
    if (!currentResponse.ok || !forecastResponse.ok) {
      throw new Error(`API Error: ${currentResponse.status}`);
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

function updateSunPosition(weatherData) {
  if (!weatherData || !weatherData.sys) return;
  
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes(); // Minuter sedan midnatt
  const sunrise = new Date(weatherData.sys.sunrise * 1000);
  const sunset = new Date(weatherData.sys.sunset * 1000);
  
  const sunriseMinutes = sunrise.getHours() * 60 + sunrise.getMinutes();
  const sunsetMinutes = sunset.getHours() * 60 + sunset.getMinutes();
  
  // Beräkna solposition (0-100%)
  let position = 0;
  if (currentTime >= sunriseMinutes && currentTime <= sunsetMinutes) {
    const totalDaylight = sunsetMinutes - sunriseMinutes;
    const currentDaylight = currentTime - sunriseMinutes;
    position = (currentDaylight / totalDaylight) * 100;
  } else if (currentTime < sunriseMinutes) {
    position = 0;
  } else {
    position = 100;
  }
  
  // Begränsa position
  position = Math.max(5, Math.min(95, position));
  
  const sunElement = document.getElementById('sun-position');
  if (sunElement) {
    sunElement.style.left = `${position}%`;
    
    // Uppdatera "Nu" markören
    const marker = document.querySelector('.sun-marker.now');
    if (marker) {
      marker.style.left = `${position}%`;
    }
  }
  
  // Beräkna dagljuslängd
  const daylightHours = Math.floor((sunsetMinutes - sunriseMinutes) / 60);
  const daylightMinutes = (sunsetMinutes - sunriseMinutes) % 60;
  const nightHours = 24 - daylightHours;
  const nightMinutes = 60 - daylightMinutes;
  
  document.getElementById('daylight-duration').textContent = `${daylightHours}h ${daylightMinutes}m`;
  document.getElementById('night-duration').textContent = `${nightHours}h ${nightMinutes}m`;
}

function updateCurrentWeather(data) {
  if (!data) return;
  
  currentWeatherData = data;
  
  const temp = Math.round(data.main.temp);
  const feelsLike = Math.round(data.main.feels_like);
  const description = translateWeather(data.weather[0].description);
  const humidity = data.main.humidity;
  const windSpeed = Math.round(data.wind.speed * 3.6); // m/s till km/h
  const pressure = data.main.pressure;
  const visibility = data.visibility ? Math.round(data.visibility / 1000) : 10;
  const weatherMain = data.weather[0].main;
  
  // Uppdatera DOM
  document.getElementById('current-temp').textContent = temp;
  document.getElementById('feels-temp').textContent = `${feelsLike}°`;
  document.getElementById('weather-condition').textContent = description;
  document.getElementById('weather-description').textContent = `${description} i Trollhättan`;
  document.getElementById('wind-speed').textContent = windSpeed;
  document.getElementById('humidity').textContent = humidity;
  document.getElementById('pressure').textContent = pressure;
  document.getElementById('visibility').textContent = visibility;
  
  // Uppdatera ikon
  const weatherIcon = document.getElementById('weather-icon');
  weatherIcon.className = getWeatherIcon(weatherMain);
  
  // Uppdatera soltider
  const sunrise = new Date(data.sys.sunrise * 1000);
  const sunset = new Date(data.sys.sunset * 1000);
  
  document.getElementById('sunrise-time').textContent = 
    `${String(sunrise.getHours()).padStart(2, '0')}:${String(sunrise.getMinutes()).padStart(2, '0')}`;
  document.getElementById('sunset-time').textContent = 
    `${String(sunset.getHours()).padStart(2, '0')}:${String(sunset.getMinutes()).padStart(2, '0')}`;
  
  // Uppdatera solposition
  updateSunPosition(data);
}

function updateForecast(data) {
  if (!data || !data.list) return;
  
  forecastData = data;
  
  const forecasts = data.list;
  const dailyForecasts = {};
  
  // Gruppera prognoser per dag
  forecasts.forEach(item => {
    const date = new Date(item.dt * 1000);
    const dateKey = date.toISOString().split('T')[0];
    
    if (!dailyForecasts[dateKey]) {
      dailyForecasts[dateKey] = {
        items: [],
        date: date
      };
    }
    
    dailyForecasts[dateKey].items.push(item);
  });
  
  // Skapa array med 5 dagar
  const forecastDays = Object.values(dailyForecasts)
    .sort((a, b) => a.date - b.date)
    .slice(1, 6); // Hoppa över idag, ta nästa 5 dagar
  
  const cardsContainer = document.getElementById('forecast-cards');
  
  // Generera kort baserat på skärmstorlek
  const breakpoint = getCurrentBreakpoint();
  const cardsPerView = breakpoint === 'xs' ? 3 : breakpoint === 'sm' ? 4 : 5;
  
  const cardsHTML = forecastDays.slice(0, cardsPerView).map(day => {
    // Beräkna medeltemperatur
    const temps = day.items.map(item => item.main.temp);
    const avgTemp = Math.round(temps.reduce((a, b) => a + b) / temps.length);
    
    // Hitta middagsprognosen
    const middayItem = day.items.find(item => {
      const hour = new Date(item.dt * 1000).getHours();
      return hour >= 11 && hour <= 13;
    }) || day.items[Math.floor(day.items.length / 2)];
    
    const dayName = day.date.toLocaleDateString('sv-SE', { weekday: 'short' });
    const dateStr = day.date.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
    const condition = translateWeather(middayItem.weather[0].description);
    const iconClass = getWeatherIcon(middayItem.weather[0].main);
    const feelsLike = Math.round(middayItem.main.feels_like);
    const humidity = middayItem.main.humidity;
    const windSpeed = Math.round(middayItem.wind.speed * 3.6);
    
    return `
      <div class="forecast-card fade-in">
        <div class="forecast-day">${dayName.toUpperCase()}</div>
        <div class="forecast-date">${dateStr}</div>
        <div class="forecast-icon">
          <i class="${iconClass}"></i>
        </div>
        <div class="forecast-temp">${avgTemp}°</div>
        <div class="forecast-condition">${condition}</div>
        <div class="forecast-details">
          <div class="forecast-detail">
            <span class="detail-label">Känns som:</span>
            <span class="detail-value">${feelsLike}°</span>
          </div>
          <div class="forecast-detail">
            <span class="detail-label">Fuktighet:</span>
            <span class="detail-value">${humidity}%</span>
          </div>
          <div class="forecast-detail">
            <span class="detail-label">Vind:</span>
            <span class="detail-value">${windSpeed} km/h</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  cardsContainer.innerHTML = cardsHTML;
}

function showError(message) {
  const forecastContainer = document.getElementById('forecast-cards');
  forecastContainer.innerHTML = `
    <div class="error-state" style="grid-column: 1 / -1;">
      <i class="fas fa-exclamation-triangle"></i>
      <h3>${message}</h3>
      <button onclick="refreshWeather()" class="retry-btn">
        <i class="fas fa-redo"></i> Försök igen
      </button>
    </div>
  `;
}

async function refreshWeather() {
  const weatherData = await fetchWeatherData();
  if (weatherData) {
    updateCurrentWeather(weatherData.current);
    updateForecast(weatherData.forecast);
    updateLastUpdated();
  }
}

function updateLastUpdated() {
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  document.getElementById('last-updated').textContent = timeStr;
}

// ====== SÄSONGSDETEKTERING ======
function getCurrentSeason() {
  const now = new Date();
  const month = now.getMonth() + 1;
  
  if (month >= 12 || month <= 2) return 'winter';
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  return 'autumn';
}

function applySeasonalTheme() {
  const season = getCurrentSeason();
  const bgContainer = document.getElementById('seasonal-background');
  
  // Ta bort alla säsongsklasser
  bgContainer.classList.remove('winter', 'spring', 'summer', 'autumn');
  
  // Lägg till aktuell säsongsklass
  bgContainer.classList.add(season);
}

// ====== INITIERING ======
async function init() {
  // Applicera säsongstema
  applySeasonalTheme();
  
  // Uppdatera layout baserat på skärmstorlek
  updateResponsiveLayout();
  
  // Uppdatera tid och datum
  updateTime();
  updateDate();
  
  // Hämta väderdata
  const weatherData = await fetchWeatherData();
  if (weatherData) {
    updateCurrentWeather(weatherData.current);
    updateForecast(weatherData.forecast);
    updateLastUpdated();
  }
  
  // Sätt uppdateringsintervall
  setInterval(updateTime, 1000);
  setInterval(updateDate, 60000);
  setInterval(async () => {
    const weatherData = await fetchWeatherData();
    if (weatherData) {
      updateCurrentWeather(weatherData.current);
      updateForecast(weatherData.forecast);
      updateLastUpdated();
    }
  }, CONFIG.updateInterval);
  
  // Uppdatera layout vid fönsterstorleksändring
  window.addEventListener('resize', () => {
    updateResponsiveLayout();
    if (forecastData) {
      updateForecast(forecastData);
    }
  });
  
  // Uppdatera säsongstema varje timme
  setInterval(applySeasonalTheme, 3600000);
}

// ====== EVENT LISTENERS ======
document.addEventListener('DOMContentLoaded', init);

// Manuell uppdatering med knapp eller tangentbord
document.addEventListener('keydown', (e) => {
  if (e.key === 'u' || e.key === 'U') {
    refreshWeather();
  }
});

// Hantera forecast navigation
document.querySelector('.prev-btn')?.addEventListener('click', () => {
  const container = document.querySelector('.forecast-cards');
  container.scrollBy({ left: -300, behavior: 'smooth' });
});

document.querySelector('.next-btn')?.addEventListener('click', () => {
  const container = document.querySelector('.forecast-cards');
  container.scrollBy({ left: 300, behavior: 'smooth' });
});

// Touch/swipe support för mobil
let touchStartX = 0;
let touchEndX = 0;

document.querySelector('.forecast-cards')?.addEventListener('touchstart', (e) => {
  touchStartX = e.changedTouches[0].screenX;
});

document.querySelector('.forecast-cards')?.addEventListener('touchend', (e) => {
  touchEndX = e.changedTouches[0].screenX;
  handleSwipe();
});

function handleSwipe() {
  const threshold = 50;
  const diff = touchStartX - touchEndX;
  
  if (Math.abs(diff) > threshold) {
    if (diff > 0) {
      // Swipe vänster
      document.querySelector('.forecast-cards').scrollBy({ left: 300, behavior: 'smooth' });
    } else {
      // Swipe höger
      document.querySelector('.forecast-cards').scrollBy({ left: -300, behavior: 'smooth' });
    }
  }
}