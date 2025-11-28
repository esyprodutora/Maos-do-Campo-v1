import React, { useState } from 'react';
import { CropData, TimelineStage, Material } from '../types';
import { getAssistantResponse } from '../services/geminiService';
import { ArrowLeft, Calendar, DollarSign, ListTodo, MessageSquare, Send, CheckCircle, Circle, AlertCircle, Droplets, Ruler, ShoppingBag } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface CropDetailsProps {
  crop: CropData;
  onBack: () => void;
  onUpdateCrop: (updatedCrop: CropData) => void;
}

export const CropDetails: React.FC<CropDetailsProps> = ({ crop, onBack, onUpdateCrop }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'finance' | 'timeline' | 'assistant'>('overview');
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'ai', text: string}[]>([
    { role: 'ai', text: `Olá! Sou seu assistente para a lavoura ${crop.name}. Como posso ajudar hoje?` }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Helper styles based on crop type
  const getTheme = (type: string) => {
    switch(type) {
      case 'cafe': return { main: 'text-[#8E5A2E]', bg: 'bg-[#8E5A2E]', light: 'bg-[#F6EBE0]' };
      case 'milho': return { main: 'text-[#E67E22]', bg: 'bg-[#E67E22]', light: 'bg-[#FEF5E7]' };
      case 'soja': return { main: 'text-[#F2C94C]', bg: 'bg-[#F2C94C]', light: 'bg-[#FCF3CF]' };
      default: return { main: 'text-agro-green', bg: 'bg-agro-green', light: 'bg-green-50' };
    }
  };
  const theme = getTheme(crop.type);

  const toggleTask = (stageId: string, taskId: string) => {
    const updatedTimeline = crop.timeline.map(stage => {
      if (stage.id === stageId) {
        const updatedTasks = stage.tasks.map(task => 
          task.id === taskId ? { ...task, done: !task.done } : task
        );
        const allDone = updatedTasks.every(t => t.done);
        return { 
          ...stage, 
          tasks: updatedTasks, 
          status: allDone ? 'concluido' : 'em_andamento' 
        } as TimelineStage;
      }
      return stage;
    });
    onUpdateCrop({ ...crop, timeline: updatedTimeline });
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsChatLoading(true);

    const context = `Lavoura: ${crop.name}, Cultura: ${crop.type}, Fase atual: ${crop.timeline.find(t => t.status === 'em_andamento')?.title || 'Planejamento'}`;
    const response = await getAssistantResponse(userMsg, context);

    setChatHistory(prev => [...prev, { role: 'ai', text: response }]);
    setIsChatLoading(false);
  };

  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up">
       <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className={`absolute top-0 right-0 p-10 opacity-5 ${theme.main}`}>
             <Ruler size={100} />
          </div>
          <h3 className="font-bold text-xl text-gray-800 mb-6 flex items-center gap-2">
            <span className={`p-2 rounded-lg ${theme.light} ${theme.main}`}><Ruler size={20}/></span> 
            Dados da Área
          </h3>
          <div className="space-y-5 relative z-10">
             <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
               <span className="text-gray-500 font-medium">Área Total</span>
               <span className="font-bold text-gray-800 text-lg">{crop.areaHa} ha</span>
             </div>
             <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
               <span className="text-gray-500 font-medium">Solo</span>
               <span className="font-bold capitalize text-gray-800">{crop.soilType}</span>
             </div>
             <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
               <span className="text-gray-500 font-medium">Espaçamento</span>
               <span className="font-bold text-gray-800">{crop.spacing}</span>
             </div>
             <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-dashed border-gray-300">
               <span className="text-gray-500 font-medium">Meta</span>
               <span className={`font-bold ${theme.main}`}>{crop.productivityGoal}</span>
             </div>
          </div>
       </div>

       <div className={`p-8 rounded-3xl border relative overflow-hidden flex flex-col justify-between ${theme.light} border-${theme.bg}/20`}>
          <div className="relative z-10">
            <h3 className={`font-bold text-xl mb-4 flex items-center gap-2 ${theme.main}`}>
               <AlertCircle size={24}/> Recomendação Técnica
            </h3>
            <p className="text-gray-700 italic leading-relaxed text-lg font-medium">
              "{crop.aiAdvice}"
            </p>
          </div>
          <div className="mt-8 relative z-10">
            <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${theme.main}`}>Estimativa de Colheita</p>
            <p className="text-3xl font-extrabold text-gray-800">
              {new Date(crop.estimatedHarvestDate).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          {/* Decorative Blob */}
          <div className={`absolute -bottom-10 -right-10 w-40 h-40 rounded-full ${theme.bg} opacity-10 blur-2xl`}></div>
       </div>
    </div>
  );

  const renderFinance = () => {
    const data = crop.materials.map(m => ({
        name: m.category,
        value: m.quantity * m.unitPriceEstimate
    })).reduce((acc: any[], curr) => {
        const found = acc.find(a => a.name === curr.name);
        if (found) found.value += curr.value;
        else acc.push(curr);
        return acc;
    }, []);

    return (
      <div className="space-y-6 animate-slide-up">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           {/* Chart Card */}
           <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
             <h3 className="font-bold text-gray-800 mb-6 text-xl">Distribuição de Custos</h3>
             <div className="h-64 w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={data}>
                   <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} tick={{fill: '#9CA3AF'}} />
                   <Tooltip 
                      cursor={{fill: '#F3F4F6'}}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      formatter={(value: number) => `R$ ${value.toFixed(2)}`} 
                    />
                   <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                     {data.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={['#27AE60', '#F2C94C', '#E74C3C', '#8E44AD'][index % 4]} />
                     ))}
                   </Bar>
                 </BarChart>
               </ResponsiveContainer>
             </div>
             <div className="mt-6 flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
               <p className="text-gray-500 font-medium">Total Estimado</p>
               <p className="text-2xl font-bold text-gray-800">
                 {crop.estimatedCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
               </p>
             </div>
           </div>

           {/* Receipt Card */}
           <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
              <h3 className="font-bold text-gray-800 mb-6 text-xl flex items-center gap-2">
                 <ShoppingBag className="text-agro-green"/> Lista de Compras
              </h3>
              <div className="flex-1 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar bg-white">
                <div className="space-y-3">
                  {crop.materials.map((m, i) => (
                    <div key={i} className="flex justify-between items-center p-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 rounded-lg transition-colors">
                      <div>
                        <p className="font-bold text-gray-700">{m.name}</p>
                        <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">{m.category}</p>
                      </div>
                      <div className="text-right">
                         <p className="font-bold text-gray-800">
                           {(m.quantity * m.unitPriceEstimate).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                         </p>
                         <p className="text-xs text-gray-500">{m.quantity} {m.unit}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
           </div>
        </div>
      </div>
    );
  };

  const renderTimeline = () => (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 animate-slide-up">
      <h3 className="font-bold text-xl text-gray-800 mb-8 pl-4">Linha do Tempo</h3>
      <div className="relative pl-8 border-l-2 border-gray-100 ml-4 space-y-10">
        {crop.timeline.map((stage, index) => (
          <div key={stage.id} className="relative group">
             {/* Timeline Dot */}
             <div className={`
               absolute -left-[43px] top-0 w-8 h-8 rounded-full border-4 border-white shadow-md flex items-center justify-center
               ${stage.status === 'concluido' ? 'bg-agro-green' : stage.status === 'em_andamento' ? 'bg-agro-yellow' : 'bg-gray-200'}
             `}>
               {stage.status === 'concluido' && <CheckCircle size={14} className="text-white"/>}
               {stage.status === 'em_andamento' && <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>}
             </div>
             
             {/* Content */}
             <div className={`
                p-6 rounded-2xl border transition-all duration-300
                ${stage.status === 'em_andamento' ? 'bg-white border-agro-yellow shadow-lg ring-1 ring-agro-yellow/20' : 'bg-gray-50/50 border-gray-100'}
             `}>
               <div className="flex justify-between items-start mb-3">
                 <h4 className={`text-lg font-bold ${stage.status === 'em_andamento' ? 'text-gray-900' : 'text-gray-600'}`}>{stage.title}</h4>
                 <span className="text-xs font-bold font-mono bg-white border border-gray-200 px-3 py-1 rounded-full text-gray-500 shadow-sm">
                   {stage.dateEstimate}
                 </span>
               </div>
               <p className="text-gray-500 mb-5 leading-relaxed">{stage.description}</p>
               
               <div className="grid gap-3">
                 {stage.tasks.map(task => (
                   <div key={task.id} 
                        onClick={() => toggleTask(stage.id, task.id)}
                        className={`
                          flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all border
                          ${task.done 
                            ? 'bg-green-50 border-green-100' 
                            : 'bg-white border-gray-100 hover:border-agro-green hover:shadow-md'}
                        `}>
                     <div className={`
                        w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0
                        ${task.done ? 'bg-agro-green border-agro-green' : 'border-gray-300'}
                     `}>
                        {task.done && <CheckCircle size={14} className="text-white"/>}
                     </div>
                     <span className={`text-sm font-medium ${task.done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                       {task.text}
                     </span>
                   </div>
                 ))}
               </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAssistant = () => (
    <div className="flex flex-col h-[650px] bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden animate-slide-up">
       <div className="bg-agro-green p-6 text-white flex items-center gap-4">
         <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
            <MessageSquare size={28} />
         </div>
         <div>
           <h3 className="font-bold text-lg">Assistente Rural IA</h3>
           <p className="text-sm text-green-100 opacity-90">Especialista em {crop.type}</p>
         </div>
       </div>

       <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
          {chatHistory.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
               <div className={`
                 max-w-[85%] p-5 rounded-2xl text-sm leading-relaxed shadow-sm
                 ${msg.role === 'user' 
                    ? 'bg-agro-green text-white rounded-tr-sm' 
                    : 'bg-white text-gray-800 rounded-tl-sm border border-gray-100'}
               `}>
                 {msg.text}
               </div>
            </div>
          ))}
          {isChatLoading && (
            <div className="flex justify-start">
               <div className="bg-white p-4 rounded-2xl rounded-tl-sm shadow-sm flex gap-2 border border-gray-100">
                 <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                 <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                 <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
               </div>
            </div>
          )}
       </div>

       <form onSubmit={handleChatSubmit} className="p-4 bg-white border-t border-gray-100 flex gap-3">
         <input 
           type="text" 
           value={chatInput}
           onChange={(e) => setChatInput(e.target.value)}
           placeholder="Digite sua dúvida..."
           className="flex-1 p-4 bg-gray-50 border border-transparent focus:bg-white focus:border-agro-green rounded-xl outline-none transition-all font-medium"
         />
         <button 
           type="submit"
           disabled={!chatInput.trim() || isChatLoading}
           className="bg-agro-green text-white p-4 rounded-xl hover:bg-green-700 disabled:opacity-50 transition-transform active:scale-95 shadow-lg shadow-green-600/20"
         >
           <Send size={20} />
         </button>
       </form>
    </div>
  );

  return (
    <div className="space-y-6 pb-20">
      {/* Hero Header */}
      <div className={`rounded-3xl p-6 md:p-10 text-white shadow-xl ${theme.bg} relative overflow-hidden transition-all duration-500`}>
         <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <button onClick={onBack} className="p-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl transition-all">
                <ArrowLeft size={24} className="text-white"/>
              </button>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight">{crop.name}</h1>
                <p className="text-white/80 font-medium mt-1 flex items-center gap-2">
                   <span className="capitalize bg-white/20 px-2 py-0.5 rounded text-sm">{crop.type}</span> 
                   <span>•</span>
                   <span>{crop.areaHa} hectares</span>
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 bg-white/10 p-1.5 rounded-2xl backdrop-blur-sm">
                {[
                  { id: 'overview', label: 'Visão Geral', icon: ListTodo },
                  { id: 'finance', label: 'Financeiro', icon: DollarSign },
                  { id: 'timeline', label: 'Cronograma', icon: Calendar },
                  { id: 'assistant', label: 'IA', icon: MessageSquare },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`
                      flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all
                      ${activeTab === tab.id 
                        ? 'bg-white text-gray-900 shadow-lg scale-105' 
                        : 'text-white hover:bg-white/10'}
                    `}
                  >
                    <tab.icon size={18} />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
            </div>
         </div>
         {/* Decorative Circles */}
         <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
         <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-black/10 rounded-full blur-2xl"></div>
      </div>

      {/* Content Area */}
      <div className="min-h-[500px]">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'finance' && renderFinance()}
        {activeTab === 'timeline' && renderTimeline()}
        {activeTab === 'assistant' && renderAssistant()}
      </div>
    </div>
  );
};