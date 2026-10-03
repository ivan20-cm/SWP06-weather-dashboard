# SWP06 高雄天氣資訊看板

這是一個使用 **HTML、CSS、JavaScript** 製作的靜態資訊看板，透過 `fetch()` 串接 **Open-Meteo Weather API**，顯示高雄目前天氣與未來七日預報。

## 功能

- 高雄目前溫度
- 體感溫度
- 相對濕度
- 風速
- 天氣狀況（WMO weather code 轉換成中文文字與圖示）
- 未來七天天氣預報
- 每日最高溫與最低溫
- 七日最高／最低溫折線圖
- API 資料時間與頁面更新時間
- Loading 載入提示
- API 失敗與逾時錯誤提示
- 「重新載入」按鈕
- RWD 響應式版面，可在電腦、平板、手機閱讀
- 頁面明確標示資料來源 Open-Meteo

## 使用技術

- HTML5
- CSS3
- Vanilla JavaScript
- Fetch API
- HTML Canvas（自行繪製折線圖，沒有使用 React / Vue / Chart.js）
- Open-Meteo Weather API

## 專案結構

```text
SWP06-weather-dashboard/
├── index.html
├── style.css
├── script.js
└── README.md
```

## API

資料來源：Open-Meteo

官方網站：<https://open-meteo.com/>

本專案使用 Forecast API，主要取得：

```text
current:
- temperature_2m
- apparent_temperature
- relative_humidity_2m
- wind_speed_10m
- weather_code

daily:
- weather_code
- temperature_2m_max
- temperature_2m_min
```

地點設定為高雄市中心附近：

```text
Latitude: 22.6273
Longitude: 120.3014
Timezone: Asia/Taipei
```

Open-Meteo 免費使用且此專案不需要 API Key，因此不需要把任何私密金鑰放進 GitHub。

## 如何在本機查看

最簡單的方式是直接開啟 `index.html`。

如果瀏覽器對本機檔案的網路請求有限制，建議使用 VS Code 的 Live Server，或在資料夾內啟動簡單的本機伺服器。

例如有安裝 Python 時：

```bash
python3 -m http.server 8000
```

然後開啟：

```text
http://localhost:8000
```

## 部署到 GitHub Pages

### 1. 建立 GitHub Repository

1. 登入 GitHub。
2. 點右上角 `+` → `New repository`。
3. Repository 名稱可以設為 `SWP06-weather-dashboard`。
4. 選擇 Public。
5. 建立 repository。

### 2. 上傳檔案

將以下四個檔案放在 repository 的最外層：

```text
index.html
style.css
script.js
README.md
```

可直接在 GitHub repository 頁面選：

`Add file` → `Upload files`

上傳後按 `Commit changes`。

### 3. 開啟 GitHub Pages

1. 進入 repository。
2. 點 `Settings`。
3. 左側找到 `Pages`。
4. 在 **Build and deployment**：
   - Source：`Deploy from a branch`
   - Branch：`main`
   - Folder：`/ (root)`
5. 按 `Save`。
6. 等待 GitHub 完成部署。

部署完成後會得到類似：

```text
https://你的GitHub帳號.github.io/SWP06-weather-dashboard/
```

## SWP06 作業要求檢查

### 要求 1：至少串接一個 API 或開放資料集，並明確標示資料來源

符合。

- 使用 Open-Meteo Weather API。
- 網頁 footer 明確顯示「資料來源：Open-Meteo Weather API」。
- 附有官方網站連結。

### 要求 2：將資料轉換成適合閱讀的呈現方式

符合。

- 目前天氣使用卡片呈現。
- 未來七日預報使用 forecast cards。
- 最高／最低溫使用 Canvas 折線圖呈現。
- 加入天氣圖示、日期與中文狀況說明。

### 要求 3：處理載入中與請求失敗時的提示

符合。

- API 請求時顯示「正在取得天氣資料...」。
- 請求失敗時顯示「目前無法取得天氣資料，請稍後再試。」。
- 12 秒未完成時顯示逾時訊息。
- 提供「重新載入」按鈕。
- 不會留下空白頁面。

### 要求 4：部署成 GitHub Pages

符合部署條件。

- 專案只有 HTML、CSS、JavaScript。
- 不需要 Node.js、React、Vue 或後端伺服器。
- 不需要 API Key。
- 四個檔案直接放在 GitHub repository 根目錄即可部署。

## 課堂說明時可以這樣介紹

這個網站是一個高雄天氣資訊看板。我使用 JavaScript 的 `fetch()` 向 Open-Meteo API 請求高雄目前天氣與七日預報資料，再把 JSON 資料轉換成卡片和折線圖。API 還在載入時會顯示 loading 訊息，如果請求失敗或逾時，頁面會顯示錯誤訊息並提供重新載入按鈕，因此不會出現空白畫面。整個網站只使用 HTML、CSS 和 JavaScript，所以可以直接部署到 GitHub Pages。
