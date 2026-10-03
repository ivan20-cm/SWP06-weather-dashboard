// ===== 基本設定 =====
// 高雄市中心附近座標
const KAOHSIUNG = {
  latitude: 22.6273,
  longitude: 120.3014,
};

// Open-Meteo 不需要 API Key，適合直接部署在 GitHub Pages。
const API_URL = new URL("https://api.open-meteo.com/v1/forecast");
API_URL.search = new URLSearchParams({
  latitude: KAOHSIUNG.latitude,
  longitude: KAOHSIUNG.longitude,
  current: [
    "temperature_2m",
    "apparent_temperature",
    "relative_humidity_2m",
    "wind_speed_10m",
    "weather_code",
  ].join(","),
  daily: [
    "weather_code",
    "temperature_2m_max",
    "temperature_2m_min",
  ].join(","),
  timezone: "Asia/Taipei",
  forecast_days: "7",
}).toString();

// ===== DOM 元素 =====
const statusPanel = document.querySelector("#statusPanel");
const statusMessage = document.querySelector("#statusMessage");
const retryButton = document.querySelector("#retryButton");
const dashboardContent = document.querySelector("#dashboardContent");

const currentTemperature = document.querySelector("#currentTemperature");
const apparentTemperature = document.querySelector("#apparentTemperature");
const relativeHumidity = document.querySelector("#relativeHumidity");
const windSpeed = document.querySelector("#windSpeed");
const currentWeatherText = document.querySelector("#currentWeatherText");
const currentWeatherIcon = document.querySelector("#currentWeatherIcon");
const weatherTime = document.querySelector("#weatherTime");
const pageUpdatedAt = document.querySelector("#pageUpdatedAt");
const forecastGrid = document.querySelector("#forecastGrid");
const chartCanvas = document.querySelector("#temperatureChart");

// 儲存圖表資料，讓視窗尺寸改變時可以重新繪製。
let chartData = null;
let resizeTimer = null;

// ===== WMO 天氣代碼對照 =====
// Open-Meteo 的 weather_code 採 WMO Weather Interpretation Codes。
function getWeatherInfo(code) {
  const weatherMap = {
    0: { text: "晴朗", icon: "☀️" },
    1: { text: "大致晴朗", icon: "🌤️" },
    2: { text: "局部多雲", icon: "⛅" },
    3: { text: "陰天", icon: "☁️" },
    45: { text: "有霧", icon: "🌫️" },
    48: { text: "霧凇", icon: "🌫️" },
    51: { text: "小毛毛雨", icon: "🌦️" },
    53: { text: "中度毛毛雨", icon: "🌦️" },
    55: { text: "強毛毛雨", icon: "🌧️" },
    56: { text: "輕微凍毛毛雨", icon: "🌧️" },
    57: { text: "強凍毛毛雨", icon: "🌧️" },
    61: { text: "小雨", icon: "🌦️" },
    63: { text: "中雨", icon: "🌧️" },
    65: { text: "大雨", icon: "🌧️" },
    66: { text: "輕微凍雨", icon: "🌧️" },
    67: { text: "強凍雨", icon: "🌧️" },
    71: { text: "小雪", icon: "🌨️" },
    73: { text: "中雪", icon: "🌨️" },
    75: { text: "大雪", icon: "❄️" },
    77: { text: "雪粒", icon: "❄️" },
    80: { text: "局部陣雨", icon: "🌦️" },
    81: { text: "中度陣雨", icon: "🌧️" },
    82: { text: "強烈陣雨", icon: "⛈️" },
    85: { text: "小陣雪", icon: "🌨️" },
    86: { text: "大陣雪", icon: "🌨️" },
    95: { text: "雷雨", icon: "⛈️" },
    96: { text: "雷雨伴隨小冰雹", icon: "⛈️" },
    97: { text: "強雷雨", icon: "⛈️" },
    99: { text: "雷雨伴隨大冰雹", icon: "⛈️" },
  };

  return weatherMap[code] ?? { text: "未知天氣", icon: "❔" };
}

// ===== 狀態畫面 =====
function showLoading() {
  statusPanel.hidden = false;
  statusPanel.classList.remove("is-error");
  statusMessage.textContent = "正在取得天氣資料...";
  retryButton.hidden = true;
  dashboardContent.hidden = true;
}

function showError(message) {
  statusPanel.hidden = false;
  statusPanel.classList.add("is-error");
  statusMessage.textContent = message;
  retryButton.hidden = false;
  dashboardContent.hidden = true;
}

function showDashboard() {
  statusPanel.hidden = true;
  dashboardContent.hidden = false;
}

// ===== 資料處理 =====
function validateWeatherData(data) {
  const hasCurrent =
    data?.current &&
    Number.isFinite(data.current.temperature_2m) &&
    Number.isFinite(data.current.apparent_temperature) &&
    Number.isFinite(data.current.relative_humidity_2m) &&
    Number.isFinite(data.current.wind_speed_10m);

  const daily = data?.daily;
  const hasDaily =
    Array.isArray(daily?.time) &&
    daily.time.length >= 7 &&
    Array.isArray(daily?.temperature_2m_max) &&
    Array.isArray(daily?.temperature_2m_min) &&
    Array.isArray(daily?.weather_code);

  if (!hasCurrent || !hasDaily) {
    throw new Error("API 回傳資料格式不完整");
  }
}

