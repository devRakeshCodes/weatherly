import { json } from '@sveltejs/kit';
import { PUBLIC_WEATHER_API_KEY } from '$env/static/public';

const API_BASE_URL = 'https://api.openweathermap.org/data/2.5';
const API_KEY = PUBLIC_WEATHER_API_KEY || 'c2f066a304d81e8825b4cd66d6522777';

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
  const lat = url.searchParams.get('lat');
  const lon = url.searchParams.get('lon');
  const type = url.searchParams.get('type') || 'weather'; // 'weather' or 'forecast'

  if (!lat || !lon) {
    return json({ error: 'Latitude and longitude are required' }, { status: 400 });
  }

  try {
    const apiUrl = `${API_BASE_URL}/${type}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Weather API responded with status: ${response.status}`);
    }

    const data = await response.json();

    return json(data);
  } catch (error) {
    console.error('Weather API error:', error);
    return json({ error: 'Failed to fetch weather data' }, { status: 500 });
  }
}
