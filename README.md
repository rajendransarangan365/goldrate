# AURUM PULSE 🌟
### Free Gold Market Intelligence & Local AI Predictive Engine PWA

**AURUM PULSE** is a production-quality, mobile-first Progressive Web Application (PWA) designed for personal gold market intelligence, theoretical Indian rate conversion, and local machine learning price prediction.

---

## ⚡ Core Capabilities

1. **Free Market Data Providers**:
   - **Corgano Gold Price API**: Primary spot gold (XAU/USD), USD/INR currency rates, and karat breakdowns (CC BY 4.0).
   - **goldprice.dev**: Alternative spot provider for XAU/USD, XAU/INR, and XAG/USD (Silver).
   - **Frankfurter API**: European Central Bank daily reference exchange rates for USD/INR.
   - **FRED DEXINUS**: Historical USD/INR daily exchange rates (1973–2026).

2. **Accurate Indian Price Calculations**:
   - $1\text{ Troy Ounce} = 31.1034768\text{ Grams}$.
   - **Theoretical 24K Gold (INR per 10g)**:
     $$\text{Theoretical 24K} = \frac{\text{XAU/USD} \times \text{USD/INR}}{31.1034768} \times 10$$
   - **Theoretical 22K (Standard Hallmark)**: $\text{Theoretical 24K} \times \frac{22}{24}$.
   - **Theoretical 18K (Diamond Jewellery Grade)**: $\text{Theoretical 24K} \times \frac{18}{24}$.
   - Clear distinction between theoretical conversions and retail jewellery quotations.

3. **Local AI Training & Forecasting Engine**:
   - Operates locally on your PC via Python (`FastAPI`, `scikit-learn`, `pandas`, `SQLite`).
   - Ingests 26 years of historical COMEX gold and FRED exchange rates (6,568 daily observations).
   - Generates 17 technical indicators without look-ahead leakage.
   - Compares: Persistence Baseline, Historical Trend Baseline, Ridge Regression, Random Forest, and Gradient Boosting.
   - Evaluates on unseen historical test data with **chronological walk-forward backtesting** (MAE, RMSE, Directional Accuracy, Error in INR per 10g).
   - Generates 1-day, 3-day, and 5-day forecasts with 85% uncertainty error bounds.
   - Preserves offline browser-based statistical fallback when the Python backend is closed.

4. **WhatsApp Bullion Message Importer**:
   - Safely parses daily rate text messages forwarded by jewellers (`G`, `S`, `MCX`, `Chennai`, `Madurai`, `Kerala`).
   - Flagging of ambiguous fields, numeric validation, and duplicate detection.
   - 100% client-side execution; messages are never uploaded to any external server.

5. **Gold Purchase & Jewellery Invoice Calculator**:
   - Compute total purchase cost with customizable weight (Grams, Sovereign/Pavan, Tola, Troy Oz), making charges (%), and statutory Indian 3% GST.

6. **Offline First & Standalone Android PWA**:
   - Service worker application-shell caching (`sw.js`).
   - Web App Manifest (`manifest.json`) with high-resolution app icons.
   - Full IndexedDB storage for historical observations, local quotes, and user alerts.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS |
| **Icons & Design** | Lucide React, Deep Navy & Charcoal Theme with Gold Accents |
| **Storage** | Browser IndexedDB & LocalStorage (Offline Persistence) |
| **PWA** | Web App Manifest, Service Worker Cache |
| **Local AI Service** | Python 3.12, FastAPI, Uvicorn, Scikit-Learn, Pandas, NumPy, Joblib, SQLite |
| **Testing** | Vitest (19 automated unit & integration tests) |

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18 or higher) & npm
- Python 3.10+ (for local AI training service)

### 2. Frontend Setup
```bash
# Install dependencies
npm install

# Run unit tests
npm run test

# Build production bundle
npm run build

# Start local development server
npm run dev
```

### 3. Local Python AI Training Engine
```bash
# Activate virtual environment
# Windows:
.venv\Scripts\activate

# Launch FastAPI local backend
uvicorn backend.main:app --host 127.0.0.1 --port 8000
```
The AI Lab dashboard inside AURUM PULSE will automatically detect the local Python service at `http://127.0.0.1:8000`.

---

## 📱 How to Install on Android

1. Open the deployed application URL (or your local network address over HTTPS) in **Chrome on Android**.
2. Tap the browser menu (three vertical dots `⋮` in the top right).
3. Select **"Add to Home screen"** or tap the in-app **"Install App"** banner.
4. AURUM PULSE will launch as an independent, standalone app with its own window, full offline cache, and native Android styling.

---

## 🌐 Free Static Deployment

AURUM PULSE is ready to deploy directly to free static hosting providers:

### Cloudflare Pages / Netlify / Vercel
1. Build command: `npm run build`
2. Output directory: `dist`
3. Node version: `18+`

Direct browser CORS calls to Corgano and goldprice.dev ensure the PWA functions globally without needing any paid server infrastructure.

---

## 📜 Provider Attribution & Data Licensing

In compliance with provider terms of service:
- **Corgano Gold Price API**: Gold price data by Corgano ([https://goldprice.corgano.com/](https://goldprice.corgano.com/)), licensed under CC BY 4.0.
- **goldprice.dev**: Free anonymous spot rates ([https://goldprice.dev/](https://goldprice.dev/)).
- **Frankfurter**: European Central Bank reference exchange rates ([https://frankfurter.dev/](https://frankfurter.dev/)).
- **FRED**: Federal Reserve Bank of St. Louis DEXINUS exchange rate series.