function renderCurrentWeather(data) {
  const current = data.current;
  const weather = getWeatherInfo(current.weather_code);

  currentTemperature.textContent = Math.round(current.temperature_2m);
  apparentTemperature.textContent = Math.round(current.apparent_temperature);
  relativeHumidity.textContent = Math.round(current.relative_humidity_2m);
  windSpeed.textContent = Number(current.wind_speed_10m).toFixed(1);
  currentWeatherText.textContent = weather.text;
  currentWeatherIcon.textContent = weather.icon;

  const readableTime = current.time ? current.time.replace("T", " ") : "--";
  weatherTime.textContent = `觀測／預報時間：${readableTime}（Asia/Taipei）`;
}

function renderForecast(daily) {
  forecastGrid.innerHTML = "";

  daily.time.slice(0, 7).forEach((dateString, index) => {
    const date = new Date(`${dateString}T00:00:00`);
    const weather = getWeatherInfo(daily.weather_code[index]);
    const dayText = index === 0
      ? "今天"
      : new Intl.DateTimeFormat("zh-TW", { weekday: "short" }).format(date);
    const dateText = new Intl.DateTimeFormat("zh-TW", {
      month: "numeric",
      day: "numeric",
    }).format(date);

    const card = document.createElement("article");
    card.className = `forecast-card${index === 0 ? " today" : ""}`;
    card.innerHTML = `
      <p class="forecast-day">${dayText}</p>
      <p class="forecast-date">${dateText}</p>
      <span class="forecast-icon" aria-hidden="true">${weather.icon}</span>
      <p class="forecast-condition">${weather.text}</p>
      <p class="forecast-temp" aria-label="最高溫 ${Math.round(daily.temperature_2m_max[index])} 度，最低溫 ${Math.round(daily.temperature_2m_min[index])} 度">
        <span class="temp-high">${Math.round(daily.temperature_2m_max[index])}°</span>
        <span class="temp-low">${Math.round(daily.temperature_2m_min[index])}°</span>
      </p>
    `;

    forecastGrid.appendChild(card);
  });
}

function updatePageTime() {
  const now = new Date();
  const formatted = new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(now);

  pageUpdatedAt.textContent = `頁面更新時間：${formatted}`;
}

// ===== Canvas 折線圖 =====
function drawTemperatureChart(daily) {
  const ctx = chartCanvas.getContext("2d");
  const rect = chartCanvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  chartCanvas.width = Math.max(1, Math.floor(rect.width * dpr));
  chartCanvas.height = Math.max(1, Math.floor(rect.height * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const width = rect.width;
  const height = rect.height;
  const padding = { top: 26, right: 18, bottom: 50, left: 46 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const highTemps = daily.temperature_2m_max.slice(0, 7).map(Number);
  const lowTemps = daily.temperature_2m_min.slice(0, 7).map(Number);
  const allTemps = [...highTemps, ...lowTemps];
  const minTemp = Math.floor(Math.min(...allTemps) - 2);
  const maxTemp = Math.ceil(Math.max(...allTemps) + 2);
  const range = Math.max(1, maxTemp - minTemp);

  ctx.clearRect(0, 0, width, height);
  ctx.font = "12px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.lineWidth = 1;

  // 水平格線與 Y 軸溫度標示
  const gridCount = 4;
  for (let i = 0; i <= gridCount; i += 1) {
    const y = padding.top + (plotHeight / gridCount) * i;
    const value = maxTemp - (range / gridCount) * i;

    ctx.strokeStyle = "#dfe9f1";
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();

    ctx.fillStyle = "#7890a4";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(`${Math.round(value)}°`, padding.left - 9, y);
  }

  const pointsFor = (values) =>
    values.map((temp, index) => {
      const x = padding.left + (plotWidth / (values.length - 1)) * index;
      const y = padding.top + ((maxTemp - temp) / range) * plotHeight;
      return { x, y, temp };
    });

  const highPoints = pointsFor(highTemps);
  const lowPoints = pointsFor(lowTemps);

  function drawLine(points, strokeStyle) {
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = 3;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    points.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();

    points.forEach((point) => {
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = strokeStyle;
      ctx.font = "700 12px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(`${Math.round(point.temp)}°`, point.x, point.y - 9);
    });
  }

  drawLine(highPoints, "#d96b27");
  drawLine(lowPoints, "#2878c8");

  // X 軸日期標示
  daily.time.slice(0, 7).forEach((dateString, index) => {
    const date = new Date(`${dateString}T00:00:00`);
    const x = padding.left + (plotWidth / 6) * index;
    const label = new Intl.DateTimeFormat("zh-TW", {
      month: "numeric",
      day: "numeric",
    }).format(date);

    ctx.fillStyle = "#6a8094";
    ctx.font = "12px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(label, x, height - padding.bottom + 18);
  });
}

// ===== API 請求 =====
async function loadWeather() {
  showLoading();

  // 避免網路異常時長時間卡在載入狀態，12 秒後自動中止。
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(API_URL, {
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    validateWeatherData(data);

    renderCurrentWeather(data);
    renderForecast(data.daily);
    chartData = data.daily;
    updatePageTime();
    showDashboard();

    // dashboard 原本是 hidden，必須顯示後再量測 Canvas 尺寸。
    requestAnimationFrame(() => drawTemperatureChart(chartData));
  } catch (error) {
    console.error("取得天氣資料失敗：", error);

    const message = error.name === "AbortError"
      ? "取得天氣資料逾時，請檢查網路後再試一次。"
      : "目前無法取得天氣資料，請稍後再試。";

    showError(message);
  } finally {
    clearTimeout(timeoutId);
  }
}

retryButton.addEventListener("click", loadWeather);

window.addEventListener("resize", () => {
  if (!chartData) return;

  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    drawTemperatureChart(chartData);
  }, 120);
});

// 網頁載入後立即取得天氣資料。
loadWeather();
