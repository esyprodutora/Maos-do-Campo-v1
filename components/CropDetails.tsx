
import React, { useState, useEffect } from 'react';
import { CropData, TimelineStage, StageResource, ResourceType } from '../types';
import { getAssistantResponse } from '../services/geminiService';
import { Reports } from './Reports';
import { 
  ArrowLeft, Calendar, DollarSign, ListTodo, MessageSquare, Send, 
  CheckCircle, Circle, AlertCircle, Droplets, Ruler, ShoppingBag, 
  Download, Loader2, Edit2, Check, MapPin, Navigation, Trash2, 
  Plus, X, Clock, Sprout, FileText, Home, Sparkles, Bot, 
  MessageCircle, Warehouse, Package, Truck, TrendingUp, Wallet, 
  User, Tractor, Hammer, ChevronDown, ChevronUp, Beaker
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { GOOGLE_MAPS_API_KEY } from '../config/env';

interface CropDetailsProps {
  crop: CropData;
  onBack: () => void;
  onUpdateCrop: (updatedCrop: CropData) => void;
  onDeleteCrop: () => void;
}

export const CropDetails: React.FC<CropDetailsProps> = ({ crop, onBack, onUpdateCrop, onDeleteCrop }) => {
  // Changed default tab to 'timeline' to prioritize stages
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'finance' | 'storage' | 'assistant' | 'reports'>('timeline');
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'ai', text: string}[]>([
    { role: 'ai', text: `Olá. Sou o Tonico. Estou analisando o ciclo da sua lavoura de ${crop.name}. Como posso ajudar?` }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  const mapsApiKey = GOOGLE_MAPS_API_KEY;

  // --- States for Timeline ---
  const [expandedStageId, setExpandedStageId] = useState<string | null>(crop.timeline?.[0]?.id || null);
  const [isEditingTimeline, setIsEditingTimeline] = useState(false);

  // --- Theme Helper ---
  const getTheme = (type: string) => {
    switch(type) {
      case 'cafe': return { main: 'text-[#A67C52]', bg: 'bg-[#A67C52]', bgGlass: 'bg-[#A67C52]/90', border: 'border-[#A67C52]/30', light: 'bg-[#FAF3E0] dark:bg-[#A67C52]/20', gradient: 'from-[#A67C52] to-[#8B6642]' };
      case 'milho': return { main: 'text-orange-500', bg: 'bg-orange-500', bgGlass: 'bg-orange-500/90', border: 'border-orange-500/30', light: 'bg-orange-50 dark:bg-orange-500/20', gradient: 'from-orange-500 to-orange-600' };
      case 'soja': return { main: 'text-yellow-500', bg: 'bg-yellow-500', bgGlass: 'bg-yellow-500/90', border: 'border-yellow-500/30', light: 'bg-yellow-50 dark:bg-yellow-500/20', gradient: 'from-yellow-500 to-yellow-600' };
      default: return { main: 'text-agro-green', bg: 'bg-agro-green', bgGlass: 'bg-agro-green/90', border: 'border-agro-green/30', light: 'bg-green-50 dark:bg-green-900/20', gradient: 'from-agro-green to-green-700' };
    }
  };
  const theme = getTheme(crop.type);

  // --- Handlers ---

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsChatLoading(true);
    const context = `Lavoura: ${crop.name}, ${crop.areaHa}ha de ${crop.type}.`;
    const response = await getAssistantResponse(userMsg, context);
    setChatHistory(prev => [...prev, { role: 'ai', text: response }]);
    setIsChatLoading(false);
  };

  const toggleTask = (stageId: string, taskId: string) => {
    const updatedTimeline = crop.timeline.map(stage => {
        if (stage.id === stageId) {
            const updatedTasks = stage.tasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t);
            return { ...stage, tasks: updatedTasks };
        }
        return stage;
    });
    onUpdateCrop({ ...crop, timeline: updatedTimeline });
  };

  // --- Calculation Helpers ---
  const getTotalCost = () => {
      if (!crop.timeline) return 0;
      return crop.timeline.reduce((acc, stage) => {
          const stageCost = stage.resources ? stage.resources.reduce((sAcc, res) => sAcc + (res.totalCost || 0), 0) : 0;
          return acc + stageCost;
      }, 0);
  };

  const getResourcesByCategory = () => {
      const breakdown = { insumo: 0, maquinario: 0, mao_de_obra: 0, outros: 0 };
      crop.timeline?.forEach(stage => {
          stage.resources?.forEach(res => {
              if (breakdown[res.type] !== undefined) {
                  breakdown[res.type] += res.totalCost;
              } else {
                  breakdown['outros'] += res.totalCost;
              }
          });
      });
      return Object.entries(breakdown).map(([name, value]) => ({ name, value })).filter(x => x.value > 0);
  };

  // --- Renderers ---

  const renderOverview = () => (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up">
         <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 relative overflow-hidden group">
            <div className={`absolute top-0 right-0 p-10 opacity-5 ${theme.main}`}><Ruler size={100} /></div>
            <h3 className="font-bold text-xl text-gray-800 dark:text-white mb-6 flex items-center gap-2">
              <span className={`p-2 rounded-lg ${theme.light} ${theme.main}`}><Ruler size={20}/></span> Dados da Área
            </h3>
            <div className="space-y-5 relative z-10">
               <div className="flex justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-xl"><span className="text-gray-500 dark:text-gray-300 font-medium">Área Total</span><span className="font-bold text-gray-800 dark:text-white text-lg">{crop.areaHa} ha</span></div>
               <div className="flex justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-xl"><span className="text-gray-500 dark:text-gray-300 font-medium">Solo</span><span className="font-bold capitalize text-gray-800 dark:text-white">{crop.soilType}</span></div>
               <div className="flex justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-xl"><span className="text-gray-500 dark:text-gray-300 font-medium">Espaçamento</span><span className="font-bold text-gray-800 dark:text-white">{crop.spacing}</span></div>
            </div>
         </div>
         <div className="flex flex-col gap-6">
             <div className={`p-8 rounded-3xl border relative overflow-hidden flex flex-col justify-between ${theme.light} ${theme.border} flex-1`}>
                <div className="relative z-10"><h3 className={`font-bold text-xl mb-4 flex items-center gap-3 ${theme.main}`}><img src="/tonyk.png" className="w-10 h-10 rounded-full border-2 border-white/30 object-cover" alt="Tonico" onError={(e) => (e.currentTarget.src = 'https://cdn-icons-png.flaticon.com/512/4712/4712035.png')} /><span>Dica Técnica</span></h3><p className="text-gray-700 dark:text-gray-200 italic leading-relaxed text-lg font-medium">"{crop.aiAdvice}"</p></div>
                <div className="mt-8 relative z-10"><p className={`text-xs font-bold uppercase tracking-wider mb-1 ${theme.main}`}>Colheita Estimada</p><p className="text-3xl font-extrabold text-gray-800 dark:text-white">{new Date(crop.estimatedHarvestDate).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p></div>
             </div>
             {crop.coordinates && (
               <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
                  <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2"><MapPin className="text-agro-green" size={20}/> Localização</h3>
                  {mapsApiKey ? (
                      <div className="relative w-full h-40 bg-gray-200 dark:bg-slate-700 rounded-xl overflow-hidden mb-4"><iframe width="100%" height="100%" frameBorder="0" style={{ border: 0 }} src={`https://www.google.com/maps/embed/v1/place?key=${mapsApiKey}&q=${crop.coordinates.lat},${crop.coordinates.lng}&maptype=satellite&zoom=15`} allowFullScreen></iframe></div>
                  ) : <div className="w-full h-40 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-xs">Mapa Indisponível</div>}
               </div>
             )}
         </div>
      </div>
  );

  const renderTimeline = () => (
    <div className="space-y-6 animate-slide-up">
        <div className="flex items-center justify-between mb-2">
            <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Etapas da Lavoura</h3>
                <p className="text-sm text-gray-500">Ciclo completo, do preparo à entrega.</p>
            </div>
            <button 
                onClick={() => setIsEditingTimeline(!isEditingTimeline)}
                className="p-2.5 rounded-xl bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 text-gray-700 dark:text-gray-200 transition-colors"
            >
                {isEditingTimeline ? <Check size={20} /> : <Edit2 size={20} />}
            </button>
        </div>

        <div className="relative pl-4 ml-2 border-l-2 border-dashed border-gray-200 dark:border-slate-700 space-y-8">
            {crop.timeline?.map((stage, index) => {
                const stageCost = stage.resources?.reduce((acc, r) => acc + r.totalCost, 0) || 0;
                const isExpanded = expandedStageId === stage.id;
                const statusColor = stage.status === 'concluido' ? 'bg-agro-green' : stage.status === 'em_andamento' ? 'bg-blue-500' : 'bg-gray-300 dark:bg-slate-600';

                return (
                    <div key={stage.id} className="relative">
                        {/* Dot */}
                        <div className={`absolute -left-[27px] top-6 w-5 h-5 rounded-full border-4 border-white dark:border-slate-900 ${statusColor} shadow-sm z-10`}></div>
                        
                        {/* Card */}
                        <div className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden transition-all duration-300 ${isExpanded ? 'ring-2 ring-agro-green/20' : ''}`}>
                            
                            {/* Header */}
                            <div 
                                onClick={() => setExpandedStageId(isExpanded ? null : stage.id)}
                                className="p-5 cursor-pointer flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${stage.status === 'concluido' ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-700 dark:bg-slate-700 dark:text-blue-400'}`}>
                                        {index + 1}
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-gray-900 dark:text-white">{stage.title}</h4>
                                        <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                            <span className="flex items-center gap-1"><Calendar size={14}/> {stage.dateEstimate}</span>
                                            {stageCost > 0 && <span className="flex items-center gap-1 font-medium text-gray-700 dark:text-gray-300"><DollarSign size={14}/> {stageCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-gray-400">
                                    {isExpanded ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                                </div>
                            </div>

                            {/* Expanded Content */}
                            {isExpanded && (
                                <div className="px-5 pb-5 pt-0 border-t border-gray-100 dark:border-slate-700 animate-fade-in">
                                    <p className="text-gray-600 dark:text-gray-300 my-4 text-sm leading-relaxed">{stage.description}</p>
                                    
                                    {/* Checklist */}
                                    <div className="mb-6">
                                        <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Tarefas</h5>
                                        <div className="space-y-2">
                                            {stage.tasks?.map((task) => (
                                                <div key={task.id} onClick={() => !isEditingTimeline && toggleTask(stage.id, task.id)} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                                                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${task.done ? 'bg-agro-green border-agro-green' : 'border-gray-300'}`}>
                                                        {task.done && <Check size={12} className="text-white"/>}
                                                    </div>
                                                    <span className={`text-sm ${task.done ? 'text-gray-400 line-through' : 'text-gray-700 dark:text-gray-200'}`}>{task.text}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Resources Grid */}
                                    <div>
                                        <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Recursos & Custos</h5>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            {/* Insumos */}
                                            <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-xl border border-green-100 dark:border-green-900/20">
                                                <div className="flex items-center gap-2 mb-3 text-green-700 dark:text-green-400 font-bold text-sm">
                                                    <Beaker size={16} /> Insumos
                                                </div>
                                                <ul className="space-y-2">
                                                    {stage.resources?.filter(r => r.type === 'insumo').map(r => (
                                                        <li key={r.id} className="flex justify-between text-xs text-gray-600 dark:text-gray-300 border-b border-green-200/30 pb-1 last:border-0">
                                                            <span>{r.name} <span className="opacity-50">({r.quantity} {r.unit})</span></span>
                                                            <span className="font-bold">{r.totalCost.toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}</span>
                                                        </li>
                                                    ))}
                                                    {stage.resources?.filter(r => r.type === 'insumo').length === 0 && <span className="text-xs text-gray-400 italic">Nenhum insumo</span>}
                                                </ul>
                                            </div>

                                            {/* Maquinario */}
                                            <div className="bg-orange-50 dark:bg-orange-900/10 p-4 rounded-xl border border-orange-100 dark:border-orange-900/20">
                                                <div className="flex items-center gap-2 mb-3 text-orange-700 dark:text-orange-400 font-bold text-sm">
                                                    <Tractor size={16} /> Maquinário
                                                </div>
                                                <ul className="space-y-2">
                                                    {stage.resources?.filter(r => r.type === 'maquinario').map(r => (
                                                        <li key={r.id} className="flex justify-between text-xs text-gray-600 dark:text-gray-300 border-b border-orange-200/30 pb-1 last:border-0">
                                                            <span>{r.name} <span className="opacity-50">({r.quantity} {r.unit})</span></span>
                                                            <span className="font-bold">{r.totalCost.toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}</span>
                                                        </li>
                                                    ))}
                                                     {stage.resources?.filter(r => r.type === 'maquinario').length === 0 && <span className="text-xs text-gray-400 italic">Nenhum maquinário</span>}
                                                </ul>
                                            </div>

                                            {/* Mão de Obra */}
                                            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/20">
                                                <div className="flex items-center gap-2 mb-3 text-blue-700 dark:text-blue-400 font-bold text-sm">
                                                    <User size={16} /> Mão de Obra
                                                </div>
                                                <ul className="space-y-2">
                                                    {stage.resources?.filter(r => r.type === 'mao_de_obra').map(r => (
                                                        <li key={r.id} className="flex justify-between text-xs text-gray-600 dark:text-gray-300 border-b border-blue-200/30 pb-1 last:border-0">
                                                            <span>{r.name} <span className="opacity-50">({r.quantity} {r.unit})</span></span>
                                                            <span className="font-bold">{r.totalCost.toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}</span>
                                                        </li>
                                                    ))}
                                                     {stage.resources?.filter(r => r.type === 'mao_de_obra').length === 0 && <span className="text-xs text-gray-400 italic">Nenhuma MO</span>}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
  );

  const renderFinance = () => {
    const totalCost = getTotalCost();
    const categories = getResourcesByCategory();
    const COLORS = {'insumo': '#27AE60', 'maquinario': '#E67E22', 'mao_de_obra': '#2980B9', 'outros': '#95A5A6'};
    const LABELS = {'insumo': 'Insumos', 'maquinario': 'Maquinário', 'mao_de_obra': 'Mão de Obra', 'outros': 'Outros'};

    // Flatten all resources for the table
    const allResources = crop.timeline?.flatMap(stage => 
        stage.resources?.map(r => ({...r, stageName: stage.title})) || []
    ) || [];

    return (
      <div className="space-y-6 animate-slide-up">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
                <h3 className="font-bold text-gray-800 dark:text-white mb-6">Custo Total da Lavoura</h3>
                <div className="flex flex-col items-center justify-center h-48">
                    <span className="text-4xl font-extrabold text-gray-900 dark:text-white">
                        {totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                    </span>
                    <span className="text-gray-500 text-sm mt-2">Custo estimado por hectare: {(totalCost / crop.areaHa).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}/ha</span>
                </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
                <h3 className="font-bold text-gray-800 dark:text-white mb-2">Distribuição por Categoria</h3>
                <div className="h-48 w-full">
                   <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <Pie
                             data={categories}
                             innerRadius={50}
                             outerRadius={70}
                             paddingAngle={5}
                             dataKey="value"
                          >
                             {categories.map((entry: any, index) => (
                                 <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#888'} />
                             ))}
                          </Pie>
                          <Tooltip formatter={(value:number) => value.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})} />
                          <Legend formatter={(value) => LABELS[value as keyof typeof LABELS] || value}/>
                      </PieChart>
                   </ResponsiveContainer>
                </div>
            </div>
         </div>

         <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
            <h3 className="font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2"><ShoppingBag size={20}/> Detalhamento de Recursos</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-gray-300 font-bold uppercase text-xs">
                        <tr>
                            <th className="p-3 rounded-l-xl">Item</th>
                            <th className="p-3">Categoria</th>
                            <th className="p-3">Etapa</th>
                            <th className="p-3 text-right">Qtd</th>
                            <th className="p-3 text-right rounded-r-xl">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                        {allResources.map((res, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                <td className="p-3 font-medium text-gray-900 dark:text-white">{res.name}</td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase
                                        ${res.type === 'insumo' ? 'bg-green-100 text-green-700' :
                                          res.type === 'maquinario' ? 'bg-orange-100 text-orange-700' : 
                                          'bg-blue-100 text-blue-700'}
                                    `}>
                                        {res.type}
                                    </span>
                                </td>
                                <td className="p-3 text-gray-500">{res.stageName}</td>
                                <td className="p-3 text-right text-gray-600 dark:text-gray-300">{res.quantity} {res.unit}</td>
                                <td className="p-3 text-right font-bold text-gray-900 dark:text-white">{res.totalCost.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
         </div>
      </div>
    );
  };

  const renderStorage = () => <div className="p-10 text-center text-gray-500">Módulo de Estoque em Desenvolvimento</div>;

  const renderAssistant = () => (
    <div className="flex flex-col h-[500px] bg-white dark:bg-slate-800 rounded-3xl p-4 border border-gray-100 dark:border-slate-700 shadow-sm">
        <div className="bg-agro-green/10 p-4 rounded-xl mb-4 flex items-center gap-3">
             <div className="bg-white p-2 rounded-full shadow-sm"><img src="/tonyk.png" className="w-8 h-8 rounded-full" onError={(e) => e.currentTarget.src='https://cdn-icons-png.flaticon.com/512/4712/4712035.png'}/></div>
             <div><h4 className="font-bold text-agro-green">Tonico</h4><p className="text-xs text-gray-600 dark:text-gray-300">Consultor Técnico Digital</p></div>
        </div>
        <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2 custom-scrollbar">
            {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-agro-green text-white rounded-tr-sm' : 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-tl-sm'}`}>
                        {msg.text}
                    </div>
                </div>
            ))}
            {isChatLoading && <div className="text-center text-xs text-gray-400 animate-pulse">Digitando...</div>}
        </div>
        <form onSubmit={handleChatSubmit} className="flex gap-2">
            <input value={chatInput} onChange={e=>setChatInput(e.target.value)} className="flex-1 p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:border-agro-green transition-colors dark:text-white" placeholder="Pergunte sobre sua lavoura..." />
            <button type="submit" disabled={!chatInput.trim()} className="p-3 bg-agro-green text-white rounded-xl hover:bg-green-700 disabled:opacity-50"><Send size={20}/></button>
        </form>
    </div>
  );

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* Header */}
      <div className={`rounded-b-3xl md:rounded-3xl shadow-xl p-6 text-white bg-gradient-to-br ${theme.gradient} relative overflow-hidden`}>
         <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
                <button onClick={onBack} className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors backdrop-blur-sm"><ArrowLeft/></button>
                <div className="flex gap-2">
                    <button onClick={() => setActiveTab('assistant')} className="bg-white/20 p-2 rounded-xl backdrop-blur-sm"><MessageCircle/></button>
                    <button onClick={onDeleteCrop} className="bg-red-500/20 hover:bg-red-500/40 p-2 rounded-xl backdrop-blur-sm"><Trash2/></button>
                </div>
            </div>
            
            <div>
                <h1 className="text-3xl font-extrabold mb-2">{crop.name}</h1>
                <div className="flex items-center gap-3 text-white/80 text-sm font-medium">
                    <span className="capitalize px-3 py-1 bg-white/20 rounded-full">{crop.type}</span>
                    <span>•</span>
                    <span>{crop.areaHa} hectares</span>
                </div>
            </div>

            <div className="flex gap-2 mt-8 overflow-x-auto pb-2 no-scrollbar">
                {[
                    {id: 'overview', label: 'Resumo', icon: Home},
                    {id: 'timeline', label: 'Etapas', icon: ListTodo},
                    {id: 'finance', label: 'Custos', icon: DollarSign},
                    {id: 'storage', label: 'Estoque', icon: Warehouse},
                    {id: 'reports', label: 'Relatórios', icon: FileText}
                ].map(tab => (
                    <button 
                        key={tab.id} 
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`
                            flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all
                            ${activeTab === tab.id ? 'bg-white text-gray-900 shadow-lg' : 'bg-white/10 hover:bg-white/20 text-white'}
                        `}
                    >
                        <tab.icon size={16}/> {tab.label}
                    </button>
                ))}
            </div>
         </div>
         {/* Decor */}
         <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      <div className="min-h-[500px] px-1 pb-24">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'timeline' && renderTimeline()}
        {activeTab === 'finance' && renderFinance()}
        {activeTab === 'storage' && renderStorage()}
        {activeTab === 'assistant' && renderAssistant()}
        {activeTab === 'reports' && <Reports crop={crop} />}
      </div>
    </div>
  );
};
