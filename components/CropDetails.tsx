import React, { useState } from 'react';
import { CropData, TimelineStage, Material } from '../types';
import { getAssistantResponse } from '../services/geminiService';
import { ArrowLeft, Calendar, DollarSign, ListTodo, MessageSquare, Send, CheckCircle, Circle, AlertCircle, Droplets, Ruler, ShoppingBag, Download, Loader2, Edit2, Check, MapPin, Navigation, Trash2, Plus, X, Clock, Sprout } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'finance' | 'timeline' | 'assistant'>('overview');
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'ai', text: string}[]>([
    { role: 'ai', text: `Olá! Sou seu assistente para a lavoura ${crop.name}. Como posso ajudar hoje?` }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  // Use the safe key from config
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

  // Helper styles based on crop type
  const getTheme = (type: string) => {
    switch(type) {
      case 'cafe': return { main: 'text-[#A67C52]', bg: 'bg-[#A67C52]', bgSoft: 'bg-[#A67C52]/10', border: 'border-[#A67C52]/20', light: 'bg-[#FAF3E0] dark:bg-[#A67C52]/20' };
      case 'milho': return { main: 'text-orange-500', bg: 'bg-orange-500', bgSoft: 'bg-orange-500/10', border: 'border-orange-500/20', light: 'bg-orange-50 dark:bg-orange-500/20' };
      case 'soja': return { main: 'text-yellow-500', bg: 'bg-yellow-500', bgSoft: 'bg-yellow-500/10', border: 'border-yellow-500/20', light: 'bg-yellow-50 dark:bg-yellow-500/20' };
      case 'cana': return { main: 'text-green-600', bg: 'bg-green-600', bgSoft: 'bg-green-600/10', border: 'border-green-600/20', light: 'bg-green-100 dark:bg-green-600/20' };
      case 'algodao': return { main: 'text-slate-500 dark:text-slate-300', bg: 'bg-slate-500', bgSoft: 'bg-slate-500/10', border: 'border-slate-500/20', light: 'bg-slate-100 dark:bg-slate-500/20' };
      case 'arroz': return { main: 'text-yellow-600', bg: 'bg-yellow-400', bgSoft: 'bg-yellow-400/10', border: 'border-yellow-400/20', light: 'bg-yellow-50 dark:bg-yellow-400/20' };
      case 'feijao': return { main: 'text-red-700', bg: 'bg-red-700', bgSoft: 'bg-red-700/10', border: 'border-red-700/20', light: 'bg-red-50 dark:bg-red-700/20' };
      case 'trigo': return { main: 'text-amber-500', bg: 'bg-amber-500', bgSoft: 'bg-amber-500/10', border: 'border-amber-500/20', light: 'bg-amber-50 dark:bg-amber-500/20' };
      case 'laranja': return { main: 'text-orange-600', bg: 'bg-orange-600', bgSoft: 'bg-orange-600/10', border: 'border-orange-600/20', light: 'bg-orange-100 dark:bg-orange-600/20' };
      case 'mandioca': return { main: 'text-amber-800', bg: 'bg-amber-800', bgSoft: 'bg-amber-800/10', border: 'border-amber-800/20', light: 'bg-amber-100 dark:bg-amber-800/20' };
      default: return { main: 'text-agro-green', bg: 'bg-agro-green', bgSoft: 'bg-agro-green/10', border: 'border-agro-green/20', light: 'bg-green-50 dark:bg-green-900/20' };
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
  const handleUpdateMaterial = (index: number, field: 'quantity' | 'unitPriceEstimate', value: string) => {
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
    setNewItem({ name: '', quantity: 0, unit: 'un', unitPriceEstimate: 0, category: 'outros' });
    setIsAddingItem(false);
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
    doc.setFont('helvetica', 'bold');
    doc.text('MÃOS DO CAMPO', 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text('Relatório de Planejamento de Safra', 105, 22, { align: 'center' });
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(14);
    doc.text(`Lavoura: ${crop.name}`, 14, 45);
    
    const materials = crop.materials || [];
    const tableData = materials.map(m => [
      m.name,
      m.category,
      `${m.quantity} ${m.unit}`,
      `R$ ${m.unitPriceEstimate.toFixed(2)}`,
      `R$ ${(m.quantity * m.unitPriceEstimate).toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: 75,
      head: [['Item', 'Categoria', 'Qtd', 'Preço Unit.', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [39, 174, 96] },
      foot: [['', '', '', 'TOTAL ESTIMADO:', `R$ ${(crop.estimatedCost || 0).toLocaleString('pt-BR')}`]],
    });
    doc.save(`plano_${crop.name.replace(/\s+/g, '_').toLowerCase()}.pdf`);
    setIsGeneratingPdf(false);
  };

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
                  "{crop.aiAdvice || 'Siga as boas práticas agronômicas.'}"
                </p>
              </div>
              <div className="mt-8 relative z-10">
                <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${theme.main}`}>Estimativa de Colheita</p>
                <p className="text-3xl font-extrabold text-gray-800 dark:text-white">
                  {new Date(crop.estimatedHarvestDate).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div className={`absolute -bottom-10 -right-10 w-40 h-40 rounded-full ${theme.bg} opacity-10 blur-2xl`}></div>
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
           <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
             <h3 className="font-bold text-gray-800 dark:text-white mb-6 text-xl">Distribuição de Custos</h3>
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
                 {isEditingPrices && <p className="text-xs text-agro-green animate-pulse">Atualizando...</p>}
               </div>
             </div>
           </div>

           <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-800 dark:text-white text-xl flex items-center gap-2">
                   <ShoppingBag className="text-agro-green"/> Lista de Compras
                </h3>
                <div className="flex gap-2">
                    {isEditingPrices && (
                        <button 
                            onClick={() => setIsAddingItem(!isAddingItem)}
                            className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                            title="Adicionar Item"
                        >
                            <Plus size={16} />
                        </button>
                    )}
                    <button 
                    onClick={() => setIsEditingPrices(!isEditingPrices)}
                    className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-bold ${
                        isEditingPrices 
                        ? 'bg-agro-green text-white shadow-lg shadow-green-600/20' 
                        : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                    }`}
                    >
                    {isEditingPrices ? (
                        <> <Check size={16}/> Concluir </>
                    ) : (
                        <> <Edit2 size={16}/> Editar </>
                    )}
                    </button>
                </div>
              </div>

              {isAddingItem && (
                  <div className="mb-4 p-4 bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 animate-fade-in">
                      <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Novo Item</h4>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                          <input 
                              type="text" 
                              placeholder="Nome"
                              className="p-2 rounded-lg border dark:border-slate-600 dark:bg-slate-800 text-sm outline-none focus:border-agro-green"
                              value={newItem.name}
                              onChange={e => setNewItem({...newItem, name: e.target.value})}
                          />
                          <select 
                            className="p-2 rounded-lg border dark:border-slate-600 dark:bg-slate-800 text-sm outline-none focus:border-agro-green"
                            value={newItem.category}
                            onChange={e => setNewItem({...newItem, category: e.target.value as any})}
                          >
                              <option value="outros">Outros</option>
                              <option value="fertilizante">Fertilizante</option>
                              <option value="defensivo">Defensivo</option>
                              <option value="semente">Semente</option>
                          </select>
                          <div className="flex gap-2">
                            <input 
                                type="number" 
                                placeholder="Qtd"
                                className="w-full p-2 rounded-lg border dark:border-slate-600 dark:bg-slate-800 text-sm outline-none focus:border-agro-green"
                                value={newItem.quantity || ''}
                                onChange={e => setNewItem({...newItem, quantity: parseFloat(e.target.value)})}
                            />
                             <input 
                                type="text" 
                                placeholder="Un"
                                className="w-16 p-2 rounded-lg border dark:border-slate-600 dark:bg-slate-800 text-sm outline-none focus:border-agro-green"
                                value={newItem.unit}
                                onChange={e => setNewItem({...newItem, unit: e.target.value})}
                            />
                          </div>
                          <input 
                              type="number" 
                              placeholder="Preço Unit."
                              className="p-2 rounded-lg border dark:border-slate-600 dark:bg-slate-800 text-sm outline-none focus:border-agro-green"
                              value={newItem.unitPriceEstimate || ''}
                              onChange={e => setNewItem({...newItem, unitPriceEstimate: parseFloat(e.target.value)})}
                          />
                      </div>
                      <div className="flex gap-2">
                          <button onClick={handleAddItem} className="flex-1 py-2 bg-agro-green text-white rounded-lg text-sm font-bold hover:bg-green-700">Adicionar</button>
                          <button onClick={() => setIsAddingItem(false)} className="px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-bold">Cancelar</button>
                      </div>
                  </div>
              )}

              <div className="flex-1 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar bg-white dark:bg-slate-800">
                <div className="space-y-3">
                  {materials.map((m, i) => (
                    <div key={i} className="flex justify-between items-center p-3 border-b border-gray-50 dark:border-slate-700 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg transition-colors group">
                      <div className="flex-1">
                        <p className="font-bold text-gray-700 dark:text-gray-200">{m.name}</p>
                        <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">{m.category}</p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                         {isEditingPrices ? (
                           <div className="flex flex-col gap-1 items-end">
                             <div className="flex items-center gap-1">
                               <span className="text-xs text-gray-400">R$</span>
                               <input 
                                 type="number"
                                 value={m.unitPriceEstimate}
                                 onChange={(e) => handleUpdateMaterial(i, 'unitPriceEstimate', e.target.value)}
                                 className="w-20 p-1 text-right font-bold text-gray-800 dark:text-white bg-white dark:bg-slate-900 border border-agro-green rounded-md focus:ring-2 focus:ring-green-500/20 outline-none text-sm"
                                 placeholder="Preço"
                               />
                               <button 
                                 onClick={() => handleRemoveItem(i)}
                                 className="ml-2 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                 title="Excluir"
                               >
                                   <Trash2 size={14} />
                               </button>
                             </div>
                             <div className="flex items-center gap-1 pr-8">
                               <input 
                                 type="number"
                                 value={m.quantity}
                                 onChange={(e) => handleUpdateMaterial(i, 'quantity', e.target.value)}
                                 className="w-16 p-1 text-right text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-md focus:border-agro-green outline-none"
                                 placeholder="Qtd"
                               />
                               <span className="text-xs text-gray-400">{m.unit}</span>
                             </div>
                           </div>
                         ) : (
                           <>
                             <p className="font-bold text-gray-800 dark:text-white">
                               {((m.quantity || 0) * (m.unitPriceEstimate || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                             </p>
                             <p className="text-xs text-gray-500 dark:text-gray-400">
                               {m.quantity} {m.unit} x {m.unitPriceEstimate.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                             </p>
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

  const renderTimeline = () => {
    const timeline = crop.timeline || [];
    
    if (timeline.length === 0 && !isEditingTimeline) {
      return (
        <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-gray-300 dark:border-slate-600 text-gray-400 animate-slide-up">
          <Calendar size={48} className="mb-4 opacity-50" />
          <p>Nenhum cronograma gerado.</p>
          <button onClick={() => setIsEditingTimeline(true)} className="mt-4 text-agro-green font-bold hover:underline">Criar cronograma</button>
        </div>
      );
    }

    return (
      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 animate-slide-up">
        <div className="flex items-center justify-between mb-8">
           <h3 className="font-bold text-xl text-gray-800 dark:text-white pl-4">Linha do Tempo</h3>
           <button 
              onClick={() => setIsEditingTimeline(!isEditingTimeline)}
              className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-bold ${
                isEditingTimeline 
                  ? 'bg-agro-green text-white shadow-lg shadow-green-600/20' 
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            >
              {isEditingTimeline ? (
                <> <Check size={16}/> Concluir </>
              ) : (
                <> <Edit2 size={16}/> Editar </>
              )}
            </button>
        </div>

        <div className="relative pl-8 border-l-2 border-gray-100 dark:border-slate-700 ml-4 space-y-10">
          {timeline.map((stage, index) => (
            <div key={stage.id} className="relative group">
              {/* Timeline Dot / Delete Button */}
              <div className={`
                absolute -left-[43px] top-0 w-8 h-8 rounded-full border-4 border-white dark:border-slate-800 shadow-md flex items-center justify-center transition-colors z-10
                ${isEditingTimeline ? 'bg-red-100 cursor-pointer hover:bg-red-500 border-red-50' : stage.status === 'concluido' ? 'bg-agro-green' : stage.status === 'em_andamento' ? 'bg-agro-yellow' : 'bg-gray-200 dark:bg-slate-600'}
              `}
                onClick={() => isEditingTimeline && handleRemoveStage(index)}
              >
                {isEditingTimeline ? (
                   <Trash2 size={14} className="text-red-500 group-hover:text-white" />
                ) : (
                   <>
                     {stage.status === 'concluido' && <CheckCircle size={14} className="text-white"/>}
                     {stage.status === 'em_andamento' && <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>}
                   </>
                )}
              </div>
              
              {/* Card Content - Styled as a proper Card with shadow */}
              <div className={`
                  p-6 rounded-2xl border transition-all duration-300 shadow-sm hover:shadow-md
                  ${!isEditingTimeline && stage.status === 'em_andamento' 
                    ? 'bg-white dark:bg-slate-800 border-agro-yellow ring-1 ring-agro-yellow/20 shadow-lg shadow-yellow-900/5' 
                    : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700'}
              `}>
                {isEditingTimeline ? (
                    <div className="space-y-3">
                       {/* Edit Mode Inputs */}
                       <input 
                         type="text" 
                         value={stage.title}
                         onChange={(e) => handleUpdateStage(index, 'title', e.target.value)}
                         className="w-full p-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg font-bold text-gray-900 dark:text-white"
                         placeholder="Nome da Etapa"
                       />
                       <textarea 
                         value={stage.description}
                         onChange={(e) => handleUpdateStage(index, 'description', e.target.value)}
                         className="w-full p-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-gray-600 dark:text-gray-300 h-20 resize-none"
                         placeholder="Descrição"
                       />
                       <div className="flex gap-2">
                          <div className="flex-1">
                             <label className="text-xs font-bold text-gray-400">Início</label>
                             <input 
                               type="text" // Simple text for simplicity in MVP, can be date
                               value={stage.dateEstimate}
                               onChange={(e) => handleUpdateStage(index, 'dateEstimate', e.target.value)}
                               className="w-full p-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-sm"
                             />
                          </div>
                          <div className="flex-1">
                             <label className="text-xs font-bold text-gray-400">Fim (Opcional)</label>
                             <input 
                               type="text" 
                               value={stage.endDate || ''}
                               onChange={(e) => handleUpdateStage(index, 'endDate', e.target.value)}
                               className="w-full p-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-sm"
                               placeholder="dd/mm/aaaa"
                             />
                          </div>
                          <div className="flex-1">
                             <label className="text-xs font-bold text-gray-400">Status</label>
                             <select 
                               value={stage.status}
                               onChange={(e) => handleUpdateStage(index, 'status', e.target.value)}
                               className="w-full p-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-sm"
                             >
                                <option value="pendente">Pendente</option>
                                <option value="em_andamento">Andamento</option>
                                <option value="concluido">Concluído</option>
                             </select>
                          </div>
                       </div>
                    </div>
                ) : (
                    /* View Mode */
                    <>
                        <div className="flex justify-between items-start mb-3">
                            <h4 className={`text-lg font-bold ${stage.status === 'em_andamento' ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>{stage.title}</h4>
                            <div className="flex flex-col items-end gap-1">
                                <span className={`
                                    text-xs font-bold font-mono px-3 py-1 rounded-full shadow-sm flex items-center gap-1
                                    ${stage.status === 'em_andamento' 
                                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' 
                                        : 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-gray-300'}
                                `}>
                                    <Calendar size={12} /> {stage.dateEstimate}
                                </span>
                                {stage.endDate && (
                                    <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500 flex items-center gap-1">
                                        até {stage.endDate}
                                    </span>
                                )}
                            </div>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-5 leading-relaxed text-sm">{stage.description}</p>
                        
                        <div className="grid gap-2">
                        {stage.tasks.map(task => (
                            <div key={task.id} 
                                onClick={() => toggleTask(stage.id, task.id)}
                                className={`
                                flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border
                                ${task.done 
                                    ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/30' 
                                    : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 hover:border-agro-green hover:shadow-sm'}
                                `}>
                            <div className={`
                                w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0
                                ${task.done ? 'bg-agro-green border-agro-green' : 'border-gray-300 dark:border-slate-500'}
                            `}>
                                {task.done && <CheckCircle size={12} className="text-white"/>}
                            </div>
                            <span className={`text-sm font-medium ${task.done ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-700 dark:text-gray-200'}`}>
                                {task.text}
                            </span>
                            </div>
                        ))}
                        </div>
                    </>
                )}
              </div>
            </div>
          ))}

          {isEditingTimeline && (
              <button 
                onClick={handleAddStage}
                className="w-full py-3 border-2 border-dashed border-agro-green/50 bg-green-50/50 dark:bg-green-900/10 text-agro-green font-bold rounded-xl hover:bg-green-100 dark:hover:bg-green-900/20 transition-colors flex items-center justify-center gap-2"
              >
                  <Plus size={18} /> Adicionar Etapa
              </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Mobile-First Header */}
      <div className={`rounded-b-3xl md:rounded-3xl shadow-xl relative overflow-hidden transition-all duration-500 ${theme.bg}`}>
         
         {/* Navigation & Title */}
         <div className="relative z-20 p-4 md:p-8">
            <div className="flex items-start justify-between gap-4 mb-6">
               <div className="flex items-center gap-3">
                 <button 
                   onClick={onBack} 
                   className="p-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl text-white transition-all active:scale-95"
                 >
                   <ArrowLeft size={20} />
                 </button>
                 <div className="text-white">
                   <h1 className="text-2xl font-bold leading-tight">{crop.name}</h1>
                   <p className="text-white/80 text-xs font-medium flex items-center gap-1.5 mt-0.5">
                      <Sprout size={12}/> <span className="capitalize">{crop.type}</span> • {crop.areaHa} ha
                   </p>
                 </div>
               </div>

               <div className="flex gap-2">
                   <button 
                     onClick={generatePDF}
                     disabled={isGeneratingPdf}
                     className="p-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl backdrop-blur-sm transition-all active:scale-95"
                     title="Exportar PDF"
                   >
                     {isGeneratingPdf ? <Loader2 size={20} className="animate-spin"/> : <Download size={20} />}
                   </button>
                   <button 
                     onClick={onDeleteCrop}
                     className="p-2.5 bg-white/10 hover:bg-red-500/80 text-white rounded-xl backdrop-blur-sm transition-all active:scale-95"
                     title="Excluir Lavoura"
                   >
                     <Trash2 size={20} />
                   </button>
               </div>
            </div>

            {/* Desktop Tabs (Hidden on Mobile - now using Bottom Bar) */}
            <div className="hidden md:flex overflow-x-auto gap-2 pb-2 no-scrollbar">
                {[
                  { id: 'overview', label: 'Visão Geral', icon: ListTodo },
                  { id: 'finance', label: 'Finanças', icon: DollarSign },
                  { id: 'timeline', label: 'Etapas', icon: Calendar },
                  { id: 'assistant', label: 'Assistente IA', icon: MessageSquare },
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

         {/* Decorative Background Elements */}
         <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
         <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-black/10 rounded-full blur-2xl pointer-events-none"></div>
      </div>

      {/* Content Area */}
      <div className="min-h-[500px] pb-32 md:pb-0 animate-slide-up">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'finance' && renderFinance()}
        {activeTab === 'timeline' && renderTimeline()}
        {activeTab === 'assistant' && renderAssistant()}
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 px-6 py-3 z-50 flex justify-between items-center shadow-lg pb-safe">
         {[
            { id: 'overview', label: 'Visão', icon: ListTodo },
            { id: 'finance', label: 'Finanças', icon: DollarSign },
            { id: 'timeline', label: 'Etapas', icon: Calendar },
            { id: 'assistant', label: 'IA', icon: MessageSquare },
         ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
               <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex flex-col items-center gap-1 transition-colors duration-300 ${isActive ? 'text-agro-green' : 'text-gray-400 dark:text-gray-500'}`}
               >
                  <div className={`
                      p-1.5 rounded-xl transition-all duration-300
                      ${isActive ? 'bg-green-50 dark:bg-green-900/20 -translate-y-1' : ''}
                  `}>
                      <tab.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span className="text-[10px] font-bold">{tab.label}</span>
               </button>
            )
         })}
      </div>
    </div>
  );
};
