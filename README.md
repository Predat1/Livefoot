# ⚽ LiveFoot - Premier Football Intelligence Platform

LiveFoot is a high-performance, mobile-first web application providing real-time football scores, expert AI predictions, and comprehensive match statistics for over 800 leagues worldwide.

## 🚀 Features

- **Real-time Scores**: Instant updates for matches across all major and minor leagues.
- **AI Expert Predictions**: Advanced match analysis using Gemini 2.0 Flash (via OpenRouter) and historical data.
- **Deep Statistics**: Head-to-Head (H2H), team form, standings, and player performance metrics.
- **Search Engine**: Rapid search for teams, players, and competitions.
- **Personalization**: Favorite teams and leagues for a tailored experience.
- **SEO Optimized**: High-performance metadata and JSON-LD for maximum visibility.
- **PWA Support**: Installable on mobile devices for an app-like experience.

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS.
- **UI Components**: shadcn/ui, Framer Motion for smooth animations.
- **Backend**: Supabase (Auth, Database, Edge Functions).
- **Data Source**: API-Football (RapidAPI/API-Sports).
- **AI Engine**: OpenRouter (Google Gemini 2.0 Flash).

## 📦 Installation

```sh
# Clone the repository
git clone https://github.com/Predat1/Livefoot.git

# Navigate to the project directory
cd livefoot

# Install dependencies
npm install

# Start development server
npm run dev
```

## ⚙️ Configuration

The project relies on Supabase Edge Functions to proxy API requests securely. Ensure the following environment variables are set in your Supabase project:

- `API_FOOTBALL_KEY`: Your API-Football / API-Sports key.
- `OPENROUTER_API_KEY`: Your OpenRouter API key for AI predictions.

## 📄 License

Private - All rights reserved.
