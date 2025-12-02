import React, { useEffect, useState } from 'react';
import { getMarketQuotes } from '../services/marketService';
import { TrendingUp, TrendingDown, RefreshCw, DollarSign, Loader2 } from 'lucide-react';
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts';

interface Quote {
  id: string;
  name: string;
  price: number;
  variation: number;
  trend: 'up' | 'down';
  unit: string;
  color: string;
  history: any[];
}

export const Quotes: React.FC = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  // Tenta ler as lavouras do localStorage para personalizar a ordem
  const getUserCrops = () => {
      try {
          const localData = localStorage.getItem('maos-do-campo-crops');
          if (localData) {
              const parsed = JSON.parse(localData);
              return parsed.map((c: any) => c.type);
          }
      } catch (e) {}
      return [];
  };

  const fetchData = async () => {
    setLoading(true);
    const data = await getMarketQuotes();
    const userCropTypes = getUserCrops();

    // Ordena: Dólar primeiro, depois culturas do usuário, depois o resto
    // @ts-ignore
    const sortedData = data.sort((a, b) => {
        if (a.id === 'usd') return -1;
        if (b.id === 'usd') return 1;
        
        const aIsUser = userCropTypes.includes(a.id);
        const bIsUser = userCropTypes.includes(b.id);
        
        if (aIsUser && !bIsUser) return -1;
        if (!aIsUser && bIsUser) return 1;
        return 0;
    });

    // @ts-ignore
    setQuotes(sortedData);
    setLastUpdate(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Cotações</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Mercado Físico & B3
          </p>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
           <span>Atualizado às <strong>{lastUpdate}</strong></span>
           <button onClick={fetchData} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors" title="Atualizar">
             <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
           </button>
        </div>
      </div>

      {loading && quotes.length === 0 ? (
         <div className="flex items-center justify-center h-64">
            <Loader2 size={40} className="animate-spin text-agro-green" />
         </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {quotes.map((quote) => (
            <div 
              key={quote.id} 
              className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-md transition-all relative overflow-hidden group"
            >
               {/* Color Accent */}
               <div className="absolute top-0 left-0 w-2 h-full" style={{ backgroundColor: quote.color }}></div>
               
               <div className="flex justify-between items-start mb-6 pl-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                       <span className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{quote.name}</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                       <span className="text-xs font-medium text-gray-400 self-start mt-1">R$</span>
                       <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                         {quote.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                       </h2>
                    </div>
                    <p className="text-xs text-gray-400 font-medium mt-1">/ {quote.unit}</p>
                  </div>

                  <div className={`
                    flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-sm
                    ${quote.variation >= 0 
                       ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' 
                       : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'}
                  `}>
                    {quote.variation >= 0 ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}
                    {Math.abs(quote.variation).toFixed(2)}%
                  </div>
               </div>

               {/* Mini Chart */}
               <div className="h-24 w-full pl-2">
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={quote.history}>
                     <defs>
                       <linearGradient id={`color-${quote.id}`} x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor={quote.color} stopOpacity={0.3}/>
                         <stop offset="95%" stopColor={quote.color} stopOpacity={0}/>
                       </linearGradient>
                     </defs>
                     <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        itemStyle={{ color: quote.color, fontWeight: 'bold' }}
                        formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Valor']}
                        labelStyle={{ display: 'none' }}
                     />
                     <Area 
                       type="monotone" 
                       dataKey="value" 
                       stroke={quote.color} 
                       strokeWidth={3}
                       fillOpacity={1} 
                       fill={`url(#color-${quote.id})`} 
                     />
                   </AreaChart>
                 </ResponsiveContainer>
               </div>
            </div>
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-700 text-xs text-gray-500 dark:text-gray-400 flex items-start gap-2">
         <div className="mt-0.5"><DollarSign size={14}/></div>
         <p>
           Os valores são referências de mercado (CEPEA/ESALQ e B3) com atualização diária simulada. Para negociações reais, consulte sempre sua cooperativa ou corretora local.
         </p>
      </div>
    </div>
  );
};
