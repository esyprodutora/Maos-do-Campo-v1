import React, { useState, useEffect } from 'react';
import { CropData, TimelineStage, Material, HarvestLog } from '../types';
import { getAssistantResponse } from '../services/geminiService';
import { getCurrentPrice } from '../services/marketService';
import { Reports } from './Reports';
import { ArrowLeft, Calendar, DollarSign, ListTodo, MessageSquare, Send, CheckCircle, Circle, AlertCircle, Droplets, Ruler, ShoppingBag, Download, Loader2, Edit2, Check, MapPin, Navigation, Trash2, Plus, X, Clock, Sprout, FileText, Home, Sparkles, Bot, MessageCircle, Warehouse, Package, Truck, TrendingUp, Wallet } from 'lucide-react';
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
    realCost: 0,
    category: 'outros'
  });

  // State for Timeline Editing
  const [isEditingTimeline, setIsEditingTimeline] = useState(false);

  // State for Storage/Harvest
  const [isAddingHarvest, setIsAddingHarvest] = useState(false);
  const [editingHarvestId, setEditingHarvestId] = useState<string | null>(null);
  const [harvestForm, setHarvestForm] = useState<HarvestLog>({
      id: '',
      date: new Date().toISOString().split('T')[0],
      quantity: 0,
      unit: 'sc',
      location: '',
      qualityNote: ''
  });
  const [currentMarketPrice, setCurrentMarketPrice] = useState<number>(0);

  useEffect(() => {
      if (activeTab === 'storage') {
          getCurrentPrice(crop.type).then(price => setCurrentMarketPrice(price));
      }
  }, [activeTab, crop.type]);

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

  // --- Timeline Handlers ---
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
        
        return { 
          ...stage, 
          tasks: updatedTasks, 
          status: newStatus 
        } as TimelineStage;
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

  // --- Finance Handlers ---
  const handleUpdateMaterial = (index: number, field: 'quantity' | 'unitPriceEstimate' | 'realCost', value: string) => {
    const numValue = parseFloat(value);
    const updatedMaterials = [...(crop.materials || [])];
    if (!updatedMaterials[index]) return;

    const item = { ...updatedMaterials[index] };
    item[field] = isNaN(numValue) ? 0 : numValue;
    updatedMaterials[index] = item;

    const newTotalCost = updatedMaterials.reduce((acc, m) => acc + (m.quantity * m.unitPriceEstimate), 0);

    onUpdateCrop({
      ...crop,
      materials: updatedMaterials,
      estimatedCost: newTotalCost
    });
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
    setNewItem({ name: '', quantity: 0, unit: 'un', unitPriceEstimate: 0, realCost: 0, category: 'outros' });
    setIsAddingItem(false);
  };

  const handleSaveHarvest = () => {
      if(harvestForm.quantity <= 0) return alert("Quantidade deve ser maior que zero.");
      
      let updatedLogs = [...(crop.harvestLogs || [])];
      
      if (editingHarvestId) {
          updatedLogs = updatedLogs.map(h => h.id === editingHarvestId ? { ...harvestForm, id: editingHarvestId } : h);
      } else {
          const newLog = { ...harvestForm, id: Math.random().toString(36).substr(2, 9) };
          updatedLogs.push(newLog);
      }
      
      onUpdateCrop({ ...crop, harvestLogs: updatedLogs });
      
      setHarvestForm({ id: '', date: new Date().toISOString().split('T')[0], quantity: 0, unit: 'sc', location: '', qualityNote: '' });
      setIsAddingHarvest(false);
      setEditingHarvestId(null);
  };

  const handleEditHarvest = (log: HarvestLog) => {
      setHarvestForm(log);
      setEditingHarvestId(log.id);
      setIsAddingHarvest(true);
  };

  const handleDeleteHarvest = (id: string) => {
      if(!confirm("Excluir este registro de colheita?")) return;
      const updatedLogs = (crop.harvestLogs || []).filter(h => h.id !== id);
      onUpdateCrop({ ...crop, harvestLogs: updatedLogs });
  };

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
      m.name, m.category, `${m.quantity} ${m.unit}`, 
      `R$ ${m.unitPriceEstimate.toFixed(2)} (Est)`, 
      m.realCost ? `R$ ${m.realCost.toFixed(2)} (Real)` : '-'
    ]);
    autoTable(doc, { startY: 75, head: [['Item', 'Categoria', 'Qtd', 'Preço Est.', 'Pago Real']], body: tableData });
    doc.save(`plano_${crop.name}.pdf`);
    setIsGeneratingPdf(false);
  };

  // --- Render Sections (Restaurados) ---

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

       <div className="flex flex-col gap-6">
           <div className={`p-8 rounded-3xl border relative overflow-hidden flex flex-col justify-between ${theme.light} border-${theme.bg}/20 flex-1`}>
              <div className="relative z-10">
                <h3 className={`font-bold text-xl mb-4 flex items-center gap-2 ${theme.main}`}>
                   <AlertCircle size={24}/> Recomendação Técnica
                </h3>
                <p className="text-gray-700 dark:text-gray-200 italic leading-relaxed text-lg font-medium">
                  "{crop.aiAdvice}"
                </p>
              </div>
              <div className="mt-8 relative z-10">
                <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${theme.main}`}>Estimativa de Colheita</p>
                <p className="text-3xl font-extrabold text-gray-800 dark:text-white">
                  {new Date(crop.estimatedHarvestDate).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </p>
              </div>
           </div>

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
                <a 
                   href={`https://www.waze.com/ul?ll=${crop.coordinates.lat},${crop.coordinates.lng}&navigate=yes`}
                   target="_blank"
                   rel="noreferrer"
                   className="flex items-center justify-center gap-2 w-full py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                >
                   <Navigation size={18} /> Abrir no GPS
                </a>
             </div>
           )}
       </div>
    </div>
  );

  const renderFinance = () => {
    const materials = crop.materials || [];
    // Dados Estimados
    const dataEstimated = materials.map(m => ({
        name: m.category,
        value: (m.quantity || 0) * (m.unitPriceEstimate || 0),
        type: 'Estimado'
    })).reduce((acc: any[], curr) => {
        const found = acc.find(a => a.name === curr.name);
        if (found) found.value += curr.value;
        else acc.push(curr);
        return acc;
    }, []);

    // Dados Realizados (Custo Real)
    const totalRealCost = materials.reduce((acc, m) => acc + (m.realCost || 0), 0);

    return (
      <div className="space-y-6 animate-slide-up">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           {/* Chart Card */}
           <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
             <h3 className="font-bold text-gray-800 dark:text-white mb-6 text-xl">Estimado (IA)</h3>
             <div className="h-64 w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={dataEstimated}>
                   <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} tick={{fill: '#9CA3AF'}} />
                   <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                   <Bar dataKey="value" radius={[6, 6, 0, 0]} name="Estimado">
                     {dataEstimated.map((_, index) => (
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

            {/* Realized Cost Card */}
           <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col justify-center items-center text-center">
              <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-full mb-4 text-blue-600 dark:text-blue-400">
                  <Wallet size={48} />
              </div>
              <h3 className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-wide">Total Gasto (Real)</h3>
              <p className="text-4xl font-extrabold text-gray-900 dark:text-white mt-2">
                  {totalRealCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
              <p className="text-xs text-gray-400 mt-4">
                  Preencha o "Valor Pago" na lista abaixo para atualizar.
              </p>
           </div>
        </div>

        {/* List with Real Cost Editing */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-800 dark:text-white text-xl flex items-center gap-2">
                   <ShoppingBag className="text-agro-green"/> Lista de Compras
                </h3>
                <div className="flex gap-2">
                    <button onClick={() => setIsEditingPrices(!isEditingPrices)} className="p-2 rounded-lg bg-gray-100 text-gray-600">
                    {isEditingPrices ? <Check size={16}/> : <Edit2 size={16}/>}
                    </button>
                    {isEditingPrices && (
                        <button onClick={() => setIsAddingItem(!isAddingItem)} className="p-2 rounded-lg bg-blue-50 text-blue-600"><Plus size={16}/></button>
                    )}
                </div>
              </div>

              {isAddingItem && (
                  <div className="mb-4 p-4 bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 animate-fade-in">
                      <input className="w-full p-2 mb-2 border rounded" placeholder="Nome" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
                      <div className="flex gap-2 mb-2">
                          <input type="number" className="w-full p-2 border rounded" placeholder="Qtd" value={newItem.quantity || ''} onChange={e => setNewItem({...newItem, quantity: parseFloat(e.target.value)})} />
                          <input type="number" className="w-full p-2 border rounded" placeholder="Preço Est." value={newItem.unitPriceEstimate || ''} onChange={e => setNewItem({...newItem, unitPriceEstimate: parseFloat(e.target.value)})} />
                      </div>
                      <button onClick={handleAddItem} className="w-full py-2 bg-agro-green text-white rounded font-bold">Adicionar</button>
                  </div>
              )}
              
              <div className="flex-1 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar bg-white dark:bg-slate-800">
                <div className="space-y-3">
                  {materials.map((m, i) => (
                    <div key={i} className="flex justify-between items-center p-3 border-b border-gray-50 dark:border-slate-700 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg transition-colors group">
                      <div className="flex-1">
                        <p className="font-bold text-gray-700 dark:text-gray-200">{m.name}</p>
                        <p className="text-xs text-gray-400 uppercase">{m.category}</p>
                        <p className="text-[10px] text-gray-400 mt-1">
                            Est: {((m.quantity||0)*(m.unitPriceEstimate||0)).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
                        </p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                         {isEditingPrices ? (
                           <div className="flex flex-col gap-1 items-end">
                             <label className="text-[9px] font-bold text-gray-400 uppercase">Valor Pago (Total)</label>
                             <div className="flex items-center gap-1">
                               <span className="text-xs text-gray-400">R$</span>
                               <input 
                                 type="number"
                                 value={m.realCost || ''}
                                 onChange={(e) => handleUpdateMaterial(i, 'realCost', e.target.value)}
                                 className="w-24 p-1 text-right font-bold border border-blue-200 rounded-md text-sm bg-blue-50"
                                 placeholder="0.00"
                               />
                               <button onClick={() => handleRemoveItem(i)} className="text-red-400 ml-2"><Trash2 size={14}/></button>
                             </div>
                           </div>
                         ) : (
                           <div className="flex flex-col items-end">
                             <span className="text-[10px] font-bold text-gray-400 uppercase">Realizado</span>
                             <p className={`font-bold ${m.realCost ? 'text-blue-600' : 'text-gray-300'}`}>
                               {(m.realCost || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                             </p>
                           </div>
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
                 {isEditingTimeline ? <Trash2 size={12} className="text-red-500 cursor-pointer" onClick={() => handleRemoveStage(index)}/> : (stage.status === 'concluido' && <CheckCircle size={14} className="text-white"/>)}
             </div>
             <div className="p-6 rounded-2xl border bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white">{stage.title}</h4>
                <p className="text-gray-500 text-sm mb-4">{stage.description}</p>
                {isEditingTimeline ? (
                     <input value={stage.dateEstimate} onChange={e => handleUpdateStage(index, 'dateEstimate', e.target.value)} className="border rounded p-1 text-xs"/>
                ) : (
                     <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{stage.dateEstimate}</span>
                )}
                <div className="grid gap-3 mt-3">
                    {stage.tasks.map(task => (
                    <div 
                        key={task.id} 
                        // CORREÇÃO: toggleTask agora funciona corretamente para atualizar estado
                        onClick={() => !isEditingTimeline && toggleTask(stage.id, task.id)} 
                        className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all border ${task.done ? 'bg-green-50 border-green-100' : 'bg-white border-gray-100'}`}
                    >
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${task.done ? 'bg-agro-green border-agro-green' : 'border-gray-300'}`}>
                            {task.done && <CheckCircle size={14} className="text-white"/>}
                        </div>
                        <span className={`text-sm font-medium ${task.done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{task.text}</span>
                    </div>
                    ))}
                </div>
             </div>
          </div>
        ))}
        {isEditingTimeline && <button onClick={handleAddStage} className="w-full py-3 border-2 border-dashed text-agro-green font-bold rounded-xl mt-4">Adicionar Etapa</button>}
      </div>
    </div>
  );

  const renderStorage = () => {
    const logs = crop.harvestLogs || [];
    const goalValue = parseFloat(crop.productivityGoal.replace(/[^0-9.]/g, '')) || 0; 
    const totalExpected = goalValue * crop.areaHa;
    const totalHarvested = logs.reduce((acc, l) => acc + l.quantity, 0);
    const progress = totalExpected > 0 ? (totalHarvested / totalExpected) * 100 : 0;
    const estimatedRevenue = totalHarvested * currentMarketPrice;

    return (
      <div className="space-y-6 animate-slide-up">
          <div className={`rounded-3xl p-8 text-white shadow-lg bg-gradient-to-br ${theme.gradient}`}>
             <h3 className="font-bold text-lg opacity-90 mb-1 flex items-center gap-2"><Warehouse size={20} /> Armazenamento & Colheita</h3>
             <div className="flex items-end gap-2 mt-4">
                <span className="text-5xl font-extrabold">{totalHarvested.toLocaleString('pt-BR')}</span>
                <span className="text-lg font-medium opacity-80 mb-1">sc colhidas</span>
             </div>
             
             {currentMarketPrice > 0 && (
                <div className="mt-4 bg-black/20 p-3 rounded-xl inline-block backdrop-blur-sm">
                     <p className="text-xs font-medium opacity-80 mb-1">Receita Estimada</p>
                     <p className="text-xl font-bold text-green-300">
                        {estimatedRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                     </p>
                </div>
             )}

             <div className="mt-6">
                <div className="flex justify-between text-xs font-bold mb-2 opacity-80">
                   <span>Progresso da Safra</span>
                   <span>{progress.toFixed(1)}% da Meta ({totalExpected.toLocaleString('pt-BR')} sc)</span>
                </div>
                <div className="w-full bg-black/20 rounded-full h-3 overflow-hidden">
                   <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${Math.min(progress, 100)}%` }} />
                </div>
             </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-800 dark:text-white">Histórico de Cargas</h3>
                <button onClick={() => { setIsAddingHarvest(!isAddingHarvest); if (!isAddingHarvest) { setHarvestForm({ id: '', date: new Date().toISOString().split('T')[0], quantity: 0, unit: 'sc', location: '', qualityNote: '' }); setEditingHarvestId(null); } }} className="flex items-center gap-2 text-sm font-bold text-agro-green bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg hover:bg-green-100 transition-colors">
                   {isAddingHarvest ? <X size={16}/> : <Plus size={16}/>} {isAddingHarvest ? 'Cancelar' : 'Nova Carga'}
                </button>
             </div>
             {isAddingHarvest && (
                <div className="mb-6 p-4 bg-gray-50 dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 animate-fade-in">
                   <h4 className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-3">{editingHarvestId ? 'Editar Carga' : 'Registrar Colheita'}</h4>
                   <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="col-span-2">
                         <input type="text" placeholder="Local (Silo 1)" className="w-full p-3 rounded-xl border" value={harvestForm.location} onChange={e => setHarvestForm({...harvestForm, location: e.target.value})} />
                      </div>
                      <div>
                         <input type="date" className="w-full p-3 rounded-xl border" value={harvestForm.date} onChange={e => setHarvestForm({...harvestForm, date: e.target.value})} />
                      </div>
                      <div>
                         <input type="number" placeholder="Qtd" className="w-full p-3 rounded-xl border" value={harvestForm.quantity || ''} onChange={e => setHarvestForm({...harvestForm, quantity: parseFloat(e.target.value)})} />
                      </div>
                   </div>
                   <button onClick={handleSaveHarvest} className="w-full py-3 bg-agro-green text-white font-bold rounded-xl">Confirmar</button>
                </div>
             )}
             <div className="space-y-3">
                {crop.harvestLogs?.map((log) => (
                   <div key={log.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-2xl border border-gray-100 dark:border-slate-700">
                      <div className="flex items-center gap-3">
                         <div className={`p-3 rounded-xl bg-white dark:bg-slate-800 text-agro-green shadow-sm`}><Package size={20} /></div>
                         <div>
                            <h4 className="font-bold text-gray-800 dark:text-white text-sm">{log.location}</h4>
                            <p className="text-xs text-gray-500">{new Date(log.date).toLocaleDateString('pt-BR')}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="font-extrabold text-lg text-gray-900 dark:text-white">{log.quantity} <span className="text-xs font-normal text-gray-400">{log.unit}</span></span>
                         <button onClick={() => handleEditHarvest(log)} className="p-2 text-blue-400"><Edit2 size={16}/></button>
                         <button onClick={() => handleDeleteHarvest(log.id)} className="p-2 text-red-400"><Trash2 size={16}/></button>
                      </div>
                   </div>
                ))}
             </div>
          </div>
      </div>
    );
  };

  const renderAssistant = () => (
    <div className="flex flex-col h-[650px] bg-white dark:bg-slate-800 rounded-3xl shadow-lg border border-gray-100 dark:border-slate-700 overflow-hidden animate-slide-up">
       <div className="bg-agro-green p-6 text-white flex items-center gap-4">
         <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
            <MessageSquare size={28} />
         </div>
         <div>
           <h3 className="font-bold text-lg">Assistente Rural IA</h3>
           <p className="text-sm text-green-100 opacity-90">Especialista em {crop.type}</p>
         </div>
       </div>

       <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50 dark:bg-slate-900/50">
          {chatHistory.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
               <div className={`max-w-[85%] p-5 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-agro-green text-white rounded-tr-sm' : 'bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-100 rounded-tl-sm border border-gray-100 dark:border-slate-600'}`}>
                 {msg.text}
               </div>
            </div>
          ))}
          {isChatLoading && (
            <div className="flex justify-start">
               <div className="bg-white dark:bg-slate-700 p-4 rounded-2xl rounded-tl-sm shadow-sm flex gap-2 border border-gray-100 dark:border-slate-600">
                 <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                 <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                 <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
               </div>
            </div>
          )}
       </div>

       <form onSubmit={handleChatSubmit} className="p-4 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 flex gap-3">
         <input 
           type="text" 
           value={chatInput}
           onChange={(e) => setChatInput(e.target.value)}
           placeholder="Digite sua dúvida..."
           className="flex-1 p-4 bg-gray-50 dark:bg-slate-900 border border-transparent focus:bg-white dark:focus:bg-slate-800 focus:border-agro-green rounded-xl outline-none transition-all font-medium dark:text-white"
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
    <div className="space-y-6 pb-24 md:pb-8">
      {/* Header */}
      <div className={`rounded-b-3xl md:rounded-3xl shadow-xl relative overflow-hidden transition-all duration-500 bg-gradient-to-br ${theme.gradient}`}>
         
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

                   <button onClick={onDeleteCrop} className="p-2 bg-white/10 hover:bg-red-500/80 text-white rounded-xl backdrop-blur-sm transition-all active:scale-95 border border-white/10"><Trash2 size={20} /></button>
               </div>
            </div>

            {/* Desktop Tabs */}
            <div className="hidden md:flex overflow-x-auto gap-2 mt-6 pb-2 no-scrollbar">
                {[
                  { id: 'overview', label: 'Home', icon: Home },
                  { id: 'finance', label: 'Finanças', icon: DollarSign },
                  { id: 'timeline', label: 'Etapas', icon: ListTodo },
                  { id: 'storage', label: 'Armazenagem', icon: Warehouse },
                  { id: 'reports', label: 'Relatório', icon: FileText }, 
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`
                      flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-all shadow-sm
                      ${activeTab === tab.id 
                        ? 'bg-white text-gray-900 scale-105 ring-2 ring-white/50' 
                        : 'bg-white/10 text-white hover:bg-white/20'}
                    `}
                  >
                    <tab.icon size={16} />
                    {tab.label}
                  </button>
                ))}
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
            { id: 'storage', label: 'Silo', icon: Warehouse },
            { id: 'reports', label: 'Relatório', icon: FileText },
         ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
               <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    relative flex flex-col items-center gap-1 px-3 py-1 transition-all duration-300 rounded-xl min-w-[60px]
                    ${isActive ? 'text-agro-green scale-105' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'}
                  `}
               >
                  {isActive && (
                     <div className="absolute inset-0 bg-green-50 dark:bg-green-900/20 rounded-xl -z-10 scale-110 opacity-100 transition-all"></div>
                  )}
                  <tab.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[9px] font-bold tracking-tight">{tab.label}</span>
               </button>
            )
         })}
      </div>
    </div>
  );
};
