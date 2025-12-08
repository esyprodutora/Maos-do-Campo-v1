
import React, { useState, useEffect } from 'react';
import { CropData, StageResource, ResourceType, InventoryItem, FinancialTransaction } from '../types';
import { getAssistantResponse } from '../services/geminiService';
import { getMarketQuotes } from '../services/marketService';
import { Reports } from './Reports';
import { 
  ArrowLeft, Calendar, DollarSign, ListTodo, Send, 
  Check, MapPin, Trash2, Plus, Edit2, 
  User, Tractor, Beaker, Package, 
  TrendingUp, Warehouse, AlertCircle, 
  ChevronDown, ChevronUp, Leaf, Truck, CheckCircle2,
  Sprout, Wallet, MessageCircle, FileText, X, Save, Clock
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { GOOGLE_MAPS_API_KEY } from '../config/env';

interface CropDetailsProps {
  crop: CropData;
  onBack: () => void;
  onUpdateCrop: (updatedCrop: CropData) => void;
  onDeleteCrop: () => void;
}

export const CropDetails: React.FC<CropDetailsProps> = ({ crop, onBack, onUpdateCrop, onDeleteCrop }) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'finance' | 'inventory' | 'assistant' | 'reports'>('timeline');
  
  // Assistant State
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'ai', text: string}[]>([
    { role: 'ai', text: `Olá. Sou o Tonico. Acompanho o cronograma da sua lavoura de ${crop.name}. O que precisa?` }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Market Data State
  const [marketPrice, setMarketPrice] = useState<number>(0);
  const [marketUnit, setMarketUnit] = useState<string>('sc 60kg');

  useEffect(() => {
    const loadMarket = async () => {
      const quotes = await getMarketQuotes();
      const quote = quotes.find(q => 
        (crop.type === 'cafe' && q.id === 'cafe') ||
        (crop.type === 'soja' && q.id === 'soja') ||
        (crop.type === 'milho' && q.id === 'milho')
      );
      
      if (quote) {
        setMarketPrice(quote.price);
        setMarketUnit(quote.unit);
      } else {
        setMarketPrice(100); 
      }
    };
    loadMarket();
  }, [crop.type]);

  // --- TIMELINE LOGIC ---
  const [expandedStageId, setExpandedStageId] = useState<string | null>(crop.timeline?.[0]?.id || null);
  const [isEditingTimeline, setIsEditingTimeline] = useState(false);
  const [newResourceStageId, setNewResourceStageId] = useState<string | null>(null);
  const [newResource, setNewResource] = useState<Partial<StageResource>>({
      name: '', type: 'insumo', quantity: 0, unit: 'un', unitCost: 0, ownership: 'alugado'
  });

  const handleAddResource = (stageId: string) => {
      if (!newResource.name || !newResource.quantity || !newResource.unitCost) return alert("Preencha todos os campos");
      
      const updatedTimeline = crop.timeline.map(stage => {
          if (stage.id === stageId) {
              const res: StageResource = {
                  id: Math.random().toString(36).substr(2, 9),
                  name: newResource.name!,
                  type: newResource.type as ResourceType,
                  quantity: Number(newResource.quantity),
                  unit: newResource.unit!,
                  unitCost: Number(newResource.unitCost),
                  totalCost: Number(newResource.quantity) * Number(newResource.unitCost),
                  ownership: newResource.type === 'maquinario' ? newResource.ownership : undefined
              };
              return { ...stage, resources: [...(stage.resources || []), res] };
          }
          return stage;
      });

      onUpdateCrop({ ...crop, timeline: updatedTimeline });
      setNewResourceStageId(null);
      setNewResource({ name: '', type: 'insumo', quantity: 0, unit: 'un', unitCost: 0, ownership: 'alugado' });
  };

  const handleDeleteResource = (stageId: string, resourceId: string) => {
      if(!confirm("Remover este recurso?")) return;
      const updatedTimeline = crop.timeline.map(stage => {
          if(stage.id === stageId) {
              return { ...stage, resources: stage.resources.filter(r => r.id !== resourceId) };
          }
          return stage;
      });
      onUpdateCrop({ ...crop, timeline: updatedTimeline });
  };

  const toggleTask = (stageId: string, taskId: string) => {
    const updatedTimeline = (crop.timeline || []).map(stage => {
        if (stage.id === stageId) {
            const updatedTasks = stage.tasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t);
            const allDone = updatedTasks.every(t => t.done);
            const status = allDone ? 'concluido' : stage.status;
            return { ...stage, tasks: updatedTasks, status: status as any };
        }
        return stage;
    });
    onUpdateCrop({ ...crop, timeline: updatedTimeline });
  };

  // --- INVENTORY LOGIC ---
  const [isAddingStock, setIsAddingStock] = useState(false);
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [stockForm, setStockForm] = useState({ quantity: 0, location: '' });

  const handleSaveStock = () => {
    if(stockForm.quantity <= 0) return;
    
    let updatedInventory = [...(crop.inventory || [])];

    if (editingStockId) {
      // Edit existing
      updatedInventory = updatedInventory.map(item => 
        item.id === editingStockId 
          ? { ...item, quantity: Number(stockForm.quantity), location: stockForm.location }
          : item
      );
    } else {
      // Add new
      const item: InventoryItem = {
        id: Math.random().toString(36).substr(2, 9),
        cropType: crop.type,
        quantity: Number(stockForm.quantity),
        unit: marketUnit,
        dateStored: new Date().toISOString(),
        location: stockForm.location || 'Armazém Geral',
        estimatedUnitValue: marketPrice
      };
      updatedInventory.push(item);
    }

    onUpdateCrop({ ...crop, inventory: updatedInventory });
    resetStockForm();
  };

  const handleEditStock = (item: InventoryItem) => {
    setStockForm({ quantity: item.quantity, location: item.location });
    setEditingStockId(item.id);
    setIsAddingStock(true);
  };

  const handleDeleteStock = (id: string) => {
    if(!confirm("Remover este item do estoque?")) return;
    const updatedInventory = crop.inventory.filter(i => i.id !== id);
    onUpdateCrop({ ...crop, inventory: updatedInventory });
  };

  const resetStockForm = () => {
    setIsAddingStock(false);
    setEditingStockId(null);
    setStockForm({ quantity: 0, location: '' });
  };

  const handleHarvestAction = (stageId: string) => {
    setExpandedStageId(null);
    setActiveTab('inventory');
    setIsAddingStock(true);
    setStockForm({ quantity: 0, location: 'Silo da Fazenda' }); // Default suggestion
  };

  // --- FINANCE LOGIC ---
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const [newTx, setNewTx] = useState<Partial<FinancialTransaction>>({
    description: '', amount: 0, type: 'despesa', category: 'insumo', status: 'pago'
  });

  const handleAddTransaction = () => {
    if(!newTx.description || !newTx.amount) return;
    const tx: FinancialTransaction = {
      id: Math.random().toString(36).substr(2, 9),
      description: newTx.description!,
      amount: Number(newTx.amount),
      type: newTx.type as any,
      category: newTx.category as any,
      status: newTx.status as any,
      date: new Date().toISOString()
    };
    onUpdateCrop({ ...crop, transactions: [...(crop.transactions || []), tx] });
    setIsAddingTransaction(false);
    setNewTx({ description: '', amount: 0, type: 'despesa', category: 'insumo', status: 'pago' });
  };

  const totalOperationalCost = crop.timeline?.reduce((acc, stage) => 
    acc + (stage.resources?.reduce((sAcc, r) => sAcc + r.totalCost, 0) || 0), 0
  ) || 0;
  const totalPaid = crop.transactions?.filter(t => t.type === 'despesa' && t.status === 'pago').reduce((acc, t) => acc + t.amount, 0) || 0;
  const totalInventoryValue = (crop.inventory || []).reduce((acc, item) => acc + (item.quantity * marketPrice), 0);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsChatLoading(true);
    const context = `Lavoura: ${crop.name} (${crop.type}). Etapa atual: ${crop.timeline?.find(s=>s.status === 'em_andamento')?.title || 'Início'}. Estoque: ${totalInventoryValue} BRL.`;
    const response = await getAssistantResponse(userMsg, context);
    setChatHistory(prev => [...prev, { role: 'ai', text: response }]);
    setIsChatLoading(false);
  };

  const getCropGradient = (type: string) => {
    switch(type) {
      case 'cafe': return 'from-[#A67C52] to-[#8B6540]';
      case 'milho': return 'from-orange-500 to-red-500';
      case 'soja': return 'from-yellow-500 to-orange-500';
      default: return 'from-agro-green to-emerald-600';
    }
  };

  // --- RENDERERS ---

  const renderTimeline = () => (
    <div className="space-y-6 animate-slide-up">
      <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
        <div>
           <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
             <ListTodo className="text-agro-green"/> Cronograma Operacional
           </h3>
           <p className="text-sm text-gray-500">Acompanhamento passo-a-passo da safra.</p>
        </div>
        <button 
          onClick={() => setIsEditingTimeline(!isEditingTimeline)}
          className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors ${isEditingTimeline ? 'bg-agro-green text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300'}`}
        >
          {isEditingTimeline ? <Check size={16} /> : <Edit2 size={16} />} 
          {isEditingTimeline ? 'Salvar Edição' : 'Editar Cronograma'}
        </button>
      </div>

      <div className="relative border-l-2 border-dashed border-gray-200 dark:border-slate-700 ml-4 space-y-10 pb-12">
        {crop.timeline?.map((stage, idx) => {
          const isExpanded = expandedStageId === stage.id;
          const stageCost = stage.resources?.reduce((a,b) => a + b.totalCost, 0) || 0;
          
          let StageIcon = Leaf;
          if(stage.type === 'preparo') StageIcon = Tractor;
          if(stage.type === 'plantio') StageIcon = Sprout;
          if(stage.type === 'colheita') StageIcon = Package;
          if(stage.type === 'pos_colheita') StageIcon = Truck;

          return (
            <div key={stage.id} className="relative pl-10">
              {/* Dot Icon */}
              <div className={`
                absolute -left-[21px] top-0 w-11 h-11 rounded-full flex items-center justify-center border-4 border-gray-50 dark:border-slate-900 z-10 shadow-md
                ${stage.status === 'concluido' ? 'bg-agro-green text-white' : 'bg-white dark:bg-slate-800 text-gray-400 dark:text-gray-500'}
              `}>
                 <StageIcon size={20} />
              </div>

              {/* Stage Card */}
              <div className={`
                bg-white dark:bg-slate-800 rounded-3xl shadow-sm border transition-all duration-300 overflow-hidden group
                ${isExpanded ? 'border-agro-green ring-1 ring-agro-green/20 shadow-xl' : 'border-gray-100 dark:border-slate-700 hover:shadow-md'}
              `}>
                 {/* Header */}
                 <div 
                   onClick={() => setExpandedStageId(isExpanded ? null : stage.id)}
                   className="p-6 cursor-pointer flex justify-between items-center hover:bg-gray-50 dark:hover:bg-slate-700/50"
                 >
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-extrabold uppercase tracking-widest text-gray-400 bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded-md">Fase {idx + 1}</span>
                      </div>
                      <h4 className="font-bold text-gray-900 dark:text-white text-xl">{stage.title}</h4>
                      
                      <div className="flex items-center gap-6 mt-2 text-sm">
                         <span className="flex items-center gap-1.5 text-gray-500"><Clock size={14} className="text-agro-green"/> {stage.dateEstimate}</span>
                         <span className="flex items-center gap-1.5 font-bold text-gray-700 dark:text-gray-300 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-lg border border-green-100 dark:border-green-900/30">
                           <DollarSign size={14} className="text-green-600"/> {stageCost.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
                         </span>
                      </div>
                    </div>
                    
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isExpanded ? 'bg-agro-green text-white rotate-180' : 'bg-gray-100 dark:bg-slate-700 text-gray-400'}`}>
                       <ChevronDown size={20}/>
                    </div>
                 </div>

                 {isExpanded && (
                   <div className="animate-fade-in">
                      {/* SECTION 1: ACTIVITIES (SCHEDULE) - White Background */}
                      <div className="px-8 py-8 border-t border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                          <div className="flex items-center gap-2 mb-4">
                             <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg"><ListTodo size={18}/></div>
                             <h5 className="font-bold text-gray-800 dark:text-white text-lg">Atividades</h5>
                          </div>
                          
                          <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed bg-gray-50 dark:bg-slate-700/30 p-4 rounded-xl border border-gray-100 dark:border-slate-700 italic">
                            "{stage.description}"
                          </p>
                          
                          <div className="space-y-3 pl-2">
                             {stage.tasks?.map(task => (
                               <div key={task.id} onClick={() => !isEditingTimeline && toggleTask(stage.id, task.id)} className="flex items-start gap-4 p-3 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors group/task">
                                  <div className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${task.done ? 'bg-agro-green border-agro-green' : 'border-gray-300 dark:border-slate-500 group-hover/task:border-agro-green'}`}>
                                     {task.done && <Check size={14} className="text-white"/>}
                                  </div>
                                  <span className={`text-base ${task.done ? 'text-gray-400 line-through' : 'text-gray-800 dark:text-gray-200 font-medium'}`}>{task.text}</span>
                               </div>
                             ))}
                          </div>
                      </div>

                      {/* SECTION 2: COSTS (INPUTS/MACHINES/LABOR) - Distinct Background */}
                      <div className="px-8 py-8 border-t-4 border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 relative">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                           <DollarSign size={100} />
                        </div>

                        <div className="flex justify-between items-center mb-6 relative z-10">
                           <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-green-100 text-green-600 rounded-lg"><Wallet size={18}/></div>
                              <h5 className="font-bold text-gray-800 dark:text-white text-lg">Recursos & Custos</h5>
                           </div>
                           
                           {isEditingTimeline && (
                             <button onClick={() => setNewResourceStageId(stage.id)} className="text-sm flex items-center gap-2 text-white font-bold bg-agro-green px-4 py-2 rounded-xl shadow hover:bg-green-700 transition-colors">
                               <Plus size={16}/> Adicionar Item
                             </button>
                           )}
                        </div>

                        {/* Add Form */}
                        {newResourceStageId === stage.id && (
                           <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl mb-6 border border-agro-green/30 animate-fade-in shadow-lg">
                              <h6 className="font-bold mb-4 text-sm uppercase tracking-wide text-gray-500">Novo Recurso</h6>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <select 
                                    className="p-3 rounded-xl border bg-gray-50 dark:bg-slate-900 dark:border-slate-700"
                                    value={newResource.type}
                                    onChange={e => setNewResource({...newResource, type: e.target.value as any})}
                                >
                                    <option value="insumo">Insumo (Sementes, Adubos...)</option>
                                    <option value="maquinario">Maquinário (Tratores...)</option>
                                    <option value="mao_de_obra">Mão de Obra (Operador...)</option>
                                </select>
                                <input placeholder="Nome (Ex: Adubo NPK)" className="p-3 rounded-xl border bg-gray-50 dark:bg-slate-900 dark:border-slate-700" value={newResource.name} onChange={e=>setNewResource({...newResource, name: e.target.value})}/>
                                <input type="number" placeholder="Quantidade" className="p-3 rounded-xl border bg-gray-50 dark:bg-slate-900 dark:border-slate-700" value={newResource.quantity || ''} onChange={e=>setNewResource({...newResource, quantity: Number(e.target.value)})}/>
                                <input type="number" placeholder="Custo Unitário (R$)" className="p-3 rounded-xl border bg-gray-50 dark:bg-slate-900 dark:border-slate-700" value={newResource.unitCost || ''} onChange={e=>setNewResource({...newResource, unitCost: Number(e.target.value)})}/>
                              </div>
                              <button onClick={() => handleAddResource(stage.id)} className="w-full bg-agro-green text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-colors">Salvar Recurso</button>
                           </div>
                        )}

                        {/* Resource Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                            {/* INSUMOS */}
                            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm">
                                <h6 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-gray-100 dark:border-slate-700 pb-2">
                                  <Beaker size={14} className="text-green-500"/> Insumos
                                </h6>
                                <div className="space-y-4">
                                    {stage.resources?.filter(r => r.type === 'insumo').map(res => (
                                        <div key={res.id} className="text-sm group relative">
                                            <div className="flex justify-between items-start">
                                                <span className="font-bold text-gray-700 dark:text-gray-200 w-2/3">{res.name}</span>
                                                <span className="font-bold text-gray-900 dark:text-white">{res.totalCost.toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}</span>
                                            </div>
                                            <div className="text-gray-500 text-xs mt-0.5">{res.quantity} {res.unit} x {res.unitCost}</div>
                                            {isEditingTimeline && (
                                              <button onClick={() => handleDeleteResource(stage.id, res.id)} className="absolute -right-2 -top-2 p-1 bg-red-100 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={12}/></button>
                                            )}
                                        </div>
                                    ))}
                                    {!stage.resources?.some(r => r.type === 'insumo') && <p className="text-xs text-gray-400 italic text-center py-4">Nenhum insumo</p>}
                                </div>
                            </div>

                            {/* MAQUINÁRIO */}
                            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm">
                                <h6 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-gray-100 dark:border-slate-700 pb-2">
                                  <Tractor size={14} className="text-orange-500"/> Maquinário
                                </h6>
                                <div className="space-y-4">
                                    {stage.resources?.filter(r => r.type === 'maquinario').map(res => (
                                        <div key={res.id} className="text-sm group relative">
                                            <div className="flex justify-between items-start">
                                                <span className="font-bold text-gray-700 dark:text-gray-200 w-2/3">{res.name}</span>
                                                <span className="font-bold text-gray-900 dark:text-white">{res.totalCost.toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}</span>
                                            </div>
                                            <div className="text-gray-500 text-xs mt-0.5">{res.quantity} {res.unit} x {res.unitCost}</div>
                                            {isEditingTimeline && (
                                              <button onClick={() => handleDeleteResource(stage.id, res.id)} className="absolute -right-2 -top-2 p-1 bg-red-100 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={12}/></button>
                                            )}
                                        </div>
                                    ))}
                                    {!stage.resources?.some(r => r.type === 'maquinario') && <p className="text-xs text-gray-400 italic text-center py-4">Nenhum maquinário</p>}
                                </div>
                            </div>

                            {/* MÃO DE OBRA */}
                            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm">
                                <h6 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-gray-100 dark:border-slate-700 pb-2">
                                  <User size={14} className="text-blue-500"/> Mão de Obra
                                </h6>
                                <div className="space-y-4">
                                    {stage.resources?.filter(r => r.type === 'mao_de_obra').map(res => (
                                        <div key={res.id} className="text-sm group relative">
                                            <div className="flex justify-between items-start">
                                                <span className="font-bold text-gray-700 dark:text-gray-200 w-2/3">{res.name}</span>
                                                <span className="font-bold text-gray-900 dark:text-white">{res.totalCost.toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}</span>
                                            </div>
                                            <div className="text-gray-500 text-xs mt-0.5">{res.quantity} {res.unit} x {res.unitCost}</div>
                                            {isEditingTimeline && (
                                              <button onClick={() => handleDeleteResource(stage.id, res.id)} className="absolute -right-2 -top-2 p-1 bg-red-100 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={12}/></button>
                                            )}
                                        </div>
                                    ))}
                                    {!stage.resources?.some(r => r.type === 'mao_de_obra') && <p className="text-xs text-gray-400 italic text-center py-4">Nenhuma M.O.</p>}
                                </div>
                            </div>
                        </div>
                      </div>
                      
                      {(stage.type === 'colheita' || stage.type === 'pos_colheita') && (
                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border-t border-yellow-100 dark:border-yellow-900/20 flex justify-end">
                           <button 
                             onClick={() => handleHarvestAction(stage.id)}
                             className="flex items-center gap-2 px-6 py-3 bg-yellow-500 text-white rounded-xl font-bold hover:bg-yellow-600 shadow-lg shadow-yellow-500/20 transition-all active:scale-95"
                           >
                             <Warehouse size={20} /> Registrar Entrada no Estoque
                           </button>
                        </div>
                      )}
                   </div>
                 )}
              </div>
            </div>
          );
        })}
        {(!crop.timeline || crop.timeline.length === 0) && (
            <div className="p-10 text-center border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-3xl bg-gray-50 dark:bg-slate-800">
                <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200">Cronograma não gerado</h3>
                <p className="text-gray-500 mt-2 mb-4">Houve um problema ao criar o plano operacional.</p>
                <p className="text-xs text-gray-400 bg-gray-100 dark:bg-slate-700 p-2 rounded-lg inline-block">Dica: Tente excluir esta lavoura e criar novamente.</p>
            </div>
        )}
      </div>
    </div>
  );

  const renderInventory = () => (
    <div className="space-y-6 animate-slide-up">
       <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
               <Warehouse className="text-yellow-500"/> Estoque Físico
            </h3>
            <p className="text-sm text-gray-500">Valorização em tempo real baseada na cotação: <strong>R$ {marketPrice.toFixed(2)} / {marketUnit}</strong></p>
          </div>
          <div className="text-right">
             <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Valor Estimado</p>
             <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
               {totalInventoryValue.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
             </h2>
          </div>
       </div>

       {isAddingStock ? (
         <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border-2 border-yellow-400 dark:border-yellow-600 shadow-xl animate-fade-in relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            
            <h4 className="font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2 text-lg relative z-10">
               <div className="p-2 bg-yellow-100 text-yellow-700 rounded-lg">
                 {editingStockId ? <Edit2 size={20}/> : <Plus size={20}/>}
               </div>
               {editingStockId ? 'Editar Item do Estoque' : 'Nova Entrada de Colheita'}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 relative z-10">
               <div>
                 <label className="text-xs font-bold text-gray-500 dark:text-gray-400 ml-1 uppercase tracking-wider">Quantidade ({marketUnit})</label>
                 <div className="mt-1 relative">
                    <input 
                      type="number" 
                      autoFocus
                      className="w-full p-4 pl-12 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none text-lg font-bold" 
                      value={stockForm.quantity || ''}
                      onChange={e => setStockForm({...stockForm, quantity: Number(e.target.value)})}
                    />
                    <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                 </div>
               </div>
               <div>
                 <label className="text-xs font-bold text-gray-500 dark:text-gray-400 ml-1 uppercase tracking-wider">Local de Armazenamento</label>
                 <div className="mt-1 relative">
                    <input 
                        type="text"
                        list="storage-locations"
                        className="w-full p-4 pl-12 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none text-lg font-bold"
                        value={stockForm.location}
                        onChange={e => setStockForm({...stockForm, location: e.target.value})}
                        placeholder="Ex: Silo 1"
                    />
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                    <datalist id="storage-locations">
                        <option value="Silo da Fazenda" />
                        <option value="Tulha" />
                        <option value="Cooperativa" />
                        <option value="Armazém Geral" />
                    </datalist>
                 </div>
               </div>
            </div>
            <div className="flex justify-end gap-3 relative z-10">
               <button onClick={resetStockForm} className="px-6 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl flex items-center gap-2 transition-colors">
                  Cancelar
               </button>
               <button onClick={handleSaveStock} className="px-8 py-3 bg-yellow-500 text-white font-bold rounded-xl hover:bg-yellow-600 shadow-lg shadow-yellow-500/30 flex items-center gap-2 transition-transform active:scale-95">
                  <CheckCircle2 size={20}/> {editingStockId ? 'Salvar Alterações' : 'Confirmar Entrada'}
               </button>
            </div>
         </div>
       ) : (
         <button onClick={() => setIsAddingStock(true)} className="w-full py-4 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-3xl text-gray-400 hover:text-yellow-500 hover:border-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/10 transition-all flex flex-col items-center justify-center gap-2 group">
            <div className="p-3 bg-gray-100 dark:bg-slate-700 rounded-full group-hover:bg-yellow-100 group-hover:text-yellow-600 transition-colors">
               <Plus size={24}/> 
            </div>
            <span className="font-bold">Registrar Nova Entrada Manual</span>
         </button>
       )}

       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {crop.inventory?.map((item, i) => (
             <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                
                {/* Edit Controls Overlay */}
                <div className="absolute top-4 right-4 flex gap-2 z-20">
                    <button onClick={() => handleEditStock(item)} className="p-2 bg-white/90 dark:bg-slate-700/90 shadow-sm border hover:border-yellow-400 text-gray-500 hover:text-yellow-600 rounded-xl transition-colors" title="Editar">
                        <Edit2 size={16}/>
                    </button>
                    <button onClick={() => handleDeleteStock(item.id)} className="p-2 bg-white/90 dark:bg-slate-700/90 shadow-sm border hover:border-red-400 text-gray-500 hover:text-red-600 rounded-xl transition-colors" title="Excluir">
                        <Trash2 size={16}/>
                    </button>
                </div>
                
                {/* Background Icon */}
                <div className="absolute -bottom-4 -right-4 text-gray-50 dark:text-slate-700 transform rotate-12 group-hover:scale-110 transition-transform pointer-events-none">
                   <Package size={120} />
                </div>

                <div className="relative z-10">
                   <div className="flex justify-between items-start mb-4">
                      <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1">
                        <MapPin size={12}/> {item.location}
                      </span>
                   </div>
                   
                   <div className="mb-6">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Volume</span>
                      <h3 className="text-4xl font-extrabold text-gray-900 dark:text-white mt-1">
                          {item.quantity} <span className="text-lg font-medium text-gray-400">{item.unit}</span>
                      </h3>
                      <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                         <Calendar size={12}/> {new Date(item.dateStored).toLocaleDateString()}
                      </p>
                   </div>

                   <div className="pt-4 border-t border-gray-100 dark:border-slate-700 flex items-center gap-3">
                      <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600">
                         <TrendingUp size={20} />
                      </div>
                      <div>
                         <p className="text-xs text-gray-500 font-medium">Valor de Mercado (Hoje)</p>
                         <p className="text-lg font-bold text-gray-900 dark:text-white">
                           {(item.quantity * marketPrice).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
                         </p>
                      </div>
                   </div>
                </div>
             </div>
          ))}
          
          {(!crop.inventory || crop.inventory.length === 0) && !isAddingStock && (
             <div className="col-span-full py-12 text-center text-gray-400 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-3xl">
                <Warehouse size={48} className="mx-auto mb-3 opacity-20"/>
                <p className="font-medium">Seu estoque está vazio.</p>
                <p className="text-sm opacity-70">Registre colheitas para ver a evolução patrimonial.</p>
             </div>
          )}
       </div>
    </div>
  );

  const renderFinance = () => (
    <div className="space-y-6 animate-slide-up">
       
       {/* Comparison Cards */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
             <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><ListTodo size={20}/></div>
                <h4 className="font-bold text-gray-700 dark:text-gray-200">Custo Operacional (Consumo)</h4>
             </div>
             <p className="text-3xl font-extrabold text-gray-900 dark:text-white">
                {totalOperationalCost.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
             </p>
             <p className="text-xs text-gray-400 mt-2">Calculado com base nos recursos inseridos nas etapas.</p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
             <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-50 text-green-600 rounded-lg"><Wallet size={20}/></div>
                <h4 className="font-bold text-gray-700 dark:text-gray-200">Fluxo de Caixa (Realizado)</h4>
             </div>
             <p className="text-3xl font-extrabold text-gray-900 dark:text-white">
                {totalPaid.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
             </p>
             <p className="text-xs text-gray-400 mt-2">Soma dos pagamentos efetivados e lançados.</p>
          </div>
       </div>

       {/* Transaction List */}
       <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
             <h3 className="font-bold text-lg text-gray-800 dark:text-white">Lançamentos Financeiros</h3>
             <button 
               onClick={() => setIsAddingTransaction(!isAddingTransaction)}
               className="text-sm font-bold text-agro-green flex items-center gap-1 bg-green-50 px-3 py-1.5 rounded-xl hover:bg-green-100"
             >
               <Plus size={16}/> Novo Lançamento
             </button>
          </div>
          
          {isAddingTransaction && (
             <div className="p-6 bg-gray-50 dark:bg-slate-900 border-b border-gray-100 dark:border-slate-700 animate-fade-in">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
                   <select className="p-3 rounded-xl border text-sm" value={newTx.type} onChange={e => setNewTx({...newTx, type: e.target.value as any})}>
                      <option value="despesa">Despesa</option>
                      <option value="receita">Receita</option>
                   </select>
                   <input className="p-3 rounded-xl border text-sm md:col-span-2" placeholder="Descrição (Ex: Pagto Tratorista)" value={newTx.description} onChange={e => setNewTx({...newTx, description: e.target.value})} />
                   <input className="p-3 rounded-xl border text-sm" type="number" placeholder="Valor R$" value={newTx.amount || ''} onChange={e => setNewTx({...newTx, amount: Number(e.target.value)})} />
                   <select className="p-3 rounded-xl border text-sm" value={newTx.status} onChange={e => setNewTx({...newTx, status: e.target.value as any})}>
                      <option value="pago">Pago</option>
                      <option value="pendente">Pendente</option>
                   </select>
                </div>
                <button onClick={handleAddTransaction} className="w-full py-3 bg-agro-green text-white font-bold rounded-xl shadow-md">Salvar Lançamento</button>
             </div>
          )}

          <div className="divide-y divide-gray-100 dark:divide-slate-700">
             {crop.transactions?.length === 0 ? (
               <div className="p-10 text-center text-gray-400">Nenhum lançamento registrado.</div>
             ) : (
               crop.transactions?.map((tx, i) => (
                 <div key={i} className="p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="flex items-center gap-4">
                       <div className={`p-2 rounded-full ${tx.type === 'receita' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                          {tx.type === 'receita' ? <TrendingUp size={18}/> : <DollarSign size={18}/>}
                       </div>
                       <div>
                          <p className="font-bold text-gray-800 dark:text-gray-200">{tx.description}</p>
                          <p className="text-xs text-gray-500">{new Date(tx.date).toLocaleDateString()} • <span className="capitalize">{tx.category}</span></p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className={`font-bold ${tx.type === 'receita' ? 'text-green-600' : 'text-gray-900 dark:text-white'}`}>
                          {tx.type === 'despesa' ? '- ' : '+ '}
                          {tx.amount.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
                       </p>
                       <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${tx.status === 'pago' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {tx.status}
                       </span>
                    </div>
                 </div>
               ))
             )}
          </div>
       </div>
    </div>
  );

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
      <div className={`rounded-b-3xl md:rounded-3xl shadow-xl p-6 text-white bg-gradient-to-br ${getCropGradient(crop.type)} relative overflow-hidden`}>
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
                    {id: 'timeline', label: 'Cronograma', icon: ListTodo},
                    {id: 'inventory', label: 'Estoque', icon: Warehouse},
                    {id: 'finance', label: 'Financeiro', icon: DollarSign},
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
        {activeTab === 'timeline' && renderTimeline()}
        {activeTab === 'inventory' && renderInventory()}
        {activeTab === 'finance' && renderFinance()}
        {activeTab === 'assistant' && renderAssistant()}
        {activeTab === 'reports' && <Reports crop={crop} />}
      </div>
    </div>
  );
};
