
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
  Sprout, Wallet, MessageCircle, FileText
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
    { role: 'ai', text: `Olá. Sou o Tonico. Acompanho a espinha dorsal da sua lavoura de ${crop.name}. O que precisa?` }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Market Data State (For Inventory Simulation)
  const [marketPrice, setMarketPrice] = useState<number>(0);
  const [marketUnit, setMarketUnit] = useState<string>('sc 60kg');

  // Load Market Data on Mount to simulate stock values
  useEffect(() => {
    const loadMarket = async () => {
      const quotes = await getMarketQuotes();
      // Simple matching logic
      const quote = quotes.find(q => 
        (crop.type === 'cafe' && q.id === 'cafe') ||
        (crop.type === 'soja' && q.id === 'soja') ||
        (crop.type === 'milho' && q.id === 'milho')
      );
      
      if (quote) {
        setMarketPrice(quote.price);
        setMarketUnit(quote.unit);
      } else {
        // Fallback defaults
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

  // Resource CRUD
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
  const [newStock, setNewStock] = useState({ quantity: 0, location: 'Silo' });

  const handleAddStock = () => {
    if(newStock.quantity <= 0) return;
    
    const item: InventoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      cropType: crop.type,
      quantity: Number(newStock.quantity),
      unit: marketUnit,
      dateStored: new Date().toISOString(),
      location: newStock.location,
      estimatedUnitValue: marketPrice
    };

    const updatedInventory = [...(crop.inventory || []), item];
    onUpdateCrop({ ...crop, inventory: updatedInventory });
    setIsAddingStock(false);
    setNewStock({ quantity: 0, location: 'Silo' });
  };

  const handleHarvestAction = (stageId: string) => {
    // Shortcut to add stock directly from Timeline
    setExpandedStageId(null);
    setActiveTab('inventory');
    setIsAddingStock(true);
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

  // --- CALCULATIONS ---
  const totalOperationalCost = crop.timeline?.reduce((acc, stage) => 
    acc + (stage.resources?.reduce((sAcc, r) => sAcc + r.totalCost, 0) || 0), 0
  ) || 0;

  const totalPaid = crop.transactions?.filter(t => t.type === 'despesa' && t.status === 'pago').reduce((acc, t) => acc + t.amount, 0) || 0;
  const totalInventoryValue = (crop.inventory || []).reduce((acc, item) => acc + (item.quantity * marketPrice), 0);

  // --- ASSISTANT ---
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
      case 'cana': return 'from-green-600 to-emerald-700';
      case 'algodao': return 'from-slate-400 to-slate-600';
      case 'arroz': return 'from-yellow-400 to-yellow-600';
      case 'feijao': return 'from-red-800 to-red-950';
      case 'trigo': return 'from-amber-300 to-amber-500';
      case 'laranja': return 'from-orange-600 to-orange-800';
      case 'mandioca': return 'from-amber-800 to-amber-950';
      default: return 'from-agro-green to-emerald-600';
    }
  };

  // --- RENDERERS ---

  const renderTimeline = () => (
    <div className="space-y-6 animate-slide-up">
      <div className="flex justify-between items-center">
        <div>
           <h3 className="text-xl font-bold text-gray-900 dark:text-white">Espinha Dorsal</h3>
           <p className="text-sm text-gray-500">Cronograma operacional do solo ao estoque.</p>
        </div>
        <button 
          onClick={() => setIsEditingTimeline(!isEditingTimeline)}
          className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors ${isEditingTimeline ? 'bg-agro-green text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300'}`}
        >
          {isEditingTimeline ? <Check size={16} /> : <Edit2 size={16} />} 
          {isEditingTimeline ? 'Concluir' : 'Editar'}
        </button>
      </div>

      <div className="relative border-l-2 border-dashed border-gray-200 dark:border-slate-700 ml-4 space-y-8 pb-12">
        {crop.timeline?.map((stage, idx) => {
          const isExpanded = expandedStageId === stage.id;
          const stageCost = stage.resources?.reduce((a,b) => a + b.totalCost, 0) || 0;
          
          // Semantic Icon
          let StageIcon = Leaf;
          if(stage.type === 'preparo') StageIcon = Tractor;
          if(stage.type === 'plantio') StageIcon = Sprout;
          if(stage.type === 'colheita') StageIcon = Package;
          if(stage.type === 'pos_colheita') StageIcon = Truck;

          return (
            <div key={stage.id} className="relative pl-8">
              {/* Dot Icon */}
              <div className={`
                absolute -left-[19px] top-0 w-10 h-10 rounded-full flex items-center justify-center border-4 border-gray-50 dark:border-slate-900 z-10
                ${stage.status === 'concluido' ? 'bg-agro-green text-white' : 'bg-white dark:bg-slate-800 text-gray-400 dark:text-gray-500 shadow-sm'}
              `}>
                 <StageIcon size={18} />
              </div>

              <div className={`
                bg-white dark:bg-slate-800 rounded-2xl shadow-sm border transition-all overflow-hidden
                ${isExpanded ? 'border-agro-green ring-1 ring-agro-green/20' : 'border-gray-100 dark:border-slate-700'}
              `}>
                 <div 
                   onClick={() => setExpandedStageId(isExpanded ? null : stage.id)}
                   className="p-5 cursor-pointer flex justify-between items-center hover:bg-gray-50 dark:hover:bg-slate-700/50"
                 >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Etapa {idx + 1}</span>
                        {stage.status === 'concluido' && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Concluído</span>}
                      </div>
                      <h4 className="font-bold text-gray-900 dark:text-white text-lg">{stage.title}</h4>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                         <span className="flex items-center gap-1"><Calendar size={12}/> {stage.dateEstimate}</span>
                         <span className="flex items-center gap-1 font-medium text-gray-700 dark:text-gray-300"><DollarSign size={12}/> {stageCost.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})} (Est.)</span>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="text-gray-400"/> : <ChevronDown className="text-gray-400"/>}
                 </div>

                 {isExpanded && (
                   <div className="px-5 pb-5 border-t border-gray-100 dark:border-slate-700 animate-fade-in">
                      <p className="text-sm text-gray-600 dark:text-gray-300 py-4 leading-relaxed">{stage.description}</p>
                      
                      {/* Operational Checklist */}
                      <div className="mb-6">
                        <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Checklist Operacional</h5>
                        <div className="space-y-2">
                           {stage.tasks?.map(task => (
                             <div key={task.id} onClick={() => !isEditingTimeline && toggleTask(stage.id, task.id)} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-lg cursor-pointer transition-colors">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center ${task.done ? 'bg-agro-green border-agro-green' : 'border-gray-300'}`}>
                                   {task.done && <Check size={14} className="text-white"/>}
                                </div>
                                <span className={`text-sm ${task.done ? 'text-gray-400 line-through' : 'text-gray-700 dark:text-gray-200'}`}>{task.text}</span>
                             </div>
                           ))}
                        </div>
                      </div>

                      {/* Resources Management */}
                      <div>
                        <div className="flex justify-between items-center mb-3">
                           <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Recursos & Custos</h5>
                           {isEditingTimeline && (
                             <button onClick={() => setNewResourceStageId(stage.id)} className="text-xs flex items-center gap-1 text-agro-green font-bold bg-green-50 px-2 py-1 rounded-lg">
                               <Plus size={14}/> Add Recurso
                             </button>
                           )}
                        </div>

                        {/* Add Resource Form */}
                        {newResourceStageId === stage.id && (
                           <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-xl mb-4 border border-agro-green/30 animate-fade-in">
                              <div className="grid grid-cols-2 gap-2 mb-2">
                                <select 
                                    className="p-2 rounded-lg border text-sm"
                                    value={newResource.type}
                                    onChange={e => setNewResource({...newResource, type: e.target.value as any})}
                                >
                                    <option value="insumo">Insumo</option>
                                    <option value="maquinario">Maquinário</option>
                                    <option value="mao_de_obra">Mão de Obra</option>
                                </select>
                                <input placeholder="Nome" className="p-2 rounded-lg border text-sm" value={newResource.name} onChange={e=>setNewResource({...newResource, name: e.target.value})}/>
                                {newResource.type === 'maquinario' && (
                                   <select 
                                      className="p-2 rounded-lg border text-sm col-span-2"
                                      value={newResource.ownership}
                                      onChange={e=>setNewResource({...newResource, ownership: e.target.value as any})}
                                   >
                                      <option value="alugado">Alugado (R$/h)</option>
                                      <option value="proprio">Próprio (Manutenção/Combustível)</option>
                                   </select>
                                )}
                                <input type="number" placeholder="Qtd" className="p-2 rounded-lg border text-sm" value={newResource.quantity || ''} onChange={e=>setNewResource({...newResource, quantity: Number(e.target.value)})}/>
                                <input type="number" placeholder="R$ Unit" className="p-2 rounded-lg border text-sm" value={newResource.unitCost || ''} onChange={e=>setNewResource({...newResource, unitCost: Number(e.target.value)})}/>
                              </div>
                              <button onClick={() => handleAddResource(stage.id)} className="w-full bg-agro-green text-white py-2 rounded-lg text-sm font-bold">Salvar</button>
                           </div>
                        )}

                        {/* Resources List */}
                        <div className="space-y-2">
                           {stage.resources?.map(res => (
                             <div key={res.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-gray-100 dark:border-slate-700/50">
                                <div className="flex items-center gap-3">
                                   <div className={`p-2 rounded-lg ${res.type === 'maquinario' ? 'bg-orange-100 text-orange-600' : res.type === 'mao_de_obra' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                                      {res.type === 'maquinario' ? <Tractor size={16}/> : res.type === 'mao_de_obra' ? <User size={16}/> : <Beaker size={16}/>}
                                   </div>
                                   <div>
                                      <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                                        {res.name}
                                        {res.ownership && <span className="ml-2 text-[10px] uppercase bg-gray-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-gray-600">{res.ownership}</span>}
                                      </p>
                                      <p className="text-xs text-gray-500">{res.quantity} {res.unit} x R$ {res.unitCost}</p>
                                   </div>
                                </div>
                                <div className="flex items-center gap-3">
                                   <span className="font-bold text-sm text-gray-900 dark:text-white">
                                     {res.totalCost.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
                                   </span>
                                   {isEditingTimeline && (
                                     <button onClick={() => handleDeleteResource(stage.id, res.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
                                   )}
                                </div>
                             </div>
                           ))}
                           {(!stage.resources || stage.resources.length === 0) && (
                             <p className="text-xs text-gray-400 italic text-center py-2">Nenhum recurso registrado nesta etapa.</p>
                           )}
                        </div>
                      </div>
                      
                      {/* Harvest Button Action (Only for harvest stages) */}
                      {(stage.type === 'colheita' || stage.type === 'pos_colheita') && (
                        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-700 flex justify-end">
                           <button 
                             onClick={() => handleHarvestAction(stage.id)}
                             className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-xl font-bold hover:bg-yellow-600 shadow-lg shadow-yellow-500/20 transition-all active:scale-95"
                           >
                             <Warehouse size={18} /> Registrar no Estoque
                           </button>
                        </div>
                      )}
                   </div>
                 )}
              </div>
            </div>
          );
        })}
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
         <div className="bg-yellow-50 dark:bg-yellow-900/10 p-6 rounded-3xl border border-yellow-200 dark:border-yellow-700/30 animate-fade-in">
            <h4 className="font-bold text-yellow-800 dark:text-yellow-200 mb-4">Nova Entrada de Colheita</h4>
            <div className="flex gap-4 mb-4">
               <div className="flex-1">
                 <label className="text-xs font-bold text-yellow-700 dark:text-yellow-300 ml-1">Quantidade ({marketUnit})</label>
                 <input 
                   type="number" 
                   autoFocus
                   className="w-full p-3 rounded-xl border border-yellow-300 focus:ring-2 focus:ring-yellow-500 outline-none" 
                   value={newStock.quantity || ''}
                   onChange={e => setNewStock({...newStock, quantity: Number(e.target.value)})}
                 />
               </div>
               <div className="flex-1">
                 <label className="text-xs font-bold text-yellow-700 dark:text-yellow-300 ml-1">Local de Armazenamento</label>
                 <select 
                    className="w-full p-3 rounded-xl border border-yellow-300 focus:ring-2 focus:ring-yellow-500 outline-none bg-white"
                    value={newStock.location}
                    onChange={e => setNewStock({...newStock, location: e.target.value})}
                 >
                    <option>Silo 1</option>
                    <option>Tulha</option>
                    <option>Cooperativa</option>
                    <option>Armazém Geral</option>
                 </select>
               </div>
            </div>
            <div className="flex justify-end gap-2">
               <button onClick={() => setIsAddingStock(false)} className="px-4 py-2 text-yellow-700 font-bold hover:bg-yellow-100 rounded-lg">Cancelar</button>
               <button onClick={handleAddStock} className="px-6 py-2 bg-yellow-500 text-white font-bold rounded-lg hover:bg-yellow-600 shadow-md">Confirmar Entrada</button>
            </div>
         </div>
       ) : (
         <button onClick={() => setIsAddingStock(true)} className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-2xl text-gray-500 font-bold hover:border-yellow-500 hover:text-yellow-500 transition-colors flex items-center justify-center gap-2">
            <Plus size={20}/> Registrar Entrada Manual
         </button>
       )}

       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {crop.inventory?.map((item, i) => (
             <div key={i} className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 relative overflow-hidden group hover:shadow-md transition-all">
                <div className="absolute top-0 right-0 p-4 opacity-5 text-yellow-500 transform group-hover:scale-110 transition-transform">
                   <Package size={80} />
                </div>
                <div className="relative z-10">
                   <div className="flex justify-between items-start mb-2">
                      <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-xs font-bold px-2 py-1 rounded-lg">
                        {item.location}
                      </span>
                      <span className="text-xs text-gray-400">{new Date(item.dateStored).toLocaleDateString()}</span>
                   </div>
                   <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1">
                      {item.quantity} <span className="text-base font-medium text-gray-500">{item.unit}</span>
                   </h3>
                   <div className="mt-4 pt-4 border-t border-gray-50 dark:border-slate-700 flex items-center gap-2 text-sm">
                      <TrendingUp size={16} className="text-green-500"/>
                      <span className="text-gray-600 dark:text-gray-300">
                        Valendo: <strong>{(item.quantity * marketPrice).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</strong>
                      </span>
                   </div>
                </div>
             </div>
          ))}
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
                    {id: 'timeline', label: 'Espinha Dorsal', icon: ListTodo},
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
