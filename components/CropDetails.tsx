import React, { useState, useEffect } from 'react';
import { CropData, TimelineStage, Material, HarvestLog } from '../types';
import { getAssistantResponse } from '../services/geminiService';
import { getCurrentPrice } from '../services/marketService'; // Importar serviço de cotação
import { Reports } from './Reports';
import { ArrowLeft, Calendar, DollarSign, ListTodo, MessageSquare, Send, CheckCircle, Circle, AlertCircle, Droplets, Ruler, ShoppingBag, Download, Loader2, Edit2, Check, MapPin, Navigation, Trash2, Plus, X, Clock, Sprout, FileText, Home, Sparkles, Bot, MessageCircle, Warehouse, Package, Truck, TrendingUp } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'finance' | 'timeline' | 'assistant' | 'storage' | 'reports'>('overview');
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

  // State for Storage/Harvest
  const [isAddingHarvest, setIsAddingHarvest] = useState(false);
  const [editingHarvestId, setEditingHarvestId] = useState<string | null>(null); // ID sendo editado
  const [harvestForm, setHarvestForm] = useState<HarvestLog>({
      id: '',
      date: new Date().toISOString().split('T')[0],
      quantity: 0,
      unit: 'sc',
      location: '',
      qualityNote: ''
  });
  const [currentMarketPrice, setCurrentMarketPrice] = useState<number>(0);

  // Carregar preço de mercado ao abrir a aba de armazenagem
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

  // Handlers abreviados para focar no Storage...
  const toggleTask = (stageId: string, taskId: string) => { /* ... */ };
  const handleAddStage = () => { /* ... */ };
  const handleRemoveStage = (index: number) => { /* ... */ };
  const handleUpdateStage = (index: number, field: keyof TimelineStage, value: any) => { /* ... */ };
  const handleUpdateMaterial = (index: number, field: 'quantity' | 'unitPriceEstimate', value: string) => { /* ... */ };
  const handleRemoveItem = (index: number) => { /* ... */ };
  const handleAddItem = () => { /* ... */ };

  // --- Storage / Harvest Handlers ---
  const handleSaveHarvest = () => {
      if(harvestForm.quantity <= 0) return alert("Quantidade deve ser maior que zero.");
      
      let updatedLogs = [...(crop.harvestLogs || [])];
      
      if (editingHarvestId) {
          // Editar existente
          updatedLogs = updatedLogs.map(h => h.id === editingHarvestId ? { ...harvestForm, id: editingHarvestId } : h);
      } else {
          // Criar novo
          const newLog = { ...harvestForm, id: Math.random().toString(36).substr(2, 9) };
          updatedLogs.push(newLog);
      }
      
      onUpdateCrop({ ...crop, harvestLogs: updatedLogs });
      
      // Reset form
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

  const handleChatSubmit = async (e: React.FormEvent) => { /* ... */ };
  const generatePDF = () => { /* ... */ };

  // Renders...
  const renderOverview = () => { /* ... */ return null; }; // Placeholder
  const renderFinance = () => { /* ... */ return null; }; // Placeholder
  const renderTimeline = () => { /* ... */ return null; }; // Placeholder
  const renderAssistant = () => { /* ... */ return null; }; // Placeholder

  const renderStorage = () => {
    const logs = crop.harvestLogs || [];
    const goalValue = parseFloat(crop.productivityGoal.replace(/[^0-9.]/g, '')) || 0; 
    const totalExpected = goalValue * crop.areaHa;
    const totalHarvested = logs.reduce((acc, l) => acc + l.quantity, 0);
    const progress = totalExpected > 0 ? (totalHarvested / totalExpected) * 100 : 0;
    
    // Cálculo de Receita Estimada
    const estimatedRevenue = totalHarvested * currentMarketPrice;

    return (
      <div className="space-y-6 animate-slide-up">
          {/* Progress & Revenue Card */}
          <div className={`rounded-3xl p-8 text-white shadow-lg bg-gradient-to-br ${theme.gradient} relative overflow-hidden`}>
             {/* Texture overlay */}
             <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')]"></div>

             <div className="relative z-10">
                <h3 className="font-bold text-lg opacity-90 mb-1 flex items-center gap-2">
                    <Warehouse size={20} /> Visão Geral da Colheita
                </h3>
                
                <div className="flex flex-col md:flex-row justify-between gap-6 mt-6">
                    <div>
                        <p className="text-sm font-medium opacity-80">Total Colhido</p>
                        <div className="flex items-end gap-2">
                            <span className="text-4xl font-extrabold">{totalHarvested.toLocaleString('pt-BR')}</span>
                            <span className="text-lg font-medium opacity-80 mb-1">sc</span>
                        </div>
                    </div>

                    {currentMarketPrice > 0 && (
                        <div className="bg-black/20 p-4 rounded-2xl backdrop-blur-sm">
                             <p className="text-xs font-medium opacity-80 mb-1 flex items-center gap-1">
                                <TrendingUp size={14}/> Receita Estimada (Cotação Hoje)
                             </p>
                             <p className="text-2xl font-bold text-green-300">
                                {estimatedRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                             </p>
                             <p className="text-[10px] opacity-60 mt-1">Baseado em R$ {currentMarketPrice.toFixed(2)}/sc</p>
                        </div>
                    )}
                </div>
                
                <div className="mt-8">
                    <div className="flex justify-between text-xs font-bold mb-2 opacity-80">
                        <span>Progresso da Safra</span>
                        <span>{progress.toFixed(1)}% da Meta ({totalExpected.toLocaleString('pt-BR')} sc)</span>
                    </div>
                    <div className="w-full bg-black/20 rounded-full h-3 overflow-hidden border border-white/10">
                        <div 
                            className="h-full bg-white rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(255,255,255,0.5)]" 
                            style={{ width: `${Math.min(progress, 100)}%` }} 
                        />
                    </div>
                </div>
             </div>
          </div>

          {/* Action & List */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-800 dark:text-white">Histórico de Cargas</h3>
                <button 
                  onClick={() => {
                      setIsAddingHarvest(!isAddingHarvest);
                      if (!isAddingHarvest) {
                          // Reset form for new entry
                          setHarvestForm({ id: '', date: new Date().toISOString().split('T')[0], quantity: 0, unit: 'sc', location: '', qualityNote: '' });
                          setEditingHarvestId(null);
                      }
                  }}
                  className="flex items-center gap-2 text-sm font-bold text-agro-green bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg hover:bg-green-100 transition-colors"
                >
                   {isAddingHarvest ? <X size={16}/> : <Plus size={16}/>} 
                   {isAddingHarvest ? 'Cancelar' : 'Nova Carga'}
                </button>
             </div>

             {isAddingHarvest && (
                <div className="mb-6 p-4 bg-gray-50 dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 animate-fade-in">
                   <h4 className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-3">
                       {editingHarvestId ? 'Editar Carga' : 'Registrar Colheita'}
                   </h4>
                   <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="col-span-2">
                         <label className="text-[10px] font-bold text-gray-400 uppercase">Local de Armazenamento</label>
                         <input 
                           type="text" 
                           placeholder="Ex: Silo 1, Cooperativa"
                           className="w-full p-3 rounded-xl border dark:border-slate-600 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-agro-green/20"
                           value={harvestForm.location}
                           onChange={e => setHarvestForm({...harvestForm, location: e.target.value})}
                         />
                      </div>
                      <div>
                         <label className="text-[10px] font-bold text-gray-400 uppercase">Data</label>
                         <input 
                           type="date" 
                           className="w-full p-3 rounded-xl border dark:border-slate-600 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-agro-green/20"
                           value={harvestForm.date}
                           onChange={e => setHarvestForm({...harvestForm, date: e.target.value})}
                         />
                      </div>
                      <div>
                         <label className="text-[10px] font-bold text-gray-400 uppercase">Qtd (Sacas)</label>
                         <input 
                           type="number" 
                           placeholder="0.00"
                           className="w-full p-3 rounded-xl border dark:border-slate-600 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-agro-green/20 font-bold"
                           value={harvestForm.quantity || ''}
                           onChange={e => setHarvestForm({...harvestForm, quantity: parseFloat(e.target.value)})}
                         />
                      </div>
                      <div className="col-span-2">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Obs. Qualidade (Opcional)</label>
                          <input 
                            type="text"
                            placeholder="Ex: Umidade 13%, Impureza 1%"
                            className="w-full p-3 rounded-xl border dark:border-slate-600 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-agro-green/20 text-sm"
                            value={harvestForm.qualityNote || ''}
                            onChange={e => setHarvestForm({...harvestForm, qualityNote: e.target.value})}
                          />
                      </div>
                   </div>
                   <button 
                     onClick={handleSaveHarvest}
                     className="w-full py-3 bg-agro-green text-white font-bold rounded-xl hover:bg-green-700 transition-transform active:scale-95 shadow-lg shadow-green-600/20"
                   >
                     {editingHarvestId ? 'Salvar Alterações' : 'Confirmar Registro'}
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
                       <div key={log.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-2xl border border-gray-100 dark:border-slate-700 hover:border-agro-green/30 transition-colors group">
                          <div className="flex items-center gap-3">
                             <div className={`p-3 rounded-xl bg-white dark:bg-slate-800 text-agro-green shadow-sm`}>
                                <Package size={20} />
                             </div>
                             <div>
                                <h4 className="font-bold text-gray-800 dark:text-white text-sm">{log.location}</h4>
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                    <Calendar size={10}/> {new Date(log.date).toLocaleDateString('pt-BR')}
                                </p>
                                {log.qualityNote && (
                                    <p className="text-[10px] text-orange-500 mt-0.5 bg-orange-50 dark:bg-orange-900/20 px-1.5 py-0.5 rounded-md inline-block">
                                        {log.qualityNote}
                                    </p>
                                )}
                             </div>
                          </div>
                          <div className="flex items-center gap-2">
                             <div className="text-right mr-2">
                                <span className="block font-extrabold text-lg text-gray-900 dark:text-white leading-tight">{log.quantity}</span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{log.unit}</span>
                             </div>
                             
                             {/* Ações de Edição/Exclusão */}
                             <button 
                               onClick={() => handleEditHarvest(log)} 
                               className="p-2 text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                               title="Editar"
                             >
                                 <Edit2 size={16}/>
                             </button>
                             <button 
                               onClick={() => handleDeleteHarvest(log.id)} 
                               className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                               title="Excluir"
                             >
                                 <Trash2 size={16}/>
                             </button>
                          </div>
                       </div>
                    ))
                )}
             </div>
          </div>
      </div>
    );
  };
