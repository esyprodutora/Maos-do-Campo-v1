import React from 'react';
import { CropData } from '../types';
import { TrendingUp, Droplets, Sun, Wind, ChevronRight, DollarSign, Calendar, Sprout, ArrowRight } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis } from 'recharts';

interface DashboardProps {
  crops: CropData[];
  onSelectCrop: (crop: CropData) => void;
  onNewCrop: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ crops, onSelectCrop, onNewCrop }) => {
  // Mock Weather Data
  const weather = { temp: 28, condition: 'Ensolarado', humidity: 62, wind: 14, location: 'Fazenda Santa Rita' };

  const totalArea = crops.reduce((acc, c) => acc + c.areaHa, 0);
  const totalCost = crops.reduce((acc, c) => acc + c.estimatedCost, 0);

  const cropTypeData = [
    { name: 'Café', value: crops.filter(c => c.type === 'cafe').length, color: '#8E5A2E' },
    { name: 'Soja', value: crops.filter(c => c.type === 'soja').length, color: '#F2C94C' },
    { name: 'Milho', value: crops.filter(c => c.type === 'milho').length, color: '#E67E22' },
  ].filter(d => d.value > 0);

  // Helper for crop visuals
  const getCropStyle = (type: string) => {
    switch(type) {
      case 'cafe': return { bg: 'bg-[#8E5A2E]', text: 'text-[#8E5A2E]', light: 'bg-[#F6EBE0]' };
      case 'milho': return { bg: 'bg-[#E67E22]', text: 'text-[#E67E22]', light: 'bg-[#FEF5E7]' };
      case 'soja': return { bg: 'bg-[#F2C94C]', text: 'text-[#B7950B]', light: 'bg-[#FCF3CF]' };
      default: return { bg: 'bg-agro-green', text: 'text-agro-green', light: 'bg-green-50' };
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20 md:pb-0">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Visão Geral</h1>
          <p className="text-gray-500 mt-1 font-medium">Acompanhe o desempenho da sua produção.</p>
        </div>
        <button 
          onClick={onNewCrop}
          className="group bg-agro-green hover:bg-green-700 text-white pl-5 pr-6 py-3 rounded-xl font-bold shadow-lg shadow-green-600/20 transition-all transform hover:-translate-y-1 flex items-center"
        >
          <div className="bg-white/20 p-1 rounded-lg mr-3 group-hover:rotate-90 transition-transform">
             <span className="text-lg font-bold">+</span> 
          </div>
          Nova Lavoura
        </button>
      </header>

      {/* Hero Stats Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Weather Widget */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xl shadow-blue-500/20 p-6 flex flex-col justify-between min-h-[180px]">
           <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
           <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-blue-400/20 rounded-full blur-2xl"></div>
           
           <div className="relative z-10 flex justify-between items-start">
             <div>
               <div className="flex items-center gap-2 text-blue-100 text-sm font-medium mb-1">
                 <MapPinIcon size={14} /> {weather.location}
               </div>
               <h3 className="text-4xl font-bold">{weather.temp}°C</h3>
               <p className="opacity-90 font-medium">{weather.condition}</p>
             </div>
             <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                <Sun size={32} className="text-yellow-300 animate-pulse-slow" />
             </div>
           </div>

           <div className="relative z-10 grid grid-cols-2 gap-4 mt-4">
             <div className="bg-black/10 rounded-xl p-2 flex items-center gap-2 backdrop-blur-sm">
               <Droplets size={18} className="text-blue-200"/>
               <div>
                 <p className="text-xs text-blue-200">Umidade</p>
                 <p className="font-bold">{weather.humidity}%</p>
               </div>
             </div>
             <div className="bg-black/10 rounded-xl p-2 flex items-center gap-2 backdrop-blur-sm">
               <Wind size={18} className="text-blue-200"/>
               <div>
                 <p className="text-xs text-blue-200">Vento</p>
                 <p className="font-bold">{weather.wind}km/h</p>
               </div>
             </div>
           </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
               <div className="p-3 bg-green-50 text-agro-green rounded-2xl">
                 <Sprout size={24} />
               </div>
               <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">+2 esse ano</span>
            </div>
            <div>
              <p className="text-gray-500 font-medium text-sm">Lavouras Ativas</p>
              <h3 className="text-3xl font-extrabold text-gray-900 mt-1">{crops.length}</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
               <div className="p-3 bg-yellow-50 text-yellow-600 rounded-2xl">
                 <DollarSign size={24} />
               </div>
            </div>
            <div>
              <p className="text-gray-500 font-medium text-sm">Custo Previsto</p>
              <h3 className="text-2xl font-extrabold text-gray-900 mt-1 truncate" title={totalCost.toString()}>
                {totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
              </h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
               <div className="p-3 bg-orange-50 text-orange-500 rounded-2xl">
                 <TrendingUp size={24} />
               </div>
            </div>
            <div>
              <p className="text-gray-500 font-medium text-sm">Área Total</p>
              <h3 className="text-3xl font-extrabold text-gray-900 mt-1">{totalArea} <span className="text-lg text-gray-400 font-normal">ha</span></h3>
            </div>
          </div>

        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Crop Cards List */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <span className="w-2 h-6 bg-agro-green rounded-full"></span>
              Minhas Lavouras
            </h2>
            <button className="text-sm font-semibold text-agro-green hover:underline">Ver todas</button>
          </div>

          {crops.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border-2 border-dashed border-gray-200">
               <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mb-4">
                 <Sprout size={32} />
               </div>
               <h3 className="text-lg font-bold text-gray-700">Comece sua jornada</h3>
               <p className="text-gray-500 mb-6">Nenhuma lavoura cadastrada ainda.</p>
               <button onClick={onNewCrop} className="text-agro-green font-bold hover:underline">Criar primeira lavoura</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {crops.map((crop) => {
                const styles = getCropStyle(crop.type);
                const percentDone = Math.random() * 60 + 20; // Mock progress for UI demo
                
                return (
                  <div 
                    key={crop.id}
                    onClick={() => onSelectCrop(crop)}
                    className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:border-green-100 transition-all cursor-pointer group relative overflow-hidden"
                  >
                    {/* Color Strip */}
                    <div className={`absolute left-0 top-0 bottom-0 w-2 ${styles.bg}`}></div>
                    
                    <div className="flex justify-between items-start mb-4 pl-3">
                      <div>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mb-2 ${styles.light} ${styles.text}`}>
                          {crop.type}
                        </span>
                        <h3 className="text-lg font-bold text-gray-800 group-hover:text-agro-green transition-colors">{crop.name}</h3>
                        <p className="text-sm text-gray-500">{crop.areaHa} hectares</p>
                      </div>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${styles.light} group-hover:scale-110 transition-transform`}>
                         <ArrowRight size={18} className={styles.text} />
                      </div>
                    </div>

                    <div className="pl-3 mt-4">
                      <div className="flex justify-between text-xs text-gray-500 mb-1 font-medium">
                        <span>Progresso do Ciclo</span>
                        <span>{Math.round(percentDone)}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${styles.bg}`} 
                          style={{ width: `${percentDone}%` }}
                        ></div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-50 flex items-center gap-2 text-sm text-gray-600">
                        <Calendar size={14} className="text-gray-400"/>
                        Colheita prev: <span className="font-bold text-gray-800">{new Date(crop.estimatedHarvestDate).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar Charts */}
        <div className="space-y-6">
           <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
             <h3 className="font-bold text-gray-800 mb-6">Distribuição de Culturas</h3>
             {cropTypeData.length > 0 ? (
               <div className="relative h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={cropTypeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {cropTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Legend */}
                  <div className="flex flex-wrap justify-center gap-3 mt-4">
                    {cropTypeData.map((d, i) => (
                      <div key={i} className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></div>
                        <span className="text-xs font-bold text-gray-600 capitalize">{d.name}</span>
                      </div>
                    ))}
                  </div>
               </div>
             ) : (
               <div className="h-64 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl">
                 <p className="text-sm">Sem dados suficientes</p>
               </div>
             )}
           </div>

           <div className="bg-indigo-50 rounded-3xl p-6 border border-indigo-100 relative overflow-hidden">
              <div className="relative z-10">
                 <h3 className="font-bold text-indigo-900 mb-2">Dica do dia</h3>
                 <p className="text-sm text-indigo-700 leading-relaxed">
                   Monitore a umidade do solo antes de aplicar a próxima adubação nitrogenada para evitar perdas por lixiviação.
                 </p>
                 <button className="mt-4 text-xs font-bold text-indigo-600 uppercase tracking-wide hover:underline">Ler mais dicas</button>
              </div>
              <Sprout className="absolute bottom-[-10px] right-[-10px] text-indigo-200 w-32 h-32 opacity-50 rotate-12" />
           </div>
        </div>

      </div>
    </div>
  );
};

// Icon Helper
const MapPinIcon = ({size}: {size: number}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);
