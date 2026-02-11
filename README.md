# Weatherly - Weather Dashboard

A weather application built with Svelte 5, SvelteKit, shadCN and Tailwind CSS. Features real-time weather data, user authentication, and weather history tracking.

## Features

- Real-time weather data from OpenWeather API
- User authentication (login/register)
- Geolocation support for current location
- Weather history with local storage
- Responsive design with dynamic backgrounds
- Time-based weather icons (sun/moon logic after 6 PM)

## Setup Instructions

### Prerequisites

- Node.js (v18+)
- npm
- OpenWeather API key (free at [openweathermap.org](https://openweathermap.org/api))

### Installation

1. Clone and install dependencies:

   ```bash
   git clone <repository-url>
   cd weatherly
   npm install
   ```

2. **API Key Setup** (Required):

   Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

   Open `.env` and add your OpenWeather API key:

   ```env
   PUBLIC_WEATHER_API_KEY=your_actual_api_key_here
   ```

   Get your API key from [OpenWeather API](https://openweathermap.org/api) (free signup required).

3. Start the development server:

   ```bash
   npm run dev
   ```

   Application runs at `http://localhost:5173`

---

## Progressive Web App

The application is installable as a Progressive Web App:

- Web manifest configured
- Service worker registered
- App shell cached
- Standalone mobile experience

This improves perceived performance and provides an app-like experience on supported devices.

---

## Technology Stack

- **Frontend**: Svelte 5, SvelteKit, Tailwind CSS
- **UI Components**: shadcn/ui (Svelte port), Lucide icons
- **API**: OpenWeather API with server-side proxy
- **Testing**: Vitest (unit tests), Playwright (e2e)
- **Authentication**: Session-based auth system

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Create production build
npm run preview      # Preview production build
npm test            # Run all tests
npm run lint        # Run ESLint
npm run format      # Format with Prettier
```

## Project Structure

```
src/
├── lib/
│   ├── components/ui/     # Reusable UI components
│   └── scripts/           # Auth, API calls, utilities
├── routes/
│   ├── api/weather/       # Server-side API proxy
│   ├── dashboard/         # Main dashboard
│   ├── login/            # Authentication pages
│   └── register/
└── tests/                # Unit and integration tests
```

## Testing

The project includes comprehensive tests:

- Unit tests for core functionality
- Integration tests for component interactions
- API mocking for reliable testing

Run tests with `npm test`

## Key Features

### Authentication

- User registration and login system
- Session-based authentication
- Protected dashboard routes
- Logout confirmation dialog

### Weather Dashboard

- Current weather display with location detection
- Weather history with pagination (6 items per page)
- Time-based weather icons (sun before 6 PM, moon after)
- Dynamic weather backgrounds
- Real-time clock display

### Technical Implementation

- Server-side API proxy to avoid CORS issues
- Local storage for weather history persistence
- Responsive design with Tailwind CSS
- Svelte 5 runes for reactive state management
- Comprehensive error handling

## Notes for Reviewers

- The application requires an OpenWeather API key to function
- Weather data is fetched through a server-side proxy for security
- All weather history is stored locally in the browser
- The app includes both unit and integration tests
- Authentication is session-based (no external auth providers)
