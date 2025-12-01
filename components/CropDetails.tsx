import React, { useState } from 'react';
import { CropData, TimelineStage, Material, HarvestLog } from '../types';
import { getAssistantResponse } from '../services/geminiService';
import { ArrowLeft, Calendar, DollarSign, ListTodo, MessageSquare, Send, CheckCircle, Circle, AlertCircle, Droplets, Ruler, ShoppingBag, Download, Loader2, Edit2, Check, MapPin, Navigation, Trash2, Plus, X, Clock, Sprout, FileText, Home, Sparkles, Bot, MessageCircle, Warehouse, Package, Truck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
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
  // Adicionado 'storage' às tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'finance' | 'timeline' | 'storage' | 'assistant' | 'reports'>('overview');
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'ai', text: string}[]>([
    { role: 'ai', text: `Olá! Sou seu assistente para a lavoura ${crop.name}. Como posso ajudar hoje?` }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  const mapsApiKey = GOOGLE_MAPS_API_KEY;
  
  // State for Editing
  const [isEditingPrices, setIsEditingPrices] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItem, setNewItem] = useState<Material>({
    name: '',
    quantity: 0,
    unit: 'un',
    unitPriceEstimate: 0,
    category: 'outros'
  });

  // State for Timeline Editing
  const [isEditingTimeline, setIsEditingTimeline] = useState(false);

  // State for Harvest/Storage
  const [isAddingHarvest, setIsAddingHarvest] = useState(false);
  const [newHarvest, setNewHarvest] = useState<HarvestLog>({
      id: '',
      date: new Date().toISOString().split('T')[0],
      quantity: 0,
      unit: 'sc',
      location: '',
      qualityNote: ''
  });

  // Helper styles based on crop type
  const getTheme = (type: string) => {
    switch(type) {
      case 'cafe': return { main: 'text-[#A67C52]', bg: 'bg-[#A67C52]', bgGlass: 'bg-[#A67C52]/85', bgSoft: 'bg-[#A67C52]/10', border: 'border-[#A67C52]/20', light: 'bg-[#FAF3E0] dark:bg-[#A67C52]/20', gradient: 'from-[#A67C52] to-[#8B6642]' };
      case 'milho': return { main: 'text-orange-500', bg: 'bg-orange-500', bgGlass: 'bg-orange-500/85', bgSoft: 'bg-orange-500/10', border: 'border-orange-500/20', light: 'bg-orange-50 dark:bg-orange-500/20', gradient: 'from-orange-500 to-orange-600' };
      case 'soja': return { main: 'text-yellow-500', bg: 'bg-yellow-500', bgGlass: 'bg-yellow-500/85', bgSoft: 'bg-yellow-500/10', border: 'border-yellow-500/20', light: 'bg-yellow-50 dark:bg-yellow-500/20', gradient: 'from-yellow-500 to-yellow-600' };
      case 'cana': return { main: 'text-green-600', bg: 'bg-green-600', bgGlass: 'bg-green-600/85', bgSoft: 'bg-green-600/10', border: 'border-green-600/20', light: 'bg-green-100 dark:bg-green-600/20', gradient: 'from-green-600 to-green-700' };
      case 'algodao': return { main: 'text-slate-500 dark:text-slate-300', bg: 'bg-slate-500', bgGlass: 'bg-slate-500/85', bgSoft: 'bg-slate-500/10', border: 'border-slate-500/20', light: 'bg-slate-100 dark:bg-slate-500/20', gradient: 'from-slate-500 to-slate-600' };
      case 'arroz': return { main: 'text-yellow-600', bg: 'bg-yellow-400', bgGlass: 'bg-yellow-400/85', bgSoft: 'bg-yellow-400/10', border: 'border-yellow-400/20', light: 'bg-yellow-50 dark:bg-yellow-400/20', gradient: 'from-yellow-400 to-yellow-500' };
      case 'feijao': return { main: 'text-red-700', bg: 'bg-red-700', bgGlass: 'bg-red-700/85', bgSoft: 'bg-red-700/10', border: 'border-red-700/20', light: 'bg-red-50 dark:bg-red-700/20', gradient: 'from-red-700 to-red-800' };
      case 'trigo': return { main: 'text-amber-500', bg: 'bg-amber-500', bgGlass: 'bg-amber-500/85', bgSoft: 'bg-amber-500/10', border: 'border-amber-500/20', light: 'bg-amber-50 dark:bg-amber-500/20', gradient: 'from-amber-500 to-amber-600' };
      case 'laranja': return { main: 'text-orange-600', bg: 'bg-orange-600', bgGlass: 'bg-orange-600/85', bgSoft: 'bg-orange-600/10', border: 'border-orange-600/20', light: 'bg-orange-100 dark:bg-orange-600/20', gradient: 'from-orange-600 to-orange-700' };
      case 'mandioca': return { main: 'text-amber-800', bg: 'bg-amber-800', bgGlass: 'bg-amber-800/85', bgSoft: 'bg-amber-800/10', border: 'border-amber-800/20', light: 'bg-amber-100 dark:bg-amber-800/20', gradient: 'from-amber-800 to-amber-900' };
      default: return { main: 'text-agro-green', bg: 'bg-agro-green', bgGlass: 'bg-agro-green/85', bgSoft: 'bg-agro-green/10', border: 'border-agro-green/20', light: 'bg-green-50 dark:bg-green-900/20', gradient: 'from-agro-green to-green-700' };
    }
  };
  const theme = getTheme(crop.type);

  // --- Handlers ---
  
  // Timeline
  const toggleTask = (stageId: string, taskId: string) => {
    const updatedTimeline = (crop.timeline || []).map(stage => {
      if (stage.id === stageId) {
        const updatedTasks = stage.tasks.map(task => 
          task.id === taskId ? { ...task, done: !task.done } : task
        );
        const allDone = updatedTasks.every(t => t.done);
        const someDone = updatedTasks.some(t => t.done);
        let newStatus: 'pendente' | 'em_andamento' | 'concluido' = 'pendente';
        if (allDone && updatedTasks.length > 0) newStatus = 'concluido';
        else if (someDone) newStatus = 'em_andamento';
        return { ...stage, tasks: updatedTasks, status: newStatus } as TimelineStage;
      }
      return stage;
    });
    onUpdateCrop({ ...crop, timeline: updatedTimeline });
  };
  
  const handleAddStage = () => {
    const newStage: TimelineStage = {
      id: Math.random().toString(36).substr(2, 9),
      title: 'Nova Etapa',
      description: 'Descrição da etapa...',
      status: 'pendente',
      dateEstimate: new Date().toLocaleDateString('pt-BR'),
      tasks: []
    };
    onUpdateCrop({ ...crop, timeline: [...(crop.timeline || []), newStage] });
  };

  const handleRemoveStage = (index: number) => {
    if (!confirm("Excluir esta etapa?")) return;
    const updatedTimeline = [...(crop.timeline || [])];
    updatedTimeline.splice(index, 1);
    onUpdateCrop({ ...crop, timeline: updatedTimeline });
  };

  const handleUpdateStage = (index: number, field: keyof TimelineStage, value: any) => {
    const updatedTimeline = [...(crop.timeline || [])];
    updatedTimeline[index] = { ...updatedTimeline[index], [field]: value };
    onUpdateCrop({ ...crop, timeline: updatedTimeline });
  };

  // Finance
  const handleUpdateMaterial = (index: number, field: 'quantity' | 'unitPriceEstimate', value: string) => {
    const numValue = parseFloat(value);
    const updatedMaterials = [...(crop.materials || [])];
    if (!updatedMaterials[index]) return;
    const item = { ...updatedMaterials[index] };
    item[field] = isNaN(numValue) ? 0 : numValue;
    updatedMaterials[index] = item;
    const newTotalCost = updatedMaterials.reduce((acc, m) => acc + (m.quantity * m.unitPriceEstimate), 0);
    onUpdateCrop({ ...crop, materials: updatedMaterials, estimatedCost: newTotalCost });
  };

  const handleRemoveItem = (index: number) => {
    if(!confirm("Deseja excluir este item?")) return;
    const updatedMaterials = [...(crop.materials || [])];
    updatedMaterials.splice(index, 1);
    const newTotalCost = updatedMaterials.reduce((acc, m) => acc + (m.quantity * m.unitPriceEstimate), 0);
    onUpdateCrop({ ...crop, materials: updatedMaterials, estimatedCost: newTotalCost });
  };

  const handleAddItem = () => {
    if (!newItem.name) return alert("Preencha o nome do item");
    const updatedMaterials = [...(crop.materials || []), newItem];
    const newTotalCost = updatedMaterials.reduce((acc, m) => acc + (m.quantity * m.unitPriceEstimate), 0);
    onUpdateCrop({ ...crop, materials: updatedMaterials, estimatedCost: newTotalCost });
    setNewItem({ name: '', quantity: 0, unit: 'un', unitPriceEstimate: 0, category: 'outros' });
    setIsAddingItem(false);
  };

  // Harvest / Storage Handlers
  const handleAddHarvest = () => {
      if(newHarvest.quantity <= 0) return alert("Quantidade deve ser maior que zero.");
      
      const harvestItem = { ...newHarvest, id: Math.random().toString(36).substr(2, 9) };
      const updatedLogs = [...(crop.harvestLogs || []), harvestItem];
      
      onUpdateCrop({ ...crop, harvestLogs: updatedLogs });
      setNewHarvest({ ...newHarvest, quantity: 0, qualityNote: '' });
      setIsAddingHarvest(false);
  };

  const handleDeleteHarvest = (id: string) => {
      if(!confirm("Excluir este registro de colheita?")) return;
      const updatedLogs = (crop.harvestLogs || []).filter(h => h.id !== id);
      onUpdateCrop({ ...crop, harvestLogs: updatedLogs });
  };

  // Chat & PDF
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsChatLoading(true);
    const timelineStatus = crop.timeline?.find(t => t.status === 'em_andamento')?.title || 'Planejamento';
    const context = `Lavoura: ${crop.name}, Cultura: ${crop.type}, Fase atual: ${timelineStatus}`;
    const response = await getAssistantResponse(userMsg, context);
    setChatHistory(prev => [...prev, { role: 'ai', text: response }]);
    setIsChatLoading(false);
  };

  const generatePDF = () => {
    setIsGeneratingPdf(true);
    const doc = new jsPDF();
    doc.setFillColor(39, 174, 96);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('MÃOS DO CAMPO', 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text('Relatório de Planejamento de Safra', 105, 22, { align: 'center' });
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(14);
    doc.text(`Lavoura: ${crop.name}`, 14, 45);
    const materials = crop.materials || [];
    const tableData = materials.map(m => [
      m.name, m.category, `${m.quantity} ${m.unit}`, `R$ ${m.unitPriceEstimate.toFixed(2)}`, `R$ ${(m.quantity * m.unitPriceEstimate).toFixed(2)}`
    ]);
    autoTable(doc, { startY: 75, head: [['Item', 'Categoria', 'Qtd', 'Unit.', 'Total']], body: tableData });
    doc.save(`plano_${crop.name}.pdf`);
    setIsGeneratingPdf(false);
  };

  // --- Render Sections ---

  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up">
       <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 relative overflow-hidden group">
          <div className={`absolute top-0 right-0 p-10 opacity-5 ${theme.main}`}>
             <Ruler size={100} />
          </div>
          <h3 className="font-bold text-xl text-gray-800 dark:text-white mb-6 flex items-center gap-2">
            <span className={`p-2 rounded-lg ${theme.light} ${theme.main}`}><Ruler size={20}/></span> 
            Dados da Área
          </h3>
          <div className="space-y-5 relative z-10">
             <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700 rounded-xl">
               <span className="text-gray-500 dark:text-gray-300 font-medium">Área Total</span>
               <span className="font-bold text-gray-800 dark:text-white text-lg">{crop.areaHa} ha</span>
             </div>
             <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700 rounded-xl">
               <span className="text-gray-500 dark:text-gray-300 font-medium">Solo</span>
               <span className="font-bold capitalize text-gray-800 dark:text-white">{crop.soilType}</span>
             </div>
             <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700 rounded-xl">
               <span className="text-gray-500 dark:text-gray-300 font-medium">Espaçamento</span>
               <span className="font-bold text-gray-800 dark:text-white">{crop.spacing}</span>
             </div>
             <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700 rounded-xl border border-dashed border-gray-300 dark:border-slate-600">
               <span className="text-gray-500 dark:text-gray-300 font-medium">Meta</span>
               <span className={`font-bold ${theme.main}`}>{crop.productivityGoal}</span>
             </div>
          </div>
       </div>
       {/* ... Map Component ... */}
       {crop.coordinates && (
             <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
                <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <MapPin className="text-agro-green" size={20}/> Localização
                </h3>
                {mapsApiKey ? (
                    <div className="relative w-full h-40 bg-gray-200 dark:bg-slate-700 rounded-xl overflow-hidden mb-4 group cursor-pointer">
                        <iframe
                            width="100%"
                            height="100%"
                            frameBorder="0"
                            style={{ border: 0 }}
                            src={`https://www.google.com/maps/embed/v1/place?key=${mapsApiKey}&q=${crop.coordinates.lat},${crop.coordinates.lng}&maptype=satellite&zoom=15`}
                            allowFullScreen
                        ></iframe>
                    </div>
                ) : (
                    <div className="w-full h-40 bg-gray-100 dark:bg-slate-700 rounded-xl mb-4 flex items-center justify-center flex-col text-gray-400 p-4 text-center">
                        <MapPin size={32} className="mb-2 opacity-50"/>
                        <p className="text-xs font-medium">Mapa indisponível</p>
                        <p className="text-[10px] opacity-70">Chave de API não configurada</p>
                    </div>
                )}
             </div>
        )}
    </div>
  );

  const renderFinance = () => {
    const materials = crop.materials || [];
    const data = materials.map(m => ({
        name: m.category,
        value: (m.quantity || 0) * (m.unitPriceEstimate || 0)
    })).reduce((acc: any[], curr) => {
        const found = acc.find(a => a.name === curr.name);
        if (found) found.value += curr.value;
        else acc.push(curr);
        return acc;
    }, []);

    return (
      <div className="space-y-6 animate-slide-up">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           {/* Chart */}
           <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
             <h3 className="font-bold text-gray-800 dark:text-white mb-6 text-xl">Distribuição de Custos</h3>
             <div className="h-64 w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={data}>
                   <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} tick={{fill: '#9CA3AF'}} />
                   <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                   <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                     {data.map((_, index) => (
                       <Cell key={`cell-${index}`} fill={['#27AE60', '#F2C94C', '#E74C3C', '#8E44AD'][index % 4]} />
                     ))}
                   </Bar>
                 </BarChart>
               </ResponsiveContainer>
             </div>
             <div className="mt-6 flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-2xl">
               <p className="text-gray-500 dark:text-gray-300 font-medium">Total Estimado</p>
               <div className="text-right">
                 <p className="text-2xl font-bold text-gray-800 dark:text-white transition-all duration-300">
                   {(crop.estimatedCost || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                 </p>
               </div>
             </div>
           </div>

           {/* List */}
           <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-800 dark:text-white text-xl flex items-center gap-2">
                   <ShoppingBag className="text-agro-green"/> Lista de Compras
                </h3>
                <div className="flex gap-2">
                    {isEditingPrices && (
                        <button onClick={() => setIsAddingItem(!isAddingItem)} className="p-2 rounded-lg bg-blue-50 text-blue-600"><Plus size={16}/></button>
                    )}
                    <button onClick={() => setIsEditingPrices(!isEditingPrices)} className="p-2 rounded-lg bg-gray-100 text-gray-600">
                    {isEditingPrices ? <Check size={16}/> : <Edit2 size={16}/>}
                    </button>
                </div>
              </div>
              {/* ... Add Item Form ... */}
              {isAddingItem && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-xl animate-fade-in">
                       {/* Simplified form for brevity */}
                       <input className="w-full p-2 mb-2 border rounded" placeholder="Nome" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
                       <div className="flex gap-2 mb-2">
                           <input type="number" className="w-full p-2 border rounded" placeholder="Qtd" value={newItem.quantity || ''} onChange={e => setNewItem({...newItem, quantity: parseFloat(e.target.value)})} />
                           <input type="number" className="w-full p-2 border rounded" placeholder="Preço" value={newItem.unitPriceEstimate || ''} onChange={e => setNewItem({...newItem, unitPriceEstimate: parseFloat(e.target.value)})} />
                       </div>
                       <button onClick={handleAddItem} className="w-full py-2 bg-agro-green text-white rounded font-bold">Adicionar</button>
                  </div>
              )}
              
              <div className="flex-1 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar bg-white dark:bg-slate-800">
                <div className="space-y-3">
                  {materials.map((m, i) => (
                    <div key={i} className="flex justify-between items-center p-3 border-b border-gray-50 dark:border-slate-700">
                      <div className="flex-1">
                        <p className="font-bold text-gray-700 dark:text-gray-200">{m.name}</p>
                        <p className="text-xs text-gray-400 uppercase">{m.category}</p>
                      </div>
                      <div className="text-right">
                         {isEditingPrices ? (
                             <div className="flex items-center gap-1">
                                 <input type="number" className="w-16 p-1 border rounded text-xs" value={m.quantity} onChange={e => handleUpdateMaterial(i, 'quantity', e.target.value)} />
                                 <input type="number" className="w-20 p-1 border rounded text-xs" value={m.unitPriceEstimate} onChange={e => handleUpdateMaterial(i, 'unitPriceEstimate', e.target.value)} />
                                 <button onClick={() => handleRemoveItem(i)} className="text-red-400"><Trash2 size={14}/></button>
                             </div>
                         ) : (
                             <>
                                <p className="font-bold text-gray-800 dark:text-white">{((m.quantity||0)*(m.unitPriceEstimate||0)).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</p>
                                <p className="text-xs text-gray-500">{m.quantity} {m.unit}</p>
                             </>
                         )}
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
    <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 animate-slide-up">
      <div className="flex items-center justify-between mb-8">
           <h3 className="font-bold text-xl text-gray-800 dark:text-white pl-4">Linha do Tempo</h3>
           <button onClick={() => setIsEditingTimeline(!isEditingTimeline)} className="p-2 rounded-lg bg-gray-100 text-gray-600">
              {isEditingTimeline ? <Check size={16}/> : <Edit2 size={16}/>}
           </button>
      </div>
      <div className="relative pl-8 border-l-2 border-gray-100 dark:border-slate-700 ml-4 space-y-10">
        {(crop.timeline || []).map((stage, index) => (
          <div key={stage.id} className="relative group">
             <div className={`absolute -left-[43px] top-0 w-8 h-8 rounded-full border-4 border-white dark:border-slate-800 shadow-md flex items-center justify-center ${stage.status === 'concluido' ? 'bg-agro-green' : 'bg-gray-200'}`}>
                 {isEditingTimeline ? <Trash2 size={12} className="text-red-500" onClick={() => handleRemoveStage(index)}/> : (stage.status === 'concluido' && <CheckCircle size={14} className="text-white"/>)}
             </div>
             <div className="p-6 rounded-2xl border bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white">{stage.title}</h4>
                <p className="text-gray-500 text-sm mb-4">{stage.description}</p>
                {isEditingTimeline ? (
                     <input value={stage.dateEstimate} onChange={e => handleUpdateStage(index, 'dateEstimate', e.target.value)} className="border rounded p-1 text-xs"/>
                ) : (
                     <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{stage.dateEstimate}</span>
                )}
             </div>
          </div>
        ))}
        {isEditingTimeline && <button onClick={handleAddStage} className="w-full py-3 border-2 border-dashed text-agro-green font-bold rounded-xl mt-4">Adicionar Etapa</button>}
      </div>
    </div>
  );

  const renderStorage = () => {
    const logs = crop.harvestLogs || [];
    // Tenta extrair meta numérica
    const goalValue = parseFloat(crop.productivityGoal.replace(/[^0-9.]/g, '')) || 0; 
    // Total esperado = Meta * Área
    const totalExpected = goalValue * crop.areaHa;
    
    const totalHarvested = logs.reduce((acc, l) => acc + l.quantity, 0);
    const progress = totalExpected > 0 ? (totalHarvested / totalExpected) * 100 : 0;

    return (
      <div className="space-y-6 animate-slide-up">
          {/* Progress Card */}
          <div className={`rounded-3xl p-8 text-white shadow-lg bg-gradient-to-br ${theme.gradient}`}>
             <h3 className="font-bold text-lg opacity-90 mb-1 flex items-center gap-2">
                <Warehouse size={20} /> Armazenamento & Colheita
             </h3>
             <div className="flex items-end gap-2 mt-4">
                <span className="text-5xl font-extrabold">{totalHarvested}</span>
                <span className="text-lg font-medium opacity-80 mb-1">sc colhidas</span>
             </div>
             
             <div className="mt-6">
                <div className="flex justify-between text-xs font-bold mb-2 opacity-80">
                   <span>Progresso da Safra</span>
                   <span>{progress.toFixed(1)}% da Meta ({totalExpected} sc)</span>
                </div>
                <div className="w-full bg-black/20 rounded-full h-3 overflow-hidden">
                   <div 
                     className="h-full bg-white rounded-full transition-all duration-1000" 
                     style={{ width: `${Math.min(progress, 100)}%` }} 
                   />
                </div>
             </div>
          </div>

          {/* Action & List */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-800 dark:text-white">Histórico de Cargas</h3>
                <button 
                  onClick={() => setIsAddingHarvest(!isAddingHarvest)}
                  className="flex items-center gap-2 text-sm font-bold text-agro-green bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg hover:bg-green-100 transition-colors"
                >
                   {isAddingHarvest ? <X size={16}/> : <Plus size={16}/>} 
                   {isAddingHarvest ? 'Cancelar' : 'Nova Carga'}
                </button>
             </div>

             {isAddingHarvest && (
                <div className="mb-6 p-4 bg-gray-50 dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 animate-fade-in">
                   <h4 className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-3">Registrar Colheita</h4>
                   <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="col-span-2">
                         <label className="text-[10px] font-bold text-gray-400 uppercase">Local</label>
                         <input 
                           type="text" 
                           placeholder="Ex: Silo 1, Cooperativa"
                           className="w-full p-3 rounded-xl border dark:border-slate-600 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-agro-green/20"
                           value={newHarvest.location}
                           onChange={e => setNewHarvest({...newHarvest, location: e.target.value})}
                         />
                      </div>
                      <div>
                         <label className="text-[10px] font-bold text-gray-400 uppercase">Data</label>
                         <input 
                           type="date" 
                           className="w-full p-3 rounded-xl border dark:border-slate-600 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-agro-green/20"
                           value={newHarvest.date}
                           onChange={e => setNewHarvest({...newHarvest, date: e.target.value})}
                         />
                      </div>
                      <div>
                         <label className="text-[10px] font-bold text-gray-400 uppercase">Qtd (Sacas)</label>
                         <input 
                           type="number" 
                           placeholder="0.00"
                           className="w-full p-3 rounded-xl border dark:border-slate-600 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-agro-green/20 font-bold"
                           value={newHarvest.quantity || ''}
                           onChange={e => setNewHarvest({...newHarvest, quantity: parseFloat(e.target.value)})}
                         />
                      </div>
                   </div>
                   <button 
                     onClick={handleAddHarvest}
                     className="w-full py-3 bg-agro-green text-white font-bold rounded-xl hover:bg-green-700 transition-transform active:scale-95 shadow-lg shadow-green-600/20"
                   >
                     Confirmar Registro
                   </button>
                </div>
             )}

             <div className="space-y-3">
                {logs.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 dark:text-gray-500">
                       <Truck size={40} className="mx-auto mb-2 opacity-50" />
                       <p>Nenhuma colheita registrada ainda.</p>
                    </div>
                ) : (
                    logs.map((log) => (
                       <div key={log.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-2xl border border-gray-100 dark:border-slate-700">
                          <div className="flex items-center gap-3">
                             <div className={`p-2 rounded-xl bg-white dark:bg-slate-800 text-gray-400 shadow-sm`}>
                                <Package size={20} />
                             </div>
                             <div>
                                <h4 className="font-bold text-gray-800 dark:text-white">{log.location}</h4>
                                <p className="text-xs text-gray-500">{new Date(log.date).toLocaleDateString('pt-BR')}</p>
                             </div>
                          </div>
                          <div className="flex items-center gap-3">
                             <div className="text-right">
                                <span className="block font-extrabold text-lg text-gray-900 dark:text-white">{log.quantity}</span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{log.unit}</span>
                             </div>
                             <button onClick={() => handleDeleteHarvest(log.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                          </div>
                       </div>
                    ))
                )}
             </div>
          </div>
      </div>
    );
  };

  const renderAssistant = () => <div className="p-8 text-center">Chat com IA</div>; // Placeholder

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* Header */}
      <div className={`rounded-b-3xl md:rounded-3xl shadow-xl relative overflow-hidden transition-all duration-500 ${theme.bgGlass} backdrop-blur-xl`}>
         
         <div className="relative z-20 p-6 pt-8 md:p-8">
            <div className="flex items-start justify-between gap-4">
               <div className="flex items-center gap-3">
                 <button onClick={onBack} className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl text-white transition-all active:scale-95">
                   <ArrowLeft size={20} />
                 </button>
                 <div className="text-white">
                   <h1 className="text-2xl font-extrabold leading-tight">{crop.name}</h1>
                   <p className="text-white/90 text-xs font-bold flex items-center gap-1.5 mt-1 bg-black/10 px-2 py-0.5 rounded-lg w-fit">
                      <Sprout size={10}/> <span className="capitalize">{crop.type}</span> • {crop.areaHa} ha
                   </p>
                 </div>
               </div>

               <div className="flex gap-2">
                   <button 
                     onClick={() => setActiveTab('assistant')}
                     className="flex items-center gap-2 px-4 py-2 bg-white text-agro-green rounded-full shadow-lg transition-all active:scale-95 hover:scale-105 border border-white/20 animate-pulse-slow font-bold text-xs"
                     title="Assistente IA"
                   >
                     <MessageSquare size={18} fill="currentColor" className="text-agro-green" />
                     <span className="hidden sm:inline">Assistente IA</span>
                     <span className="sm:hidden">Assistente IA</span>
                   </button>
                   <button onClick={onDeleteCrop} className="p-2 bg-white/10 hover:bg-red-500/80 text-white rounded-xl backdrop-blur-sm border border-white/10"><Trash2 size={20} /></button>
               </div>
            </div>

            {/* Desktop Tabs */}
            <div className="hidden md:flex overflow-x-auto gap-2 mt-6 pb-2 no-scrollbar">
                {[
                  { id: 'overview', label: 'Home', icon: Home },
                  { id: 'finance', label: 'Finanças', icon: DollarSign },
                  { id: 'timeline', label: 'Etapas', icon: ListTodo },
                  { id: 'storage', label: 'Armazenagem', icon: Warehouse }, // Nova Aba
                  { id: 'reports', label: 'Relatório', icon: FileText, action: generatePDF, loading: isGeneratingPdf }, 
                ].map((tab) => {
                   if (tab.id === 'reports') {
                       return (
                        <button key={tab.id} onClick={tab.action} className="flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm bg-white/10 text-white hover:bg-white/20">
                            {tab.loading ? <Loader2 size={16} className="animate-spin"/> : <tab.icon size={16}/>} {tab.label}
                        </button>
                       )
                   }
                   return (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm ${activeTab === tab.id ? 'bg-white text-gray-900' : 'bg-white/10 text-white'}`}>
                        <tab.icon size={16} /> {tab.label}
                    </button>
                   )
                })}
            </div>
         </div>
         <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Content Area */}
      <div className="min-h-[500px] animate-slide-up px-1 pb-24">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'finance' && renderFinance()}
        {activeTab === 'timeline' && renderTimeline()}
        {activeTab === 'storage' && renderStorage()}
        {activeTab === 'assistant' && renderAssistant()}
        {activeTab === 'reports' && <Reports crop={crop} />}
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-gray-200/50 dark:border-slate-700/50 rounded-2xl shadow-2xl shadow-black/10 z-50 flex justify-around items-center py-3 px-1 ring-1 ring-black/5 overflow-x-auto">
         {[
            { id: 'overview', label: 'Home', icon: Home },
            { id: 'finance', label: 'Finanças', icon: DollarSign },
            { id: 'timeline', label: 'Etapas', icon: ListTodo },
            { id: 'storage', label: 'Silo', icon: Warehouse }, // Nova Aba Mobile
            { id: 'reports', label: 'Relatório', icon: FileText, action: generatePDF, loading: isGeneratingPdf },
         ].map((tab) => {
            const isActive = activeTab === tab.id;
            if (tab.id === 'reports') {
                return <button key={tab.id} onClick={tab.action} className="flex flex-col items-center gap-1 px-2 text-gray-400"><tab.icon size={22}/><span className="text-[9px] font-bold">{tab.label}</span></button>
            }
            return (
               <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`relative flex flex-col items-center gap-1 px-2 transition-all ${isActive ? 'text-agro-green' : 'text-gray-400'}`}>
                  {isActive && <div className="absolute inset-0 bg-green-50 rounded-xl -z-10 scale-110"></div>}
                  <tab.icon size={22} />
                  <span className="text-[9px] font-bold tracking-tight">{tab.label}</span>
               </button>
            )
         })}
      </div>
    </div>
  );
};
