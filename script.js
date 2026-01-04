// ====== KONFIGURATION ======
const CONFIG = {
  city: 'Trollhättan',
  country: 'SE',
  apiKey: '073b784fec004c9e4c9d07dfaac9d689',
  updateInterval: 300000, // 5 minuter
  language: 'sv',
  useLocalBackgrounds: false // Sätt till true om du har laddat ner bilder
};

// Svensk översättning av väderförhållanden
const WEATHER_TRANSLATIONS = {
  'clear sky': 'Klart himmel',
  'few clouds': 'Nästan klart',
  'scattered clouds': 'Spridda moln',
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

// Ikonmappning för väderförhållanden
const WEATHER_ICONS = {
  'clear sky': 'fas fa-sun',
  'few clouds': 'fas fa-cloud-sun',
  'scattered clouds': 'fas fa-cloud',
  'broken clouds': 'fas fa-cloud',
  'overcast clouds': 'fas fa-cloud',
  'mist': 'fas fa-smog',
  'fog': 'fas fa-smog',
  'light rain': 'fas fa-cloud-rain',
  'moderate rain': 'fas fa-cloud-showers-heavy',
  'heavy rain': 'fas fa-cloud-showers-heavy',
  'light snow': 'fas fa-snowflake',
  'snow': 'fas fa-snowflake',
  'heavy snow': 'fas fa-snowflake',
  'thunderstorm': 'fas fa-bolt',
  'default': 'fas fa-cloud'
};

// ====== SÄSONGSDETEKTERING ======
function getCurrentSeason() {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  
  if (month >= 12 || month <= 2) return 'winter'; // Dec-Feb
  if (month >= 3 && month <= 5) return 'spring';  // Mar-May
  if (month >= 6 && month <= 8) return 'summer';  // Jun-Aug
  return 'autumn'; // Sep-Nov
}

function applySeasonalTheme() {
  const season = getCurrentSeason();
  const bgContainer = document.getElementById('seasonal-background');
  
  // Ta bort alla säsongsklasser
  bgContainer.classList.remove('winter', 'spring', 'summer', 'autumn');
  
  // Lägg till aktuell säsongsklass
  bgContainer.classList.add(season);
  
  // Om du har laddat ner bilderna till assets-mappen
  if (CONFIG.useLocalBackgrounds) {
    // bgContainer.style.backgroundImage = `url('assets/${season}-bg.jpg')`;
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
  
  // Formatera till "IDAG · 3 JANUARI 2026"
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

function getWeatherIcon(description) {
  const desc = description.toLowerCase();
  for (const [key, iconClass] of Object.entries(WEATHER_ICONS)) {
    if (desc.includes(key)) {
      return iconClass;
    }
  }
  return WEATHER_ICONS.default;
}

// Beräkna solposition baserat på tid på dagen
function updateSunPosition() {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const totalMinutes = currentHour * 60 + currentMinute;
  
  // Antag: soluppgång 8:00 (480 min), solnedgång 16:00 (960 min)
  const sunriseMinutes = 8 * 60; // 08:00
  const sunsetMinutes = 16 * 60; // 16:00
  const totalDaylight = sunsetMinutes - sunriseMinutes;
  
  let sunPosition = 0;
  if (totalMinutes >= sunriseMinutes && totalMinutes <= sunsetMinutes) {
    sunPosition = ((totalMinutes - sunriseMinutes) / totalDaylight) * 100;
  } else if (totalMinutes < sunriseMinutes) {
    sunPosition = 0;
  } else {
    sunPosition = 100;
  }
  
  // Begränsa mellan 5% och 95% för att hålla solen på vägen
  sunPosition = Math.max(5, Math.min(95, sunPosition));
  
  const sunElement = document.getElementById('sun-position');
  if (sunElement) {
    sunElement.style.left = `${sunPosition}%`;
  }
}

// Beräkna dagljuslängd
function calculateDaylightDuration(sunrise, sunset) {
  const sunriseDate = new Date(sunrise * 1000);
  const sunsetDate = new Date(sunset * 1000);
  
  const diffMs = sunsetDate - sunriseDate;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${diffHours}h ${diffMinutes}m`;
}

async function fetchWeatherData() {
  const currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${CONFIG.city},${CONFIG.country}&appid=${CONFIG.apiKey}&units=metric&lang=${CONFIG.language}`;
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${CONFIG.city},${CONFIG.country}&appid=${CONFIG.apiKey}&units=metric&lang=${CONFIG.language}`;
  
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
    // Visa felmeddelande
    showErrorState('Kunde inte hämta väderdata. Kontrollera internetanslutning.');
    throw error;
  }
}

function showErrorState(message) {
  const forecastContainer = document.getElementById('forecast-cards');
  forecastContainer.innerHTML = `
    <div class="error-state" style="grid-column: 1 / -1; padding: 2rem;">
      <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
      <h3>Kunde inte hämta väderdata</h3>
      <p>${message}</p>
      <button onclick="updateWeather()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: var(--accent-teal); color: white; border: none; border-radius: 8px; cursor: pointer;">
        <i class="fas fa-redo"></i> Försök igen
      </button>
    </div>
  `;
}

function updateCurrentWeather(data) {
  const temp = Math.round(data.main.temp);
  const feelsLike = Math.round(data.main.feels_like);
  const description = translateWeather(data.weather[0].description);
  const humidity = data.main.humidity;
  const windSpeed = Math.round(data.wind.speed);
  const pressure = data.main.pressure;
  const cloudiness = data.clouds.all;
  const sunrise = data.sys.sunrise;
  const sunset = data.sys.sunset;
  
  // Uppdatera DOM
  document.getElementById('current-temp').textContent = `${temp}°`;
  document.getElementById('feels-temp').textContent = `${feelsLike}°`;
  document.getElementById('weather-condition').textContent = description;
  document.getElementById('wind-speed').textContent = `${windSpeed} m/s`;
  document.getElementById('humidity').textContent = `${humidity}%`;
  document.getElementById('cloudiness').textContent = `${cloudiness}%`;
  document.getElementById('pressure').textContent = `${pressure} hPa`;
  
  // Formatera och visa soltider
  const sunriseDate = new Date(sunrise * 1000);
  const sunsetDate = new Date(sunset * 1000);
  
  document.getElementById('sunrise-time').textContent = 
    `${String(sunriseDate.getHours()).padStart(2, '0')}:${String(sunriseDate.getMinutes()).padStart(2, '0')}`;
  document.getElementById('sunset-time').textContent = 
    `${String(sunsetDate.getHours()).padStart(2, '0')}:${String(sunsetDate.getMinutes()).padStart(2, '0')}`;
  
  // Beräkna och visa dagljuslängd
  const daylightDuration = calculateDaylightDuration(sunrise, sunset);
  const nightDuration = calculateDaylightDuration(sunset, sunrise + 86400); // +24h
  
  document.getElementById('daylight-duration').textContent = `Dag ljus: ${daylightDuration}`;
  document.getElementById('night-duration').textContent = `Natt: ${nightDuration}`;
  
  // Uppdatera progress bars
  document.getElementById('humidity-fill').style.width = `${humidity}%`;
  document.getElementById('cloudiness-fill').style.width = `${cloudiness}%`;
  
  // Uppdatera ikon baserat på väder
  const weatherIcon = document.querySelector('.condition-icon i');
  const iconClass = getWeatherIcon(data.weather[0].description);
  weatherIcon.className = iconClass;
  
  // Uppdatera solposition
  updateSunPosition();
}

function updateForecast(data) {
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
  
  // Skapa en array med dagliga sammanfattningar (5 dagar)
  const forecastDays = Object.values(dailyForecasts)
    .sort((a, b) => a.date - b.date)
    .slice(1, 6); // Hoppa över idag, ta nästa 5 dagar
  
  const cardsContainer = document.getElementById('forecast-cards');
  
  // Generera kort för varje dag
  const cardsHTML = forecastDays.map(day => {
    // Ta medeldagstemperaturen och hitta mittpunkten för dagen
    const avgTemp = Math.round(
      day.items.reduce((sum, item) => sum + item.main.temp, 0) / day.items.length
    );
    
    // Hitta föremiddagsprognosen (mellan 10-14)
    const middayItem = day.items.find(item => {
      const hour = new Date(item.dt * 1000).getHours();
      return hour >= 10 && hour <= 14;
    }) || day.items[Math.floor(day.items.length / 2)];
    
    const dayName = day.date.toLocaleDateString('sv-SE', { weekday: 'short' });
    const dateStr = day.date.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
    const condition = translateWeather(middayItem.weather[0].description);
    const iconClass = getWeatherIcon(middayItem.weather[0].description);
    const feelsLike = Math.round(middayItem.main.feels_like);
    const humidity = middayItem.main.humidity;
    const windSpeed = Math.round(middayItem.wind.speed);
    
    return `
      <div class="forecast-card">
        <div class="forecast-day">${dayName.charAt(0).toUpperCase() + dayName.slice(1)}</div>
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
            <span class="detail-value">${windSpeed} m/s</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  cardsContainer.innerHTML = cardsHTML;
}

async function updateWeather() {
  try {
    const syncIcon = document.getElementById('sync-icon');
    syncIcon.classList.add('fa-spin');
    
    const weatherData = await fetchWeatherData();
    updateCurrentWeather(weatherData.current);
    updateForecast(weatherData.forecast);
    
    // Uppdatera timestamp för senast uppdaterad
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    document.getElementById('last-updated').textContent = timeStr;
    
    // Lägg till en liten animation vid uppdatering
    syncIcon.classList.remove('fa-spin');
    syncIcon.style.animation = 'none';
    setTimeout(() => {
      syncIcon.style.animation = 'spin 4s linear infinite';
    }, 10);
    
  } catch (error) {
    console.error('Kunde inte uppdatera väder:', error);
    // Återställ ikon
    document.getElementById('sync-icon').classList.remove('fa-spin');
  }
}

// ====== INITIERING ======
function init() {
  // Applicera säsongstema
  applySeasonalTheme();
  
  // Uppdatera tid och datum
  updateTime();
  updateDate();
  
  // Uppdatera solposition
  updateSunPosition();
  
  // Uppdatera väder
  updateWeather();
  
  // Sätt uppdateringsintervall
  setInterval(updateTime, 1000);
  setInterval(updateWeather, CONFIG.updateInterval);
  setInterval(updateSunPosition, 60000); // Uppdatera solposition varje minut
  
  // Uppdatera datum varje minut (för dagbyte)
  setInterval(updateDate, 60000);
  
  // Uppdatera säsongstema varje timme
  setInterval(applySeasonalTheme, 3600000);
}

// Starta dashboarden när sidan laddas
document.addEventListener('DOMContentLoaded', init);

// Lägg till tangentbordssnabbkommando för att uppdatera manuellt (U)
document.addEventListener('keydown', (e) => {
  if (e.key === 'u' || e.key === 'U') {
    updateWeather();
    // Visa bekräftelse
    const title = document.querySelector('.section-header h2');
    const originalText = title.textContent;
    title.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Uppdaterar...';
    setTimeout(() => {
      title.innerHTML = originalText;
    }, 1500);
  }
});

// Lägg till hover-effekter för kort
document.addEventListener('DOMContentLoaded', () => {
  const cards = document.querySelectorAll('.detail-card, .forecast-card');
  cards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.zIndex = '10';
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.zIndex = '1';
    });
  });
});

// Offline detection
window.addEventListener('offline', () => {
  showErrorState('Du är offline. Väderdata kommer att uppdateras när du är online igen.');
});

window.addEventListener('online', () => {
  updateWeather();
});