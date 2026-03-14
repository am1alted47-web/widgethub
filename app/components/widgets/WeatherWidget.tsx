'use client';

import { useState, useEffect, useRef } from 'react';
import { Cloud, Sun, CloudRain, CloudSnow, Loader2, MapPin } from 'lucide-react';
import { useWorkerInterval } from '../../hooks/useWorkerInterval';

interface WeatherData {
  temperature: number;
  condition: string;
  city: string;
}

interface WeatherWidgetProps {
  blur?: number;
  settings?: {
      city?: string;
  };
  onSettingsChange?: (settings: { city: string }) => void;
}

export default function WeatherWidget({ blur = 0, settings, onSettingsChange }: WeatherWidgetProps) {
  const [city, setCity] = useState(settings?.city || 'New York');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditingCity, setIsEditingCity] = useState(false);
  const [inputCity, setInputCity] = useState(city);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (settings?.city) {
        setCity(settings.city);
        fetchWeather(settings.city);
    } else {
        fetchWeather(city); // Default
    }
  }, []); 

  useEffect(() => {
    if (settings?.city && settings.city !== city) {
        setCity(settings.city);
        fetchWeather(settings.city);
    }
  }, [settings?.city]);

  useEffect(() => {
      if (!containerRef.current) return;
      
      const observer = new ResizeObserver((entries) => {
          for (const entry of entries) {
              setSize({
                  width: entry.contentRect.width,
                  height: entry.contentRect.height
              });
          }
      });

      observer.observe(containerRef.current);
      return () => observer.disconnect();
  }, []);

  // Auto-refresh every 30 minutes
  useWorkerInterval(() => {
      fetchWeather(city);
  }, 30 * 60 * 1000); // 30 minutes

  const fetchWeather = async (cityName: string) => {
    setLoading(true);
    try {
      // 1. Geocoding
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`);
      const geoData = await geoRes.json();

      if (!geoData.results || geoData.results.length === 0) {
        throw new Error('City not found');
      }

      const { latitude, longitude, name } = geoData.results[0];

      // 2. Weather
      const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
      const weatherData = await weatherRes.json();

      setWeather({
        temperature: weatherData.current_weather.temperature,
        condition: decodeWeatherCode(weatherData.current_weather.weathercode),
        city: name
      });
    } catch (error) {
      console.error(error);
      setWeather(null);
    } finally {
      setLoading(false);
    }
  };

  const decodeWeatherCode = (code: number): string => {
      if (code <= 3) return 'Clear';
      if (code <= 48) return 'Cloudy';
      if (code <= 67) return 'Rain';
      if (code <= 77) return 'Snow';
      if (code <= 82) return 'Rain';
      if (code <= 86) return 'Snow';
      if (code <= 99) return 'Storm';
      return 'Unknown';
  };

  const getWeatherIcon = (condition: string, iconSize: number) => {
      switch (condition) {
          case 'Clear': return <Sun className="text-yellow-400" size={iconSize} />;
          case 'Cloudy': return <Cloud className="text-gray-400" size={iconSize} />;
          case 'Rain': return <CloudRain className="text-blue-400" size={iconSize} />;
          case 'Snow': return <CloudSnow className="opacity-100" size={iconSize} />;
          default: return <Sun className="text-yellow-400" size={iconSize} />;
      }
  };

  const handleCitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCity(inputCity);
    setIsEditingCity(false);
    fetchWeather(inputCity);
    if (onSettingsChange) {
        onSettingsChange({ city: inputCity });
    }
  };

  // Logic for responsive layout
  // Height < 120 -> Hide Icon?
  // Height < 80 -> Inline
  const isSmallHeight = size.height < 150; 
  const isVerySmallHeight = size.height < 100;
  
  // Also consider width
  const isSmallWidth = size.width < 140;

  const showIcon = !isVerySmallHeight && !isSmallWidth;
  const isInline = isVerySmallHeight;
  const isKindaSmall = isSmallHeight || isSmallWidth;

  return (
    <div 
        ref={containerRef}
        className="flex flex-col h-full w-full rounded-2xl p-4 overflow-hidden relative transition-colors duration-300"
        style={{ 
            backdropFilter: `blur(${blur}px)`,
            backgroundColor: `rgba(0, 0, 0, 0)`
        }}
    >
        {isEditingCity ? (
            <div className="flex flex-col items-center justify-center h-full gap-2">
                <form onSubmit={handleCitySubmit} className="flex flex-col gap-2 w-full">
                    <input 
                        type="text" 
                        value={inputCity} 
                        onChange={e => setInputCity(e.target.value)} 
                        placeholder="City"
                        className="bg-white/10 p-1.5 rounded text-center focus:outline-none text-sm w-full"
                        autoFocus
                    />
                    <div className="flex gap-1 justify-center">
                        <button type="submit" className="bg-white/20 p-1 px-2 rounded hover:bg-white/30 text-[10px] font-bold">OK</button>
                        <button type="button" onClick={() => setIsEditingCity(false)} className="opacity-50 text-[10px] hover:opacity-100 px-2">Cancel</button>
                    </div>
                </form>
            </div>
        ) : (
           <>
              {loading ? (
                  <div className="flex-1 flex items-center justify-center">
                      <Loader2 className="animate-spin opacity-50" size={24} />
                  </div>
              ) : weather ? (
                <div className={`flex ${isInline ? 'flex-row items-center justify-between px-2' : 'flex-col items-center justify-between'} h-full w-full`}>
                    
                    {/* Header / City */}
                    <div className="flex items-center gap-1 cursor-pointer hover:bg-white/10 px-2 py-0.5 rounded transition" onClick={() => { setIsEditingCity(true); setInputCity(city); }}>
                        {!isInline && <MapPin size={14} className="opacity-70" />}
                        <span className={`font-medium ${isInline ? 'text-sm' : 'text-base'}`}>{weather.city}</span>
                    </div>
                    
                    {/* Main Info */}
                    <div className={`flex ${isInline ? 'items-center gap-2' : 'flex-col items-center'}`}>
                        {showIcon && (
                            <div className="mb-1">
                                {getWeatherIcon(weather.condition, 40)}
                            </div>
                        )}
                        <span className={`${isInline ? 'text-lg' : 'text-3xl'} font-bold`}>{Math.round((weather.temperature * 9/5) + 32)}°F</span>
                    </div>

                    {/* Footer / Condition (Hide if inline/very small) */}
                    {!isKindaSmall && (
                        <div className="opacity-70 font-medium text-s">
                            {weather.condition}
                        </div>
                    )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center opacity-50 cursor-pointer text-center p-2" onClick={() => setIsEditingCity(true)}>
                    <span className="text-xs">Tap to set city</span>
                </div>
              )}
           </>
        )}
    </div>
  );
}

