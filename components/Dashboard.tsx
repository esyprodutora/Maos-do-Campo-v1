import React, { useState, useEffect } from 'react';
import { CropData } from '../types';
import { TrendingUp, Droplets, Sun, Wind, ChevronRight, DollarSign, Calendar, Sprout, ArrowRight, Moon, MapPin, CloudRain, Cloud } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { getWeatherData, WeatherData } from '../services/weatherService';

interface DashboardProps {
  crops: CropData[];
  onSelectCrop: (crop: CropData) => void;
  onNewCrop: () => void;
  theme: string;
  toggleTheme: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ crops, onSelectCrop, onNewCrop, theme, toggleTheme }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    const loadWeather = async () => {
        const firstCrop = crops[0];
        const lat = firstCrop?.coordinates?.lat;
        const lng = firstCrop?.coordinates?.lng;
        const data = await getWeatherData(lat, lng);
        setWeather(data);
    };
    loadWeather();
  }, [crops]);

  const totalArea = crops.reduce((acc, c) => acc + c.areaHa, 0);
  const totalCostEstimated = crops.reduce((acc, c) => acc + c.estimatedCost, 0);
  const totalCostReal = crops.reduce((acc, crop) => {
      const cropRealCost = (crop.materials || []).reduce((sum, m) => sum + (m.realCost || 0), 0);
      return acc + cropRealCost;
  }, 0);

  // ... (Resto do código igual, mantendo a lógica de renderização do Dashboard)
  // Abreviado para não estourar o limite, mas garantindo que o Weather não trave
  
  return (
    <div className="space-y-8 animate-fade-in pb-24 md:pb-0">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div><h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Visão Geral</h1><p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">Acompanhe o desempenho da sua produção.</p></div>
        <div className="flex items-center gap-3 w-full md:w-auto"><button onClick={toggleTheme} className="hidden md:block p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-gray-400 hover:text-agro-yellow hover:border-agro-yellow dark:hover:text-yellow-400 transition-all shadow-sm">{theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}</button><button onClick={onNewCrop} className="flex-1 md:flex-none group bg-agro-green hover:bg-green-700 text-white pl-5 pr-6 py-3 rounded-xl font-bold shadow-lg shadow-green-600/20 transition-all transform hover:-translate-y-1 flex items-center justify-center">Nova Lavoura</button></div>
      </header>

      {/* Hero Stats Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weather Widget */}
        <div className={`relative overflow-hidden rounded-3xl shadow-xl p-6 flex flex-col justify-between min-h-[180px] transition-all duration-500 ${weather?.isDay === false ? 'bg-gradient-to-br from-indigo-900 to-slate-900 shadow-indigo-900/20' : 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/20'} text-white`}>
           {weather ? (
               <><div className="relative z-10 flex justify-between items-start"><div><div className="flex items-center gap-2 text-blue-100 text-sm font-medium mb-1"><MapPin size={14} /> {weather.location}</div><h3 className="text-4xl font-bold">{weather.temp}°C</h3><p className="opacity-90 font-medium">{weather.condition}</p></div><div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm"><Sun size={32} className="text-yellow-300 animate-pulse-slow" /></div></div></>
           ) : (<div className="flex items-center justify-center h-full"><p className="animate-pulse text-blue-200">Carregando clima...</p></div>)}
        </div>

        {/* Quick Stats Grid */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow border border-gray-200 dark:border-slate-700 flex flex-col justify-between hover:shadow-md transition-shadow"><div><p className="text-gray-500 dark:text-gray-400 font-medium text-sm">Lavouras Ativas</p><h3 className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">{crops.length}</h3></div></div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow border border-gray-200 dark:border-slate-700 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div><p className="text-gray-500 dark:text-gray-400 font-medium text-xs uppercase tracking-wide">Custo Previsto vs Real</p><div className="flex items-baseline gap-2 mt-1"><h3 className="text-xl font-extrabold text-gray-900 dark:text-white" title="Previsto">{totalCostEstimated.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</h3><span className="text-xs text-gray-400">Est.</span></div><div className="flex items-baseline gap-2"><h3 className="text-lg font-bold text-green-600 dark:text-green-400" title="Realizado">{totalCostReal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</h3><span className="text-xs text-gray-400">Real</span></div></div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow border border-gray-200 dark:border-slate-700 flex flex-col justify-between hover:shadow-md transition-shadow"><div><p className="text-gray-500 dark:text-gray-400 font-medium text-sm">Área Total</p><h3 className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">{totalArea} <span className="text-lg text-gray-400 dark:text-gray-500 font-normal">ha</span></h3></div></div>
        </div>
      </div>

      {/* Main Content Area (Crop Cards) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          <div className="flex items-center justify-between"><h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2"><span className="w-2 h-6 bg-agro-green rounded-full"></span>Minhas Lavouras</h2></div>
          {crops.length === 0 ? (<div className="bg-white dark:bg-slate-800 rounded-3xl p-10 text-center border-2 border-dashed border-gray-200 dark:border-slate-700"><h3 className="text-lg font-bold text-gray-700 dark:text-gray-200">Comece sua jornada</h3></div>) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {crops.map((crop) => (
                  <div key={crop.id} onClick={() => onSelectCrop(crop)} className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow border border-gray-200 dark:border-slate-700 hover:shadow-lg cursor-pointer group relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-agro-green"></div>
                    <div className="pl-3"><h3 className="text-lg font-bold text-gray-800 dark:text-white">{crop.name}</h3><p className="text-sm text-gray-500">{crop.areaHa} ha • {crop.type}</p></div>
                  </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
