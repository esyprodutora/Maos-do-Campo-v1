export interface WeatherData {
  temp: number;
  condition: string;
  humidity: number;
  wind: number;
  location: string;
  isDay: boolean;
}

// Códigos WMO da Open-Meteo para descrições amigáveis
const weatherCodes: Record<number, string> = {
  0: 'Céu Limpo',
  1: 'Parcialmente Nublado',
  2: 'Parcialmente Nublado',
  3: 'Nublado',
  45: 'Nevoeiro',
  48: 'Nevoeiro com Geada',
  51: 'Garoa Leve',
  53: 'Garoa Moderada',
  55: 'Garoa Intensa',
  61: 'Chuva Fraca',
  63: 'Chuva Moderada',
  65: 'Chuva Forte',
  80: 'Pancadas de Chuva',
  81: 'Pancadas Fortes',
  82: 'Tempestade',
  95: 'Trovoadas',
};

export const getWeatherData = async (lat?: number, lng?: number): Promise<WeatherData> => {
  try {
    // Se não tiver coordenadas, tenta pegar do navegador
    let latitude = lat;
    let longitude = lng;
    let locationName = 'Localização Atual';

    if (!latitude || !longitude) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      } catch (e) {
        // Fallback para o centro do Brasil (Cerrado) se negar permissão
        latitude = -15.7801;
        longitude = -47.9292;
        locationName = 'Brasília (Padrão)';
      }
    }

    // 1. Busca Clima (Open-Meteo - Grátis, sem API Key)
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=relativehumidity_2m,is_day&timezone=auto`;
    const res = await fetch(weatherUrl);
    const data = await res.json();
    
    const current = data.current_weather;
    
    // 2. Tenta obter o nome da cidade (Reverse Geocoding - Open-Meteo Grátis)
    // Se já não tivermos um nome específico
    if (locationName === 'Localização Atual') {
       try {
           const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
           const geoData = await geoRes.json();
           // Tenta cidade, vila, município ou estado
           locationName = geoData.address.city || geoData.address.town || geoData.address.village || geoData.address.municipality || 'Sua Região';
       } catch (e) {
           // Falha silenciosa no nome, mantém genérico
       }
    }

    // Estimar umidade (pega a hora atual do array hourly)
    const currentHourIndex = new Date().getHours();
    const humidity = data.hourly.relativehumidity_2m[currentHourIndex] || 60;
    const isDay = data.hourly.is_day ? !!data.hourly.is_day[currentHourIndex] : (currentHourIndex > 6 && currentHourIndex < 18);

    return {
      temp: Math.round(current.temperature),
      condition: weatherCodes[current.weathercode] || 'Tempo Variável',
      humidity: humidity,
      wind: Math.round(current.windspeed),
      location: locationName,
      isDay: isDay
    };

  } catch (error) {
    console.error("Erro ao buscar clima:", error);
    return {
      temp: 0,
      condition: 'Indisponível',
      humidity: 0,
      wind: 0,
      location: 'Sem sinal',
      isDay: true
    };
  }
};
