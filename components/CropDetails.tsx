
import React, { useState, useEffect } from 'react';
import { CropData, StageResource, ResourceType, InventoryItem, FinancialTransaction, TimelineStage } from '../types';
import { getAssistantResponse } from '../services/geminiService';
import { getMarketQuotes } from '../services/marketService';
import { Reports } from './Reports';
import { 
  ArrowLeft, Calendar, DollarSign, ListTodo, Send, 
  Check, MapPin, Trash2, Plus, Edit2, 
  User, Tractor, Beaker, Package, 
  TrendingUp, TrendingDown, Warehouse, AlertCircle, 
  ChevronDown, ChevronUp, Leaf, Truck, CheckCircle2,
  Sprout, Wallet, MessageCircle, FileText, X, Save, Clock,
  PlayCircle, StopCircle
} from 'lucide-react';

interface CropDetailsProps {
  crop: CropData;
  onBack: () => void;
  onUpdateCrop: (updatedCrop: CropData) => void;
  onDeleteCrop: () => void;
}

export const CropDetails = ({ crop, onBack, onUpdateCrop, onDeleteCrop }: CropDetailsProps) => {
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
  
  // Resource Form State
  const [resourceFormStageId, setResourceFormStageId] = useState<string | null>(null);
  const [editingResourceId, setEditingResourceId] = useState<string | null>(null);
  const [resourceForm, setResourceForm] = useState<Partial<StageResource>>({
      name: '', type: 'insumo', quantity: 0, unit: 'un', unitCost: 0, ownership: 'alugado'
  });

  const handleUpdateStage = (stageId: string, field: keyof TimelineStage, value: any) => {
    const updatedTimeline = crop.timeline.map(stage => 
       stage.id === stageId ? { ...stage, [field]: value } : stage
    );
    onUpdateCrop({ ...crop, timeline: updatedTimeline });
  };

  const handleOpenResourceForm = (stageId: string, resource?: StageResource) => {
      setResourceFormStageId(stageId);
      if (resource) {
          setEditingResourceId(resource.id);
          setResourceForm({ ...resource });
      } else {
          setEditingResourceId(null);
          setResourceForm({ name: '', type: 'insumo', quantity: 0, unit: 'un', unitCost: 0, ownership: 'alugado' });
      }
  };

  const handleCloseResourceForm = () => {
      setResourceFormStageId(null);
      setEditingResourceId(null);
      setResourceForm({ name: '', type: 'insumo', quantity: 0, unit: 'un', unitCost: 0, ownership: 'alugado' });
  };

  const handleSaveResource = (stageId: string) => {
      if (!resourceForm.name || !resourceForm.quantity || !resourceForm.unitCost) return alert("Preencha nome, quantidade e custo.");
      
      const updatedTimeline = crop.timeline.map(stage => {
          if (stage.id === stageId) {
              let updatedResources = [...(stage.resources || [])];
              
              const totalCost = Number(resourceForm.quantity) * Number(resourceForm.unitCost);
              const newResData: StageResource = {
                  id: editingResourceId || Math.random().toString(36).substr(2, 9),
                  name: resourceForm.name!,
                  type: resourceForm.type as ResourceType,
                  quantity: Number(resourceForm.quantity),
                  unit: resourceForm.unit || 'un',
                  unitCost: Number(resourceForm.unitCost),
                  totalCost: totalCost,
                  ownership: resourceForm.type === 'maquinario' ? resourceForm.ownership : undefined
              };

              if (editingResourceId) {
                  // Update existing
                  updatedResources = updatedResources.map(r => r.id === editingResourceId ? newResData : r);
              } else {
                  // Add new
                  updatedResources.push(newResData);
              }

              return { ...stage, resources: updatedResources };
          }
          return stage;
      });

      onUpdateCrop({ ...crop, timeline: updatedTimeline });
      handleCloseResourceForm();
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
            return { ...stage, tasks: updatedTasks };
        }
        return stage;
    });
    onUpdateCrop({ ...crop, timeline: updatedTimeline });
  };

  const handleCompleteStage = (stage: TimelineStage) => {
     if(stage.status === 'concluido') return;
     if(!confirm(`Deseja concluir a etapa "${stage.title}"? \n\nIsso irá lançar automaticamente uma DESPESA no valor de ${stage.resources.reduce((acc, r) => acc + r.totalCost, 0).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})} no financeiro.`)) return;

     const stageCost = stage.resources.reduce((acc, r) => acc + r.totalCost, 0);

     const newTx: FinancialTransaction = {
         id: Math.random().toString(36).substr(2, 9),
         description: `Ref. Etapa: ${stage.title}`,
         amount: stageCost,
         type: 'despesa',
         category: 'insumo',
         status: 'pendente',
         date: new Date().toISOString(),
         relatedStageId: stage.id
     };

     const updatedTimeline = crop.timeline.map(s => s.id === stage.id ? { ...s, status: 'concluido' as const } : s);
     
     onUpdateCrop({
         ...crop,
         timeline: updatedTimeline,
         transactions: [...(crop.transactions || []), newTx]
     });
  };

  // --- INVENTORY LOGIC ---
  const [isAddingStock, setIsAddingStock] = useState(false);
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [stockForm, setStockForm] = useState({ quantity: 0, location: '' });

  const handleSaveStock = () => {
    if(stockForm.quantity <= 0) return;
    
    let updatedInventory = [...(crop.inventory || [])];

    if (editingStockId) {
      updatedInventory = updatedInventory.map(item => 
        item.id === editingStockId 
          ? { ...item, quantity: Number(stockForm.quantity), location: stockForm.location }
          : item
      );
    } else {
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
    setStockForm({ quantity: 0, location: 'Silo da Fazenda' });
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

  const getApplicationMethod = (resources: StageResource[]) => {
      const hasMachine = resources.some(r => r.type === 'maquinario');
      const hasLabor = resources.some(r => r.type === 'mao_de_obra');
      
      if (hasMachine) return { text: 'Via Maquinário', icon: Tractor, color: 'text-orange-500 bg-orange-50 border-orange-200' };
      if (hasLabor) return { text: 'Via Manual', icon: User, color: 'text-blue-500 bg-blue-50 border-blue-200' };
      return { text: 'Não especificado', icon: AlertCircle, color: 'text-gray-400 bg-gray-50' };
  };

  const renderTimeline = () => (
    <div className="space-y-6 animate-slide-up">
      <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
        <div>
           <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
             <ListTodo className="text-agro-green"/> Cronograma Operacional
           </h3>
           <p className="text-sm text-gray-500">
              {isEditingTimeline 
                ? "Modo de Edição: Clique nos textos para alterar" 
                : "Acompanhamento passo-a-passo da safra."}
           </p>
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
          const appMethod = getApplicationMethod(stage.resources);
          
          let StageIcon = Leaf;
          if(stage.type === 'preparo') StageIcon = Tractor;
          if(stage.type === 'plantio') StageIcon = Sprout;
          if(stage.type === 'colheita') StageIcon = Package;
          if(stage.type === 'pos_colheita') StageIcon = Truck;

          return (
            <div key={stage.id} className="relative pl-10">
              <div className={`
                absolute -left-[21px] top-0 w-11 h-11 rounded-full flex items-center justify-center border-4 border-gray-50 dark:border-slate-900 z-10 shadow-md transition-colors
                ${stage.status === 'concluido' ? 'bg-agro-green text-white' : 'bg-white dark:bg-slate-800 text-gray-400 dark:text-gray-500'}
              `}>
                 {stage.status === 'concluido' ? <Check size={20}/> : <StageIcon size={20} />}
              </div>

              <div className={`
                bg-white dark:bg-slate-800 rounded-3xl shadow-sm border transition-all duration-300 overflow-hidden group
                ${isExpanded ? 'border-agro-green ring-1 ring-agro-green/20 shadow-xl' : 'border-gray-100 dark:border-slate-700 hover:shadow-md'}
              `}>
                 <div 
                   onClick={() => !isEditingTimeline && setExpandedStageId(isExpanded ? null : stage.id)}
                   className="p-6 cursor-pointer flex justify-between items-start hover:bg-gray-50 dark:hover:bg-slate-700/50"
                 >
                    <div className="flex-1 mr-4">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-xs font-extrabold uppercase tracking-widest text-gray-400 bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded-md">Fase {idx + 1}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${appMethod.color}`}>
                           <appMethod.icon size={10} /> {appMethod.text}
                        </span>
                        {stage.status === 'concluido' && (
                             <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200 flex items-center gap-1">
                                <CheckCircle2 size={10}/> Concluída
                             </span>
                        )}
                      </div>
                      
                      {isEditingTimeline ? (
                          <input 
                            className="w-full text-xl font-bold text-gray-900 dark:text-white bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg p-2 mb-2 focus:border-agro-green outline-none"
                            value={stage.title}
                            onChange={(e) => handleUpdateStage(stage.id, 'title', e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                          />
                      ) : (
                          <h4 className="font-bold text-gray-900 dark:text-white text-xl">{stage.title}</h4>
                      )}
                      
                      <div className="flex items-center gap-6 mt-2 text-sm">
                         <div className="flex items-center gap-1.5">
                             <Clock size={14} className="text-agro-green"/> 
                             {isEditingTimeline ? (
                                <input 
                                    className="text-xs p-1 rounded border dark:bg-slate-900 dark:border-slate-600"
                                    value={stage.dateEstimate}
                                    onChange={(e) => handleUpdateStage(stage.id, 'dateEstimate', e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                />
                             ) : (
                                <span className="text-gray-500">{stage.dateEstimate}</span>
                             )}
                         </div>
                         <span className="flex items-center gap-1.5 font-bold text-gray-700 dark:text-gray-300 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-lg border border-green-100 dark:border-green-900/30">
                           <DollarSign size={14} className="text-green-600"/> {stageCost.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
                         </span>
                      </div>
                    </div>
                    
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shrink-0 ${isExpanded ? 'bg-agro-green text-white rotate-180' : 'bg-gray-100 dark:bg-slate-700 text-gray-400'}`}>
                       <ChevronDown size={20}/>
                    </div>
                 </div>

                 {isExpanded && (
                   <div className="animate-fade-in">
                      <div className="px-8 py-8 border-t border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                          <div className="flex items-center gap-2 mb-4">
                             <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg"><ListTodo size={18}/></div>
                             <h5 className="font-bold text-gray-800 dark:text-white text-lg">Atividades</h5>
                          </div>
                          
                          {isEditingTimeline ? (
                              <textarea
                                className="w-full text-gray-600 dark:text-gray-300 mb-6 bg-gray-50 dark:bg-slate-700/30 p-4 rounded-xl border border-gray-100 dark:border-slate-700 focus:border-agro-green outline-none resize-none"
                                value={stage.description}
                                onChange={(e) => handleUpdateStage(stage.id, 'description', e.target.value)}
                                rows={3}
                              />
                          ) : (
                            <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed bg-gray-50 dark:bg-slate-700/30 p-4 rounded-xl border border-gray-100 dark:border-slate-700 italic">
                                "{stage.description}"
                            </p>
                          )}
                          
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

                          {!isEditingTimeline && stage.status !== 'concluido' && (
                              <div className="mt-8 flex justify-end">
                                  <button 
                                    onClick={() => handleCompleteStage(stage)}
                                    className="flex items-center gap-2 bg-agro-green text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-green-600/20 hover:bg-green-700 transition-all active:scale-95"
                                  >
                                      <CheckCircle2 size={18} />
                                      Concluir Fase & Lançar Custos
                                  </button>
                              </div>
                          )}
                      </div>

                      <div className="px-8 py-8 border-t-4 border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 relative">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                           <DollarSign size={100} />
                        </div>

                        <div className="flex justify-between items-center mb-6 relative z-10">
                           <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-green-100 text-green-600 rounded-lg"><Wallet size={18}/></div>
                              <h5 className="font-bold text-gray-800 dark:text-white text-lg">Recursos & Custos</h5>
                           </div>
                           
                           {isEditingTimeline && !resourceFormStageId && (
                             <button onClick={() => handleOpenResourceForm(stage.id)} className="text-sm flex items-center gap-2 text-white font-bold bg-agro-green px-4 py-2 rounded-xl shadow hover:bg-green-700 transition-colors">
                               <Plus size={16}/> Adicionar Item
                             </button>
                           )}
                        </div>

                        {resourceFormStageId === stage.id && (
                           <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl mb-6 border-2 border-agro-green animate-fade-in shadow-lg relative z-20">
                              <h6 className="font-bold mb-4 text-sm uppercase tracking-wide text-gray-500">{editingResourceId ? 'Editar Recurso' : 'Novo Recurso'}</h6>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-4">
                                <div className="lg:col-span-2">
                                    <label className="text-xs font-bold text-gray-500 mb-1 block">Tipo</label>
                                    <select 
                                        className="w-full p-3 rounded-xl border bg-gray-50 dark:bg-slate-900 dark:border-slate-700"
                                        value={resourceForm.type}
                                        onChange={e => setResourceForm({...resourceForm, type: e.target.value as any})}
                                    >
                                        <option value="insumo">Insumo (Sementes, Adubos...)</option>
                                        <option value="maquinario">Maquinário (Trator, Drone...)</option>
                                        <option value="mao_de_obra">Mão de Obra</option>
                                    </select>
                                </div>
                                <div className="lg:col-span-4">
                                    <label className="text-xs font-bold text-gray-500 mb-1 block">Nome do Item</label>
                                    <input placeholder="Ex: Adubo NPK 04-14-08" className="w-full p-3 rounded-xl border bg-gray-50 dark:bg-slate-900 dark:border-slate-700" value={resourceForm.name || ''} onChange={e=>setResourceForm({...resourceForm, name: e.target.value})}/>
                                </div>
                                <div className="lg:col-span-2">
                                    <label className="text-xs font-bold text-gray-500 mb-1 block">Quantidade</label>
                                    <input type="number" placeholder="0.00" className="w-full p-3 rounded-xl border bg-gray-50 dark:bg-slate-900 dark:border-slate-700" value={resourceForm.quantity || ''} onChange={e=>setResourceForm({...resourceForm, quantity: Number(e.target.value)})}/>
                                </div>
                                <div className="lg:col-span-2">
                                    <label className="text-xs font-bold text-gray-500 mb-1 block">Unidade</label>
                                    <input placeholder="kg, lt, sc, h" className="w-full p-3 rounded-xl border bg-gray-50 dark:bg-slate-900 dark:border-slate-700" value={resourceForm.unit || ''} onChange={e=>setResourceForm({...resourceForm, unit: e.target.value})}/>
                                </div>
                                <div className="lg:col-span-2">
                                    <label className="text-xs font-bold text-gray-500 mb-1 block">Custo Unit. (R$)</label>
                                    <input type="number" placeholder="0.00" className="w-full p-3 rounded-xl border bg-gray-50 dark:bg-slate-900 dark:border-slate-700" value={resourceForm.unitCost || ''} onChange={e=>setResourceForm({...resourceForm, unitCost: Number(e.target.value)})}/>
                                </div>
                                {resourceForm.type === 'maquinario' && (
                                    <div className="lg:col-span-3">
                                        <label className="text-xs font-bold text-gray-500 mb-1 block">Propriedade</label>
                                        <select 
                                            className="w-full p-3 rounded-xl border bg-gray-50 dark:bg-slate-900 dark:border-slate-700"
                                            value={resourceForm.ownership || 'alugado'}
                                            onChange={e => setResourceForm({...resourceForm, ownership: e.target.value as any})}
                                        >
                                            <option value="alugado">Alugado / Terceirizado</option>
                                            <option value="proprio">Próprio</option>
                                        </select>
                                    </div>
                                )}
                              </div>
                              <div className="flex gap-3">
                                  <button onClick={handleCloseResourceForm} className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors">Cancelar</button>
                                  <button onClick={() => handleSaveResource(stage.id)} className="flex-1 bg-agro-green text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-colors">{editingResourceId ? 'Atualizar' : 'Salvar'}</button>
                              </div>
                           </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm">
                                <h6 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-gray-100 dark:border-slate-700 pb-2">
                                  <Beaker size={14} className="text-green-500"/> Insumos
                                </h6>
                                <div className="space-y-4">
                                    {stage.resources?.filter(r => r.type === 'insumo').map(res => (
                                        <div key={res.id} className="text-sm group relative p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                            <div className="flex justify-between items-start">
                                                <span className="font-bold text-gray-700 dark:text-gray-200 w-2/3">{res.name}</span>
                                                <span className="font-bold text-gray-900 dark:text-white">{res.totalCost.toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}</span>
                                            </div>
                                            <div className="text-gray-500 text-xs mt-0.5">{res.quantity} {res.unit} x {res.unitCost.toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}</div>
                                            {isEditingTimeline && (
                                              <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white dark:bg-slate-800 shadow-sm p-1 rounded-lg">
                                                  <button onClick={() => handleOpenResourceForm(stage.id, res)} className="p-1.5 bg-blue-100 text-blue-500 rounded hover:bg-blue-200"><Edit2 size={14}/></button>
                                                  <button onClick={() => handleDeleteResource(stage.id, res.id)} className="p-1.5 bg-red-100 text-red-500 rounded hover:bg-red-200"><Trash2 size={14}/></button>
                                              </div>
                                            )}
                                        </div>
                                    ))}
                                    {!stage.resources?.some(r => r.type === 'insumo') && <p className="text-xs text-gray-400 italic text-center py-4">Nenhum insumo</p>}
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm">
                                <h6 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-gray-100 dark:border-slate-700 pb-2">
                                  <Tractor size={14} className="text-orange-500"/> Maquinário
                                </h6>
                                <div className="space-y-4">
                                    {stage.resources?.filter(r => r.type === 'maquinario').map(res => (
                                        <div key={res.id} className="text-sm group relative p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                            <div className="flex justify-between items-start">
                                                <span className="font-bold text-gray-700 dark:text-gray-200 w-2/3">{res.name}</span>
                                                <span className="font-bold text-gray-900 dark:text-white">{res.totalCost.toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}</span>
                                            </div>
                                            <div className="text-gray-500 text-xs mt-0.5 flex gap-2">
                                                <span>{res.quantity} {res.unit} x {res.unitCost.toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}</span>
                                                {res.ownership === 'proprio' && <span className="text-[10px] bg-blue-100 text-blue-600 px-1 rounded">Próprio</span>}
                                            </div>
                                            {isEditingTimeline && (
                                              <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white dark:bg-slate-800 shadow-sm p-1 rounded-lg">
                                                  <button onClick={() => handleOpenResourceForm(stage.id, res)} className="p-1.5 bg-blue-100 text-blue-500 rounded hover:bg-blue-200"><Edit2 size={14}/></button>
                                                  <button onClick={() => handleDeleteResource(stage.id, res.id)} className="p-1.5 bg-red-100 text-red-500 rounded hover:bg-red-200"><Trash2 size={14}/></button>
                                              </div>
                                            )}
                                        </div>
                                    ))}
                                    {!stage.resources?.some(r => r.type === 'maquinario') && <p className="text-xs text-gray-400 italic text-center py-4">Nenhum maquinário</p>}
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm">
                                <h6 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-gray-100 dark:border-slate-700 pb-2">
                                  <User size={14} className="text-blue-500"/> Mão de Obra
                                </h6>
                                <div className="space-y-4">
                                    {stage.resources?.filter(r => r.type === 'mao_de_obra').map(res => (
                                        <div key={res.id} className="text-sm group relative p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                            <div className="flex justify-between items-start">
                                                <span className="font-bold text-gray-700 dark:text-gray-200 w-2/3">{res.name}</span>
                                                <span className="font-bold text-gray-900 dark:text-white">{res.totalCost.toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}</span>
                                            </div>
                                            <div className="text-gray-500 text-xs mt-0.5">{res.quantity} {res.unit} x {res.unitCost.toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}</div>
                                            {isEditingTimeline && (
                                              <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white dark:bg-slate-800 shadow-sm p-1 rounded-lg">
                                                  <button onClick={() => handleOpenResourceForm(stage.id, res)} className="p-1.5 bg-blue-100 text-blue-500 rounded hover:bg-blue-200"><Edit2 size={14}/></button>
                                                  <button onClick={() => handleDeleteResource(stage.id, res.id)} className="p-1.5 bg-red-100 text-red-500 rounded hover:bg-red-200"><Trash2 size={14}/></button>
                                              </div>
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

  return (
    <div className="max-w-7xl mx-auto pb-20">
      {/* Header of Details */}
      <div className="flex items-center justify-between mb-8 animate-fade-in">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-agro-green transition-colors font-bold"
        >
          <ArrowLeft size={20} /> Voltar
        </button>
        <div className="flex gap-2">
            <button onClick={onDeleteCrop} className="p-3 bg-white dark:bg-slate-800 text-red-500 rounded-xl shadow border border-gray-200 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
               <Trash2 size={20} />
            </button>
        </div>
      </div>

      {/* Main Info Card */}
      <div className="bg-gradient-to-br from-agro-green to-emerald-700 rounded-3xl p-8 text-white shadow-xl shadow-green-900/20 relative overflow-hidden mb-8 animate-slide-up">
         <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
         <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-end gap-6">
            <div>
               <div className="flex items-center gap-2 mb-2">
                  <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                    {crop.type}
                  </span>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-sm flex items-center gap-1">
                    <MapPin size={12}/> {crop.areaHa} ha
                  </span>
               </div>
               <h1 className="text-4xl md:text-5xl font-extrabold mb-2 leading-tight">{crop.name}</h1>
               <p className="text-green-100 max-w-xl text-lg opacity-90">{crop.aiAdvice}</p>
            </div>
            
            <div className="flex gap-4">
               <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10 min-w-[140px]">
                  <p className="text-xs text-green-200 uppercase font-bold mb-1">Custo Total</p>
                  <p className="text-2xl font-bold">{totalOperationalCost.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL', maximumFractionDigits: 0})}</p>
               </div>
               <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10 min-w-[140px]">
                  <p className="text-xs text-green-200 uppercase font-bold mb-1">Colheita</p>
                  <p className="text-2xl font-bold">{new Date(crop.estimatedHarvestDate).toLocaleDateString('pt-BR', {month: 'short', year: 'numeric'})}</p>
               </div>
            </div>
         </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto pb-4 gap-2 mb-6 custom-scrollbar animate-fade-in">
         {[
           {id: 'timeline', label: 'Cronograma', icon: Calendar},
           {id: 'finance', label: 'Financeiro', icon: DollarSign},
           {id: 'inventory', label: 'Estoque', icon: Warehouse},
           {id: 'reports', label: 'Relatórios', icon: FileText},
           {id: 'assistant', label: 'Assistente IA', icon: MessageCircle},
         ].map(tab => (
           <button
             key={tab.id}
             onClick={() => setActiveTab(tab.id as any)}
             className={`
               flex items-center gap-2 px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all
               ${activeTab === tab.id 
                 ? 'bg-agro-dark text-white shadow-lg' 
                 : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'}
             `}
           >
             <tab.icon size={18} />
             {tab.label}
           </button>
         ))}
      </div>

      {/* Content */}
      <div className="min-h-[500px]">
         {activeTab === 'timeline' && renderTimeline()}

         {activeTab === 'finance' && (
           <div className="space-y-6 animate-slide-up">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm">
                      <h3 className="text-gray-500 font-bold text-sm uppercase mb-2">Total Pago (Caixa)</h3>
                      <p className="text-3xl font-extrabold text-gray-900 dark:text-white">
                        {totalPaid.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
                      </p>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm">
                      <h3 className="text-gray-500 font-bold text-sm uppercase mb-2">Previsto (Operacional)</h3>
                      <p className="text-3xl font-extrabold text-gray-900 dark:text-white">
                        {totalOperationalCost.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
                      </p>
                  </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                 <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">Lançamentos</h3>
                    <button onClick={() => setIsAddingTransaction(!isAddingTransaction)} className="flex items-center gap-2 text-sm font-bold text-agro-green bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                       <Plus size={16}/> Novo Lançamento
                    </button>
                 </div>
                 
                 {isAddingTransaction && (
                    <div className="p-6 bg-gray-50 dark:bg-slate-900 border-b border-gray-100 dark:border-slate-700 animate-fade-in">
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                          <div className="lg:col-span-2">
                             <label className="text-xs font-bold text-gray-500 mb-1 block">Descrição</label>
                             <input className="w-full p-3 rounded-xl border bg-white dark:bg-slate-800 dark:border-slate-600" placeholder="Ex: Adubo Extra" value={newTx.description} onChange={e => setNewTx({...newTx, description: e.target.value})} />
                          </div>
                          <div>
                             <label className="text-xs font-bold text-gray-500 mb-1 block">Valor (R$)</label>
                             <input type="number" className="w-full p-3 rounded-xl border bg-white dark:bg-slate-800 dark:border-slate-600" placeholder="0.00" value={newTx.amount || ''} onChange={e => setNewTx({...newTx, amount: Number(e.target.value)})} />
                          </div>
                          <div>
                             <label className="text-xs font-bold text-gray-500 mb-1 block">Tipo</label>
                             <select className="w-full p-3 rounded-xl border bg-white dark:bg-slate-800 dark:border-slate-600" value={newTx.type} onChange={e => setNewTx({...newTx, type: e.target.value as any})}>
                                <option value="despesa">Despesa</option>
                                <option value="receita">Receita</option>
                             </select>
                          </div>
                          <div>
                             <label className="text-xs font-bold text-gray-500 mb-1 block">Status</label>
                             <select className="w-full p-3 rounded-xl border bg-white dark:bg-slate-800 dark:border-slate-600" value={newTx.status} onChange={e => setNewTx({...newTx, status: e.target.value as any})}>
                                <option value="pago">Pago</option>
                                <option value="pendente">Pendente</option>
                             </select>
                          </div>
                       </div>
                       <button onClick={handleAddTransaction} className="w-full bg-agro-green text-white py-3 rounded-xl font-bold shadow hover:bg-green-700">Salvar Lançamento</button>
                    </div>
                 )}

                 <div className="divide-y divide-gray-100 dark:divide-slate-700">
                    {crop.transactions?.length === 0 ? (
                       <div className="p-8 text-center text-gray-400">Nenhuma transação registrada.</div>
                    ) : (
                       crop.transactions?.map(tx => (
                          <div key={tx.id} className="p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 flex items-center justify-between transition-colors">
                             <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${tx.type === 'receita' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                   {tx.type === 'receita' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                                </div>
                                <div>
                                   <p className="font-bold text-gray-800 dark:text-gray-200">{tx.description}</p>
                                   <p className="text-xs text-gray-400 capitalize">{tx.category} • {new Date(tx.date).toLocaleDateString()}</p>
                                </div>
                             </div>
                             <div className="text-right">
                                <p className={`font-bold ${tx.type === 'receita' ? 'text-green-600' : 'text-gray-900 dark:text-white'}`}>
                                   {tx.type === 'receita' ? '+' : '-'} {tx.amount.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
                                </p>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${tx.status === 'pago' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                   {tx.status}
                                </span>
                             </div>
                          </div>
                       ))
                    )}
                 </div>
              </div>
           </div>
         )}

         {activeTab === 'inventory' && (
           <div className="space-y-6 animate-slide-up">
              <div className="bg-indigo-600 text-white p-6 rounded-3xl shadow-xl shadow-indigo-600/20">
                 <div className="flex justify-between items-start">
                    <div>
                       <p className="text-indigo-200 font-bold text-sm uppercase mb-1">Valor Estimado em Estoque</p>
                       <h2 className="text-4xl font-extrabold">{totalInventoryValue.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</h2>
                       <p className="text-sm text-indigo-200 mt-2">Baseado na cotação atual de {marketPrice.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}/{marketUnit}</p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-xl">
                       <Warehouse size={32} className="text-white"/>
                    </div>
                 </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                 <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">Itens Armazenados</h3>
                    <button onClick={() => { setIsAddingStock(!isAddingStock); setEditingStockId(null); setStockForm({quantity: 0, location: ''}); }} className="flex items-center gap-2 text-sm font-bold text-agro-green bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                       <Plus size={16}/> Novo Item
                    </button>
                 </div>

                 {isAddingStock && (
                    <div className="p-6 bg-gray-50 dark:bg-slate-900 border-b border-gray-100 dark:border-slate-700 animate-fade-in">
                       <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-4">{editingStockId ? 'Editar Estoque' : 'Adicionar ao Estoque'}</h4>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                             <label className="text-xs font-bold text-gray-500 mb-1 block">Quantidade ({marketUnit})</label>
                             <input type="number" className="w-full p-3 rounded-xl border bg-white dark:bg-slate-800 dark:border-slate-600" placeholder="0.00" value={stockForm.quantity || ''} onChange={e => setStockForm({...stockForm, quantity: Number(e.target.value)})} />
                          </div>
                          <div>
                             <label className="text-xs font-bold text-gray-500 mb-1 block">Local de Armazenamento</label>
                             <input className="w-full p-3 rounded-xl border bg-white dark:bg-slate-800 dark:border-slate-600" placeholder="Ex: Silo 1" value={stockForm.location} onChange={e => setStockForm({...stockForm, location: e.target.value})} />
                          </div>
                       </div>
                       <div className="flex gap-3">
                          <button onClick={resetStockForm} className="flex-1 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-bold">Cancelar</button>
                          <button onClick={handleSaveStock} className="flex-1 bg-agro-green text-white py-3 rounded-xl font-bold shadow hover:bg-green-700">Salvar</button>
                       </div>
                    </div>
                 )}

                 <div className="divide-y divide-gray-100 dark:divide-slate-700">
                    {crop.inventory?.length === 0 ? (
                       <div className="p-8 text-center text-gray-400">Estoque vazio.</div>
                    ) : (
                       crop.inventory?.map(item => (
                          <div key={item.id} className="p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 flex items-center justify-between transition-colors group">
                             <div>
                                <p className="font-bold text-gray-800 dark:text-gray-200 text-lg">{item.quantity} <span className="text-sm font-normal text-gray-500">{item.unit}</span></p>
                                <p className="text-xs text-gray-400 flex items-center gap-1"><MapPin size={12}/> {item.location} • {new Date(item.dateStored).toLocaleDateString()}</p>
                             </div>
                             <div className="flex items-center gap-4">
                                <p className="font-bold text-gray-900 dark:text-white text-right">
                                   {(item.quantity * marketPrice).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
                                </p>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                   <button onClick={() => handleEditStock(item)} className="p-2 bg-blue-50 text-blue-500 rounded-lg hover:bg-blue-100"><Edit2 size={16}/></button>
                                   <button onClick={() => handleDeleteStock(item.id)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100"><Trash2 size={16}/></button>
                                </div>
                             </div>
                          </div>
                       ))
                    )}
                 </div>
              </div>
           </div>
         )}

         {activeTab === 'assistant' && (
           <div className="h-[600px] flex flex-col bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 animate-slide-up overflow-hidden">
              <div className="p-4 bg-agro-dark text-white flex items-center gap-3">
                 <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-agro-dark font-bold text-xl">
                    <MessageCircle size={20} />
                 </div>
                 <div>
                    <h3 className="font-bold">Tonico IA</h3>
                    <p className="text-xs opacity-70">Especialista em {crop.type}</p>
                 </div>
              </div>
              
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50 dark:bg-slate-900">
                 {chatHistory.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                       <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-agro-green text-white rounded-br-none' : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 rounded-bl-none border border-gray-200 dark:border-slate-700'}`}>
                          {msg.text}
                       </div>
                    </div>
                 ))}
                 {isChatLoading && (
                    <div className="flex justify-start">
                       <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-bl-none border border-gray-200 dark:border-slate-700 shadow-sm">
                          <div className="flex gap-1">
                             <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                             <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                             <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                          </div>
                       </div>
                    </div>
                 )}
              </div>

              <form onSubmit={handleChatSubmit} className="p-4 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 flex gap-2">
                 <input 
                   value={chatInput}
                   onChange={e => setChatInput(e.target.value)}
                   className="flex-1 bg-gray-100 dark:bg-slate-900 border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-agro-green outline-none dark:text-white"
                   placeholder="Pergunte sobre manejo, pragas, clima..."
                 />
                 <button type="submit" disabled={!chatInput.trim() || isChatLoading} className="bg-agro-green text-white p-3 rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors">
                    <Send size={20} />
                 </button>
              </form>
           </div>
         )}

         {activeTab === 'reports' && (
             <Reports crop={crop} />
         )}
      </div>
    </div>
  );
};
