
import React from 'react';
import { CropData } from '../types';
import { TrendingUp, Droplets, Sun, Wind, ChevronRight, DollarSign, Calendar, Sprout, ArrowRight, MapPin, CloudSun } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  crops: CropData[];
  onSelectCrop: (crop: CropData) => void;
  onNewCrop: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ crops, onSelectCrop, onNewCrop }) => {
  // Mock Weather Data
  const weather = { temp: 28, condition: 'Parcialmente Nublado', humidity: 62, wind: 14, location: 'Fazenda Santa Rita' };

  const totalArea = crops.reduce((acc, c) => acc + c.areaHa, 0);
  const totalCost = crops.reduce((acc, c) => acc + c.estimatedCost, 0);

  const cropTypeData = [
    { name: 'Café', value: crops.filter(c => c.type === 'cafe').length, color: '#8E5A2E' },
    { name: 'Soja', value: crops.filter(c => c.type === 'soja').length, color: '#F2C94C' },
    { name: 'Milho', value: crops.filter(c => c.type === 'milho').length, color: '#E67E22' },
  ].filter(d => d.value > 0);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }

  const currentDate = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  // Helper for crop visuals
  const getCropStyle = (type: string) => {
    switch(type) {
      case 'cafe': return { bg: 'bg-[#8E5A2E]', text: 'text-[#8E5A2E]', light: 'bg-[#F6EBE0]', icon: '☕' };
      case 'milho': return { bg: 'bg-[#E67E22]', text: 'text-[#E67E22]', light: 'bg-[#FEF5E7]', icon: '🌽' };
      case 'soja': return { bg: 'bg-[#F2C94C]', text: 'text-[#B7950B]', light: 'bg-[#FCF3CF]', icon: '🌱' };
      default: return { bg: 'bg-agro-green', text: 'text-agro-green', light: 'bg-green-50', icon: '🌿' };
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20 md:pb-0">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <span className="text-sm font-bold text-gray-400 uppercase tracking-wide bg-white px-3 py-1 rounded-full border border-gray-100 shadow-sm">{currentDate}</span>
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            {getGreeting()}, <span className="text-agro-green">Produtor</span>
          </h1>
          <p className="text-gray-500 mt-2 font-medium text-lg">Aqui está o resumo da sua produção hoje.</p>
        </div>
        <button 
          onClick={onNewCrop}
          className="group bg-agro-green hover:bg-green-700 text-white pl-6 pr-8 py-4 rounded-2xl font-bold shadow-xl shadow-green-600/20 transition-all transform hover:-translate-y-1 flex items-center"
        >
          <div className="bg-white/20 p-1.5 rounded-lg mr-3 group-hover:rotate-90 transition-transform">
             <span className="text-xl font-bold leading-none">+</span> 
          </div>
          Nova Lavoura
        </button>
      </header>

      {/* Hero Stats Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Weather Widget (Premium) */}
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#3B82F6] to-[#2563EB] text-white shadow-2xl shadow-blue-500/20 p-8 flex flex-col justify-between min-h-[220px]">
           {/* Background Decorations */}
           <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
           <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-[#60A5FA]/30 rounded-full blur-3xl"></div>
           
           <div className="relative z-10">
             <div className="flex items-center gap-2 text-blue-100 text-sm font-bold mb-4 bg-white/10 w-fit px-3 py-1 rounded-full backdrop-blur-sm">
               <MapPin size={14} /> {weather.location}
             </div>
             
             <div className="flex justify-between items-center">
                <div>
                   <h3 className="text-5xl font-extrabold tracking-tighter">{weather.temp}°</h3>
                   <p className="opacity-90 font-medium text-lg mt-1 flex items-center gap-2">
                     {weather.condition}
                   </p>
                </div>
                <div className="bg-gradient-to-br from-yellow-300 to-orange-400 p-4 rounded-2xl shadow-lg animate-pulse-slow">
                   <Sun size={40} className="text-white" />
                </div>
             </div>
           </div>

           <div className="relative z-10 grid grid-cols-2 gap-4 mt-6">
             <div className="bg-black/20 rounded-2xl p-3 flex items-center gap-3 backdrop-blur-md border border-white/5">
               <div className="p-2 bg-blue-400/30 rounded-xl">
                 <Droplets size={18} className="text-white"/>
               </div>
               <div>
                 <p className="text-[10px] text-blue-100 uppercase tracking-wider font-bold">Umidade</p>
                 <p className="font-bold text-lg leading-none">{weather.humidity}%</p>
               </div>
             </div>
             <div className="bg-black/20 rounded-2xl p-3 flex items-center gap-3 backdrop-blur-md border border-white/5">
                <div className="p-2 bg-blue-400/30 rounded-xl">
                 <Wind size={18} className="text-white"/>
               </div>
               <div>
                 <p className="text-[10px] text-blue-100 uppercase tracking-wider font-bold">Vento</p>
                 <p className="font-bold text-lg leading-none">{weather.wind}km/h</p>
               </div>
             </div>
           </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-6">
          
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-xl hover:border-green-100 transition-all group">
            <div className="flex justify-between items-start mb-6">
               <div className="p-4 bg-green-50 text-agro-green rounded-2xl group-hover:scale-110 transition-transform duration-300">
                 <Sprout size={28} />
               </div>
               <span className="text-xs font-bold text-green-700 bg-green-100 px-3 py-1.5 rounded-full flex items-center gap-1">
                 <TrendingUp size={12}/> Ativo
               </span>
            </div>
            <div>
              <p className="text-gray-400 font-bold text-xs uppercase tracking-wider">Lavouras</p>
              <h3 className="text-4xl font-extrabold text-gray-900 mt-1">{crops.length}</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-xl hover:border-yellow-100 transition-all group">
            <div className="flex justify-between items-start mb-6">
               <div className="p-4 bg-yellow-50 text-yellow-600 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                 <DollarSign size={28} />
               </div>
            </div>
            <div>
              <p className="text-gray-400 font-bold text-xs uppercase tracking-wider">Investimento</p>
              <h3 className="text-3xl font-extrabold text-gray-900 mt-1 truncate tracking-tight" title={totalCost.toString()}>
                {totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
              </h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-xl hover:border-orange-100 transition-all group">
            <div className="flex justify-between items-start mb-6">
               <div className="p-4 bg-orange-50 text-orange-500 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                 <MapPin size={28} />
               </div>
            </div>
            <div>
              <p className="text-gray-400 font-bold text-xs uppercase tracking-wider">Área Total</p>
              <h3 className="text-4xl font-extrabold text-gray-900 mt-1">{totalArea} <span className="text-xl text-gray-400 font-medium">ha</span></h3>
            </div>
          </div>

        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Crop Cards List */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <span className="w-1.5 h-8 bg-agro-green rounded-full block"></span>
              Minhas Lavouras
            </h2>
            <button className="text-sm font-bold text-agro-green hover:bg-green-50 px-4 py-2 rounded-xl transition-colors">
                Ver todas
            </button>
          </div>

          {crops.length === 0 ? (
            <div className="bg-white rounded-[2rem] p-12 text-center border-2 border-dashed border-gray-200 hover:border-agro-green transition-colors cursor-pointer group" onClick={onNewCrop}>
               <div className="mx-auto w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mb-6 group-hover:scale-110 transition-transform group-hover:bg-green-50 group-hover:text-agro-green">
                 <Sprout size={40} />
               </div>
               <h3 className="text-xl font-bold text-gray-800">Sua fazenda está vazia</h3>
               <p className="text-gray-500 mb-8 max-w-sm mx-auto">Comece cadastrando seu primeiro talhão para obter previsões de custo e produtividade.</p>
               <button className="bg-agro-green text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-green-200">Criar primeira lavoura</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {crops.map((crop) => {
                const styles = getCropStyle(crop.type);
                const percentDone = Math.floor(Math.random() * 60 + 20); // Mock progress
                
                return (
                  <div 
                    key={crop.id}
                    onClick={() => onSelectCrop(crop)}
                    className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden"
                  >
                    {/* Background Icon Watermark */}
                    <div className="absolute -right-4 -bottom-4 text-[8rem] opacity-5 select-none pointer-events-none grayscale">
                        {styles.icon}
                    </div>
                    
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex gap-4">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${styles.light}`}>
                              {styles.icon}
                          </div>
                          <div>
                             <h3 className="text-lg font-bold text-gray-900 group-hover:text-agro-green transition-colors line-clamp-1">{crop.name}</h3>
                             <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider mt-1 ${styles.light} ${styles.text}`}>
                               {crop.type} • {crop.areaHa} ha
                             </span>
                          </div>
                      </div>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 group-hover:bg-agro-green group-hover:text-white transition-colors`}>
                         <ArrowRight size={18} />
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-gray-500 mb-2 font-bold uppercase tracking-wider">
                        <span>Progresso do Ciclo</span>
                        <span className="text-gray-900">{percentDone}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${styles.bg}`} 
                          style={{ width: `${percentDone}%` }}
                        ></div>
                      </div>
                      
                      <div className="mt-6 pt-4 border-t border-gray-50 flex justify-between items-center">
                         <div className="flex flex-col">
                             <span className="text-xs text-gray-400 font-medium">Colheita Prevista</span>
                             <span className="text-sm font-bold text-gray-800 flex items-center gap-1">
                                <Calendar size={14} className="text-gray-400"/>
                                {new Date(crop.estimatedHarvestDate).toLocaleDateString('pt-BR', {month: 'short', year: '2-digit'})}
                             </span>
                         </div>
                         <div className="flex flex-col text-right">
                             <span className="text-xs text-gray-400 font-medium">Custo Est.</span>
                             <span className="text-sm font-bold text-gray-800">
                                {crop.estimatedCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                             </span>
                         </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar Charts & Tips */}
        <div className="space-y-6">
           <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8">
             <h3 className="font-bold text-gray-900 mb-6 text-lg">Distribuição</h3>
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
                        cornerRadius={6}
                      >
                        {cropTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '12px' }}
                        itemStyle={{ fontWeight: 'bold', color: '#374151' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Custom Legend */}
                  <div className="flex flex-wrap justify-center gap-3 mt-2">
                    {cropTypeData.map((d, i) => (
                      <div key={i} className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }}></div>
                        <span className="text-xs font-bold text-gray-600 capitalize">{d.name}</span>
                      </div>
                    ))}
                  </div>
               </div>
             ) : (
               <div className="h-64 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
                 <CloudSun size={32} className="mb-2 opacity-50"/>
                 <p className="text-sm font-medium">Sem dados suficientes</p>
               </div>
             )}
           </div>

           {/* Tip Card */}
           <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-[2rem] p-8 border border-indigo-100 relative overflow-hidden group hover:shadow-lg transition-all">
              <div className="relative z-10">
                 <div className="bg-white w-10 h-10 rounded-xl flex items-center justify-center mb-4 shadow-sm text-indigo-500">
                    <Sprout size={20} />
                 </div>
                 <h3 className="font-bold text-indigo-900 mb-2 text-lg">Dica Técnica</h3>
                 <p className="text-sm text-indigo-700 leading-relaxed font-medium">
                   "Para aumentar a eficiência da adubação nitrogenada no milho, prefira aplicações parceladas em estádios V4 e V8."
                 </p>
                 <button className="mt-6 text-xs font-extrabold text-indigo-600 bg-white px-4 py-2 rounded-lg shadow-sm hover:bg-indigo-500 hover:text-white transition-colors">
                    LER MAIS
                 </button>
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-indigo-200 rounded-full blur-3xl opacity-50 group-hover:scale-150 transition-transform duration-700"></div>
           </div>
        </div>

      </div>
    </div>
  );
};
