export interface WeatherData {
  temperature: number;
  condition: string;
  windSpeed: number;
  precipitation: number;
  skatingScore: number;
  humidity: number;
  uvIndex: number;
  lastUpdated: Date;
}

export interface SkatingConditions {
  isGoodForSkating: boolean;
  reason: string;
  recommendations: string[];
}

class WeatherService {
  private mockWeatherConditions = [
    'Sunny',
    'Partly Cloudy',
    'Cloudy',
    'Overcast',
    'Light Rain',
    'Heavy Rain',
    'Thunderstorm',
    'Foggy',
    'Clear'
  ];

  // Mock weather data - replace with real API call
  async getWeatherData(latitude: number, longitude: number): Promise<WeatherData> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Generate realistic mock data based on time of day and season
    const now = new Date();
    const hour = now.getHours();
    const month = now.getMonth();
    
    // Temperature varies by time of day and season
    let baseTemp = 20; // Base temperature
    if (month >= 11 || month <= 2) baseTemp = 10; // Winter
    else if (month >= 3 && month <= 5) baseTemp = 18; // Spring
    else if (month >= 6 && month <= 8) baseTemp = 28; // Summer
    else baseTemp = 22; // Fall
    
    // Add time-of-day variation
    if (hour >= 6 && hour <= 10) baseTemp += 2; // Morning
    else if (hour >= 11 && hour <= 16) baseTemp += 5; // Afternoon
    else if (hour >= 17 && hour <= 20) baseTemp += 1; // Evening
    else baseTemp -= 3; // Night

    const temperature = Math.round(baseTemp + (Math.random() - 0.5) * 10);
    const condition = this.mockWeatherConditions[Math.floor(Math.random() * this.mockWeatherConditions.length)];
    const windSpeed = Math.floor(Math.random() * 25) + 5;
    const precipitation = Math.floor(Math.random() * 100);
    const humidity = Math.floor(Math.random() * 40) + 40;
    const uvIndex = Math.floor(Math.random() * 8) + 1;

    // Calculate skating score based on conditions
    const skatingScore = this.calculateSkatingScore({
      temperature,
      condition,
      windSpeed,
      precipitation,
      humidity,
      uvIndex
    });

    return {
      temperature,
      condition,
      windSpeed,
      precipitation,
      skatingScore,
      humidity,
      uvIndex,
      lastUpdated: now
    };
  }

  private calculateSkatingScore(conditions: Omit<WeatherData, 'skatingScore' | 'lastUpdated'>): number {
    let score = 10; // Start with perfect score

    // Temperature penalties
    if (conditions.temperature < 5) score -= 3; // Too cold
    else if (conditions.temperature > 35) score -= 2; // Too hot
    else if (conditions.temperature >= 15 && conditions.temperature <= 25) score += 1; // Perfect temperature

    // Wind penalties
    if (conditions.windSpeed > 20) score -= 3; // Too windy
    else if (conditions.windSpeed > 15) score -= 2; // Moderately windy
    else if (conditions.windSpeed > 10) score -= 1; // Slightly windy

    // Precipitation penalties
    if (conditions.precipitation > 80) score -= 4; // Heavy rain
    else if (conditions.precipitation > 50) score -= 3; // Moderate rain
    else if (conditions.precipitation > 20) score -= 2; // Light rain
    else if (conditions.precipitation > 0) score -= 1; // Drizzle

    // Condition-specific penalties
    if (conditions.condition.includes('Rain') || conditions.condition.includes('Thunderstorm')) {
      score -= 3;
    } else if (conditions.condition.includes('Fog')) {
      score -= 2;
    } else if (conditions.condition === 'Sunny' && conditions.uvIndex > 6) {
      score -= 1; // High UV
    }

    // Ensure score is between 1 and 10
    return Math.max(1, Math.min(10, Math.round(score)));
  }

  // Get skating recommendations based on weather
  getSkatingRecommendations(weather: WeatherData): SkatingConditions {
    const isGoodForSkating = weather.skatingScore >= 7;
    let reason = '';
    const recommendations: string[] = [];

    if (weather.skatingScore >= 8) {
      reason = 'Excellent conditions for skating!';
      recommendations.push('Perfect weather - enjoy your session!');
      recommendations.push('Consider longer skating sessions');
    } else if (weather.skatingScore >= 6) {
      reason = 'Good conditions with minor considerations';
      if (weather.windSpeed > 10) {
        recommendations.push('Wind might affect balance - be careful');
      }
      if (weather.temperature < 15) {
        recommendations.push('Wear appropriate layers');
      }
    } else if (weather.skatingScore >= 4) {
      reason = 'Moderate conditions - proceed with caution';
      if (weather.precipitation > 0) {
        recommendations.push('Wet surfaces - reduced traction');
        recommendations.push('Consider indoor alternatives');
      }
      if (weather.windSpeed > 15) {
        recommendations.push('High winds - avoid open areas');
      }
    } else {
      reason = 'Poor conditions - not recommended';
      if (weather.precipitation > 50) {
        recommendations.push('Heavy precipitation - unsafe conditions');
        recommendations.push('Wait for better weather');
      }
      if (weather.temperature < 5) {
        recommendations.push('Too cold - risk of injury');
        recommendations.push('Consider indoor skating');
      }
    }

    // Add general recommendations
    if (weather.uvIndex > 6) {
      recommendations.push('High UV - wear sunscreen and protective gear');
    }
    if (weather.humidity > 70) {
      recommendations.push('High humidity - stay hydrated');
    }

    return {
      isGoodForSkating,
      reason,
      recommendations
    };
  }

  // Get hourly forecast (mock data)
  async getHourlyForecast(latitude: number, longitude: number): Promise<WeatherData[]> {
    const forecast: WeatherData[] = [];
    const baseWeather = await this.getWeatherData(latitude, longitude);
    
    for (let hour = 0; hour < 24; hour++) {
      const hourData = { ...baseWeather };
      hourData.temperature += (Math.random() - 0.5) * 6; // ±3°C variation
      hourData.windSpeed += (Math.random() - 0.5) * 10; // ±5 km/h variation
      hourData.lastUpdated = new Date(Date.now() + hour * 60 * 60 * 1000);
      hourData.skatingScore = this.calculateSkatingScore(hourData);
      forecast.push(hourData);
    }
    
    return forecast;
  }
}

export const weatherService = new WeatherService();
