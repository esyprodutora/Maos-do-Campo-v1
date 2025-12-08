
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
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface CropDetailsProps {
  crop: CropData;
  onBack: () => void;
  onUpdateCrop: (updatedCrop: CropData) => void;
  onDeleteCrop: () => void;
}

export const CropDetails = ({ crop, onBack, onUpdateCrop, onDeleteCrop }: CropDetailsProps) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'finance' | 'inventory' | 'assistant' | 'reports'>('timeline');
  
  // --- Estados do Assistente e Mercado ---
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'ai', text: string}[]>([
    { role: 'ai', text: `Olá! Sou o Tonico. Estou cuidando da lavoura de ${crop.name}. Como posso ajudar hoje?` }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [marketPrice, setMarketPrice] = useState<number>(0);
  const [marketUnit, setMarketUnit] = useState<string>('sc 60kg');

  useEffect(() => {
    const loadMarket = async () => {
      const quotes = await getMarketQuotes();
      const quote = quotes.find(q => crop.type.includes(q.id) || q.id.includes(crop.type));
      if (quote) {
        setMarketPrice(quote.price);
        setMarketUnit(quote.unit);
      } else {
        setMarketPrice(100); 
      }
    };
    loadMarket();
  }, [crop.type]);

  // --- LÓGICA DO CRONOGRAMA (Simplificada) ---
  const [expandedStageId, setExpandedStageId] = useState<string | null>(crop.timeline?.[0]?.id || null);
  
  // Controle do Modal de Edição (Pop-up)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStageId, setModalStageId] = useState<string | null>(null);
  const [editingResourceId, setEditingResourceId] = useState<string | null>(null);
  const [resourceForm, setResourceForm] = useState<Partial<StageResource>>({
      name: '', type: 'insumo', quantity: 0, unit: 'un', unitCost: 0, ownership: 'alugado'
  });

  // Funções Auxiliares de Atualização
  const handleUpdateStage = (stageId: string, field: keyof TimelineStage, value: any) => {
    const updatedTimeline = crop.timeline.map(stage => 
       stage.id === stageId ? { ...stage, [field]: value } : stage
    );
    onUpdateCrop({ ...crop, timeline: updatedTimeline });
  };

  const openResourceModal = (stageId: string, type: ResourceType, resource?: StageResource) => {
      setModalStageId(stageId);
      setIsModalOpen(true);
      if (resource) {
          setEditingResourceId(resource.id);
          setResourceForm({ ...resource });
      } else {
          setEditingResourceId(null);
          setResourceForm({ 
              name: '', 
              type: type, 
              quantity: undefined, 
              unit: type === 'mao_de_obra' ? 'dia' : (type === 'maquinario' ? 'horas' : 'kg'), 
              unitCost: undefined, 
              ownership: 'alugado' 
          });
      }
  };

  const handleSaveResource = () => {
      if (!modalStageId) return;
      if (!resourceForm.name) return alert("Por favor, digite o nome do item.");
      
      const updatedTimeline = crop.timeline.map(stage => {
          if (stage.id === modalStageId) {
              let updatedResources = [...(stage.resources || [])];
              
              const qty = Number(resourceForm.quantity) || 0;
              const cost = Number(resourceForm.unitCost) || 0;
              const totalCost = qty * cost;

              const newResData: StageResource = {
                  id: editingResourceId || Math.random().toString(36).substr(2, 9),
                  name: resourceForm.name!,
                  type: resourceForm.type as ResourceType,
                  quantity: qty,
                  unit: resourceForm.unit || 'un',
                  unitCost: cost,
                  totalCost: totalCost,
                  ownership: resourceForm.type === 'maquinario' ? resourceForm.ownership : undefined
              };

              if (editingResourceId) {
                  updatedResources = updatedResources.map(r => r.id === editingResourceId ? newResData : r);
              } else {
                  updatedResources.push(newResData);
              }
              return { ...stage, resources: updatedResources };
          }
          return stage;
      });

      onUpdateCrop({ ...crop, timeline: updatedTimeline });
      setIsModalOpen(false);
  };

  const handleDeleteResource = (stageId: string, resourceId: string) => {
      if(!confirm("Tem certeza que deseja apagar este item?")) return;
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
     const stageCost = stage.resources.reduce((acc, r) => acc + r.totalCost, 0);
     
     if(!confirm(`Finalizar a etapa "${stage.title}"?\n\nIsso vai gerar uma DESPESA automática de ${stageCost.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})} no seu financeiro.`)) return;

     const newTx: FinancialTransaction = {
         id: Math.random().toString(36).substr(2, 9),
         description: `Etapa Concluída: ${stage.title}`,
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

  // --- LÓGICA DE ESTOQUE ---
  const [isAddingStock, setIsAddingStock] = useState(false);
  const [isSellingStock, setIsSellingStock] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState<InventoryItem | null>(null);
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [stockForm, setStockForm] = useState({ quantity: 0, location: '', price: 0 });

  const handleSaveStock = () => {
    if(stockForm.quantity <= 0) return alert("Quantidade inválida");
    let updatedInventory = [...(crop.inventory || [])];

    if (editingStockId && !isSellingStock) {
      updatedInventory = updatedInventory.map(item => 
        item.id === editingStockId 
          ? { ...item, quantity: Number(stockForm.quantity), location: stockForm.location }
          : item
      );
    } else {
      updatedInventory.push({
        id: Math.random().toString(36).substr(2, 9),
        cropType: crop.type,
        quantity: Number(stockForm.quantity),
        unit: marketUnit,
        dateStored: new Date().toISOString(),
        location: stockForm.location || 'Armazém Geral',
        estimatedUnitValue: marketPrice
      });
    }
    onUpdateCrop({ ...crop, inventory: updatedInventory });
    resetStockForm();
  };

  const handleSellStock = () => {
      if(!selectedStockItem) return;
      const qty = Number(stockForm.quantity);
      const price = Number(stockForm.price);
      if(qty > selectedStockItem.quantity) return alert("Você não tem essa quantidade toda para vender.");

      const updatedInventory = crop.inventory.map(item => {
          if(item.id === selectedStockItem.id) return { ...item, quantity: item.quantity - qty };
          return item;
      }).filter(item => item.quantity > 0);

      const newTx: FinancialTransaction = {
          id: Math.random().toString(36).substr(2, 9),
          description: `Venda ${crop.name} - ${qty} ${selectedStockItem.unit}`,
          amount: qty * price,
          type: 'receita',
          category: 'venda',
          status: 'pago',
          date: new Date().toISOString()
      };

      onUpdateCrop({ ...crop, inventory: updatedInventory, transactions: [...(crop.transactions || []), newTx] });
      resetStockForm();
  };

  const resetStockForm = () => {
    setIsAddingStock(false); setIsSellingStock(false); setSelectedStockItem(null); setEditingStockId(null);
    setStockForm({ quantity: 0, location: '', price: 0 });
  };

  // --- LÓGICA FINANCEIRA ---
  const totalOperationalCost = crop.timeline?.reduce((acc, stage) => acc + (stage.resources?.reduce((sAcc, r) => sAcc + r.totalCost, 0) || 0), 0) || 0;
  const totalPaid = crop.transactions?.filter(t => t.type === 'despesa' && t.status === 'pago').reduce((acc, t) => acc + t.amount, 0) || 0;
  const totalRevenue = crop.transactions?.filter(t => t.type === 'receita').reduce((acc, t) => acc + t.amount, 0) || 0;
  const totalInventoryValue = (crop.inventory || []).reduce((acc, item) => acc + (item.quantity * marketPrice), 0);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsChatLoading(true);
    const context = `Lavoura: ${crop.name} (${crop.type}). Etapa atual: ${crop.timeline?.find(s=>s.status === 'em_andamento')?.title || 'Início'}.`;
    const response = await getAssistantResponse(userMsg, context);
    setChatHistory(prev => [...prev, { role: 'ai', text: response }]);
    setIsChatLoading(false);
  };

  // --- COMPONENTES VISUAIS AUXILIARES ---

  const ResourceCard = ({ resource, onDelete, onEdit }: { resource: StageResource, onDelete: () => void, onEdit: () => void }) => {
      const isMachine = resource.type === 'maquinario';
      const isLabor = resource.type === 'mao_de_obra';
      const isInput = resource.type === 'insumo';

      let bgColor = "bg-white";
      let borderColor = "border-gray-200";
      let iconColor = "text-gray-500";
      let iconBg = "bg-gray-100";
      let Icon = Package;

      if(isInput) {
          borderColor = "border-green-200";
          iconColor = "text-green-600";
          iconBg = "bg-green-100";
          Icon = Beaker;
      } else if (isMachine) {
          borderColor = "border-orange-200";
          iconColor = "text-orange-600";
          iconBg = "bg-orange-100";
          Icon = Tractor;
      } else if (isLabor) {
          borderColor = "border-blue-200";
          iconColor = "text-blue-600";
          iconBg = "bg-blue-100";
          Icon = User;
      }

      return (
          <div className={`relative flex items-center p-4 rounded-2xl border-2 ${borderColor} ${bgColor} shadow-sm mb-3`}>
              <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center mr-4 shrink-0`}>
                  <Icon size={24} className={iconColor} />
              </div>
              <div className="flex-1">
                  <h4 className="font-bold text-gray-800 dark:text-white text-base">{resource.name}</h4>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                      <span className="font-medium bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded text-gray-700 dark:text-gray-300">
                          {resource.quantity} {resource.unit}
                      </span>
                      <span>x</span>
                      <span>{resource.unitCost.toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}</span>
                  </div>
              </div>
              <div className="text-right">
                  <p className="font-extrabold text-gray-900 dark:text-white text-lg">
                      {resource.totalCost.toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}
                  </p>
                  <div className="flex justify-end gap-2 mt-2">
                      <button onClick={onEdit} className="p-2 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 text-blue-600">
                          <Edit2 size={16} />
                      </button>
                      <button onClick={onDelete} className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 text-red-500">
                          <Trash2 size={16} />
                      </button>
                  </div>
              </div>
          </div>
      );
  };

  const renderTimeline = () => (
    <div className="space-y-8 animate-slide-up pb-24">
      {/* Modal de Formulário (Overlay) */}
      {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl animate-slide-up">
                  <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-slate-700 pb-4">
                      <h3 className="text-xl font-extrabold text-gray-800 dark:text-white flex items-center gap-2">
                          {editingResourceId ? <Edit2 className="text-agro-green"/> : <Plus className="text-agro-green"/>}
                          {editingResourceId ? 'Editar Item' : 'Adicionar Novo Item'}
                      </h3>
                      <button onClick={() => setIsModalOpen(false)} className="p-2 bg-gray-100 dark:bg-slate-700 rounded-full text-gray-500">
                          <X size={24} />
                      </button>
                  </div>

                  <div className="space-y-5">
                      <div>
                          <label className="block text-sm font-bold text-gray-500 mb-1">Nome do Item</label>
                          <input 
                              autoFocus
                              className="w-full p-4 text-lg bg-gray-50 dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-700 rounded-2xl focus:border-agro-green outline-none font-bold text-gray-800 dark:text-white placeholder:font-normal"
                              placeholder="Ex: Adubo NPK"
                              value={resourceForm.name}
                              onChange={e => setResourceForm({...resourceForm, name: e.target.value})}
                          />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-bold text-gray-500 mb-1">Quantidade</label>
                              <input 
                                  type="number"
                                  className="w-full p-4 text-lg bg-gray-50 dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-700 rounded-2xl focus:border-agro-green outline-none font-bold text-gray-800 dark:text-white"
                                  placeholder="0"
                                  value={resourceForm.quantity || ''}
                                  onChange={e => setResourceForm({...resourceForm, quantity: Number(e.target.value)})}
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-bold text-gray-500 mb-1">Unidade</label>
                              <input 
                                  className="w-full p-4 text-lg bg-gray-50 dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-700 rounded-2xl focus:border-agro-green outline-none font-bold text-gray-800 dark:text-white"
                                  placeholder="kg, lt, un"
                                  value={resourceForm.unit || ''}
                                  onChange={e => setResourceForm({...resourceForm, unit: e.target.value})}
                              />
                          </div>
                      </div>

                      <div>
                          <label className="block text-sm font-bold text-gray-500 mb-1">Custo Unitário (R$)</label>
                          <input 
                              type="number"
                              className="w-full p-4 text-lg bg-gray-50 dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-700 rounded-2xl focus:border-agro-green outline-none font-bold text-gray-800 dark:text-white"
                              placeholder="0.00"
                              value={resourceForm.unitCost || ''}
                              onChange={e => setResourceForm({...resourceForm, unitCost: Number(e.target.value)})}
                          />
                      </div>

                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-2xl flex justify-between items-center">
                          <span className="font-bold text-green-800 dark:text-green-300">Custo Total Previsto:</span>
                          <span className="text-2xl font-black text-green-600 dark:text-green-400">
                              {((Number(resourceForm.quantity) || 0) * (Number(resourceForm.unitCost) || 0)).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
                          </span>
                      </div>

                      <button 
                          onClick={handleSaveResource}
                          className="w-full py-4 bg-agro-green text-white font-bold text-lg rounded-2xl shadow-lg shadow-green-600/30 active:scale-95 transition-transform"
                      >
                          Salvar Item
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Lista de Etapas */}
      <div className="relative border-l-4 border-gray-200 dark:border-slate-700 ml-4 md:ml-8 space-y-12">
        {crop.timeline?.map((stage, idx) => {
          const isExpanded = expandedStageId === stage.id;
          const stageCost = stage.resources?.reduce((a,b) => a + b.totalCost, 0) || 0;
          
          return (
            <div key={stage.id} className="relative pl-8 md:pl-12">
              {/* Círculo da Linha do Tempo */}
              <div className={`
                absolute -left-[18px] md:-left-[22px] top-0 w-9 h-9 md:w-11 md:h-11 rounded-full flex items-center justify-center border-4 border-gray-50 dark:border-slate-900 z-10 shadow-md transition-colors cursor-pointer
                ${stage.status === 'concluido' ? 'bg-agro-green text-white' : 'bg-white dark:bg-slate-800 text-gray-400'}
              `} onClick={() => setExpandedStageId(isExpanded ? null : stage.id)}>
                 {stage.status === 'concluido' ? <Check size={20}/> : <span className="font-bold text-sm">{idx + 1}</span>}
              </div>

              {/* Cartão da Etapa */}
              <div className={`
                bg-white dark:bg-slate-800 rounded-3xl border transition-all duration-300 overflow-hidden
                ${isExpanded ? 'border-agro-green ring-1 ring-green-500/30 shadow-xl' : 'border-gray-200 dark:border-slate-700 shadow-sm'}
              `}>
                 {/* Cabeçalho do Cartão */}
                 <div 
                   onClick={() => setExpandedStageId(isExpanded ? null : stage.id)}
                   className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                 >
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-black uppercase tracking-widest text-gray-400">Fase {idx + 1}</span>
                        <div className="flex items-center gap-2">
                            {stageCost > 0 && (
                                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                    <DollarSign size={12}/> {stageCost.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
                                </span>
                            )}
                            <ChevronDown size={20} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}/>
                        </div>
                    </div>
                    <h3 className="text-xl md:text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">{stage.title}</h3>
                    <div className="flex items-center gap-2 mt-2 text-gray-500 text-sm font-medium">
                        <Calendar size={16} />
                        <span>Previsão: {stage.dateEstimate}</span>
                    </div>
                 </div>

                 {/* Conteúdo Expandido */}
                 {isExpanded && (
                   <div className="border-t border-gray-100 dark:border-slate-700 animate-fade-in">
                      
                      {/* Seção 1: O que fazer? (Tarefas) */}
                      <div className="p-6 bg-blue-50/50 dark:bg-slate-900/30">
                          <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wide mb-4 flex items-center gap-2">
                              <ListTodo size={18}/> Lista de Tarefas
                          </h4>
                          <div className="space-y-3">
                             {stage.tasks?.map(task => (
                               <div 
                                 key={task.id} 
                                 onClick={() => toggleTask(stage.id, task.id)} 
                                 className={`
                                    flex items-center gap-4 p-4 rounded-2xl cursor-pointer border-2 transition-all
                                    ${task.done 
                                        ? 'bg-blue-100 border-blue-200' 
                                        : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:border-blue-300'}
                                 `}
                               >
                                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${task.done ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-300'}`}>
                                     {task.done && <Check size={14}/>}
                                  </div>
                                  <span className={`font-medium ${task.done ? 'text-blue-800 line-through' : 'text-gray-700 dark:text-gray-200'}`}>{task.text}</span>
                               </div>
                             ))}
                          </div>
                      </div>

                      {/* Seção 2: O que vou gastar? (Recursos) */}
                      <div className="p-6">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide mb-6 flex items-center gap-2">
                              <Wallet size={18}/> Planejamento de Recursos
                        </h4>

                        {/* Botões Grandes de Adição */}
                        <div className="grid grid-cols-3 gap-3 mb-8">
                            <button 
                                onClick={() => openResourceModal(stage.id, 'insumo')}
                                className="flex flex-col items-center justify-center p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl border-2 border-transparent hover:border-green-500 transition-all active:scale-95 group"
                            >
                                <div className="bg-white dark:bg-slate-800 p-2 rounded-full mb-2 shadow-sm group-hover:scale-110 transition-transform">
                                    <Beaker size={20} className="text-green-600"/>
                                </div>
                                <span className="text-xs font-bold text-green-700 dark:text-green-300 text-center leading-tight">Adicionar<br/>Produto</span>
                            </button>

                            <button 
                                onClick={() => openResourceModal(stage.id, 'maquinario')}
                                className="flex flex-col items-center justify-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-2xl border-2 border-transparent hover:border-orange-500 transition-all active:scale-95 group"
                            >
                                <div className="bg-white dark:bg-slate-800 p-2 rounded-full mb-2 shadow-sm group-hover:scale-110 transition-transform">
                                    <Tractor size={20} className="text-orange-600"/>
                                </div>
                                <span className="text-xs font-bold text-orange-700 dark:text-orange-300 text-center leading-tight">Adicionar<br/>Máquina</span>
                            </button>

                            <button 
                                onClick={() => openResourceModal(stage.id, 'mao_de_obra')}
                                className="flex flex-col items-center justify-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border-2 border-transparent hover:border-blue-500 transition-all active:scale-95 group"
                            >
                                <div className="bg-white dark:bg-slate-800 p-2 rounded-full mb-2 shadow-sm group-hover:scale-110 transition-transform">
                                    <User size={20} className="text-blue-600"/>
                                </div>
                                <span className="text-xs font-bold text-blue-700 dark:text-blue-300 text-center leading-tight">Adicionar<br/>Pessoa</span>
                            </button>
                        </div>

                        {/* Listagem de Itens (Cards Grandes) */}
                        <div>
                            {stage.resources?.length === 0 && (
                                <div className="text-center py-8 text-gray-400 bg-gray-50 dark:bg-slate-900 rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-700">
                                    <p>Nenhum item adicionado nesta etapa ainda.</p>
                                </div>
                            )}
                            
                            {/* Filtra e agrupa visualmente */}
                            {stage.resources?.filter(r => r.type === 'insumo').length > 0 && (
                                <div className="mb-6">
                                    <h5 className="text-xs font-bold text-green-600 mb-2 pl-1">PRODUTOS & INSUMOS</h5>
                                    {stage.resources.filter(r => r.type === 'insumo').map(res => (
                                        <ResourceCard key={res.id} resource={res} onDelete={() => handleDeleteResource(stage.id, res.id)} onEdit={() => openResourceModal(stage.id, res.type, res)} />
                                    ))}
                                </div>
                            )}

                            {stage.resources?.filter(r => r.type === 'maquinario').length > 0 && (
                                <div className="mb-6">
                                    <h5 className="text-xs font-bold text-orange-600 mb-2 pl-1">MAQUINÁRIO</h5>
                                    {stage.resources.filter(r => r.type === 'maquinario').map(res => (
                                        <ResourceCard key={res.id} resource={res} onDelete={() => handleDeleteResource(stage.id, res.id)} onEdit={() => openResourceModal(stage.id, res.type, res)} />
                                    ))}
                                </div>
                            )}

                            {stage.resources?.filter(r => r.type === 'mao_de_obra').length > 0 && (
                                <div className="mb-6">
                                    <h5 className="text-xs font-bold text-blue-600 mb-2 pl-1">MÃO DE OBRA</h5>
                                    {stage.resources.filter(r => r.type === 'mao_de_obra').map(res => (
                                        <ResourceCard key={res.id} resource={res} onDelete={() => handleDeleteResource(stage.id, res.id)} onEdit={() => openResourceModal(stage.id, res.type, res)} />
                                    ))}
                                </div>
                            )}
                        </div>
                      </div>

                      {/* Botão de Conclusão */}
                      {stage.status !== 'concluido' && (
                          <div className="p-6 bg-gray-50 dark:bg-slate-900/50 border-t border-gray-100 dark:border-slate-700 flex justify-end">
                              <button 
                                onClick={() => handleCompleteStage(stage)}
                                className="flex items-center gap-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-4 rounded-2xl font-bold shadow-xl active:scale-95 transition-transform"
                              >
                                  <CheckCircle2 size={24} className="text-green-400 dark:text-green-600" />
                                  <div className="text-left leading-tight">
                                      <span className="block text-sm opacity-80 font-normal">Tudo pronto?</span>
                                      <span>Concluir Etapa</span>
                                  </div>
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

  return (
    <div className="max-w-5xl mx-auto pb-20">
      {/* Topo Simples */}
      <div className="flex items-center gap-4 mb-6 pt-2">
        <button 
          onClick={onBack}
          className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm border border-gray-200 dark:border-slate-700 text-gray-600 hover:scale-105 transition-transform"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white leading-none">{crop.name}</h1>
            <span className="text-sm font-bold text-agro-green uppercase tracking-wide">{crop.type} • {crop.areaHa} ha</span>
        </div>
        <div className="ml-auto">
            <button onClick={onDeleteCrop} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"><Trash2 size={20}/></button>
        </div>
      </div>

      {/* Menu de Abas Grande e Tátil */}
      <div className="flex overflow-x-auto pb-4 gap-3 mb-4 custom-scrollbar">
         {[
           {id: 'timeline', label: 'Cronograma', icon: Calendar},
           {id: 'finance', label: 'Financeiro', icon: DollarSign},
           {id: 'inventory', label: 'Estoque', icon: Warehouse},
           {id: 'reports', label: 'Relatórios', icon: FileText},
           {id: 'assistant', label: 'Ajuda IA', icon: MessageCircle},
         ].map(tab => (
           <button
             key={tab.id}
             onClick={() => setActiveTab(tab.id as any)}
             className={`
               flex flex-col items-center justify-center min-w-[100px] p-4 rounded-2xl font-bold transition-all border-2
               ${activeTab === tab.id 
                 ? 'bg-agro-green text-white border-agro-green shadow-lg shadow-green-500/30' 
                 : 'bg-white dark:bg-slate-800 text-gray-400 border-transparent hover:bg-gray-50'}
             `}
           >
             <tab.icon size={24} className="mb-1" />
             <span className="text-xs">{tab.label}</span>
           </button>
         ))}
      </div>

      {/* Conteúdo Principal */}
      <div className="min-h-[500px]">
         {activeTab === 'timeline' && renderTimeline()}

         {activeTab === 'finance' && (
           <div className="space-y-6 animate-slide-up">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-600 text-white p-6 rounded-3xl shadow-lg shadow-green-600/20">
                      <p className="text-green-100 font-bold text-sm uppercase mb-1">Total em Caixa</p>
                      <h2 className="text-4xl font-extrabold">{totalRevenue.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</h2>
                      <p className="text-sm mt-2 opacity-80">Receitas de Vendas</p>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm">
                      <p className="text-gray-500 font-bold text-sm uppercase mb-1">Total Gasto</p>
                      <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white">{totalPaid.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</h2>
                      <p className="text-sm text-gray-400 mt-2">Despesas Pagas</p>
                  </div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
                  <h3 className="font-bold text-lg mb-4">Últimas Movimentações</h3>
                  <div className="space-y-4">
                      {crop.transactions?.length === 0 && <p className="text-center text-gray-400 py-4">Nada por aqui ainda.</p>}
                      {crop.transactions?.slice().reverse().map(tx => (
                          <div key={tx.id} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-slate-900 rounded-2xl">
                              <div className="flex items-center gap-3">
                                  <div className={`p-3 rounded-full ${tx.type === 'receita' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                      {tx.type === 'receita' ? <TrendingUp size={20}/> : <TrendingDown size={20}/>}
                                  </div>
                                  <div>
                                      <p className="font-bold text-gray-800 dark:text-white">{tx.description}</p>
                                      <p className="text-xs text-gray-500">{new Date(tx.date).toLocaleDateString()}</p>
                                  </div>
                              </div>
                              <span className={`font-bold text-lg ${tx.type === 'receita' ? 'text-green-600' : 'text-gray-800 dark:text-white'}`}>
                                  {tx.amount.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
                              </span>
                          </div>
                      ))}
                  </div>
              </div>
           </div>
         )}

         {/* (Mantendo Inventário, Reports e Assistant similares mas com o estilo limpo) */}
         {activeTab === 'inventory' && (
             <div className="animate-slide-up space-y-6">
                 <div className="bg-indigo-600 text-white p-8 rounded-3xl shadow-xl flex justify-between items-center">
                     <div>
                         <p className="text-indigo-200 font-bold mb-1">Estoque Atual</p>
                         <h2 className="text-4xl font-extrabold">{totalInventoryValue.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</h2>
                     </div>
                     <Warehouse size={48} className="text-indigo-400"/>
                 </div>
                 
                 <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
                     <h3 className="font-bold text-lg mb-6">Seus Produtos Armazenados</h3>
                     
                     <div className="grid grid-cols-1 gap-4">
                        {crop.inventory?.length === 0 && <p className="text-center text-gray-400 py-8">Seu estoque está vazio.</p>}
                        {crop.inventory?.map(item => (
                            <div key={item.id} className="p-5 border-2 border-gray-100 dark:border-slate-700 rounded-2xl flex justify-between items-center">
                                <div>
                                    <h4 className="font-black text-xl text-gray-800 dark:text-white">{item.quantity} <span className="text-sm font-medium text-gray-500">{item.unit}</span></h4>
                                    <p className="text-sm text-gray-500 flex items-center gap-1"><MapPin size={14}/> {item.location}</p>
                                </div>
                                <button 
                                    onClick={() => { setSelectedStockItem(item); setIsSellingStock(true); setStockForm({ quantity: item.quantity, price: marketPrice, location: '' }); setIsAddingStock(true); }} // Reusing generic state for simplicity in this demo
                                    className="bg-green-100 text-green-700 px-4 py-2 rounded-xl font-bold text-sm hover:bg-green-200"
                                >
                                    Vender
                                </button>
                            </div>
                        ))}
                     </div>
                     
                     <button 
                        onClick={() => { setIsAddingStock(!isAddingStock); setIsSellingStock(false); setStockForm({quantity: 0, location: '', price: 0}); }}
                        className="w-full mt-6 py-4 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 font-bold rounded-2xl flex justify-center items-center gap-2 hover:bg-gray-200"
                     >
                        <Plus size={20}/> Adicionar Manualmente
                     </button>

                     {isAddingStock && (
                         <div className="mt-6 p-6 bg-gray-50 dark:bg-slate-900 rounded-2xl animate-fade-in">
                             <h4 className="font-bold mb-4">{isSellingStock ? 'Vender do Estoque' : 'Novo Item'}</h4>
                             <div className="space-y-4">
                                 <input placeholder="Quantidade" type="number" className="w-full p-4 rounded-xl border" value={stockForm.quantity || ''} onChange={e=>setStockForm({...stockForm, quantity: Number(e.target.value)})}/>
                                 {isSellingStock ? (
                                     <input placeholder="Preço de Venda" type="number" className="w-full p-4 rounded-xl border" value={stockForm.price || ''} onChange={e=>setStockForm({...stockForm, price: Number(e.target.value)})}/>
                                 ) : (
                                     <input placeholder="Local (Silo, Galpão)" className="w-full p-4 rounded-xl border" value={stockForm.location} onChange={e=>setStockForm({...stockForm, location: e.target.value})}/>
                                 )}
                                 <div className="flex gap-2">
                                     <button onClick={() => setIsAddingStock(false)} className="flex-1 py-3 bg-gray-200 rounded-xl font-bold">Cancelar</button>
                                     <button onClick={isSellingStock ? handleSellStock : handleSaveStock} className="flex-1 py-3 bg-agro-green text-white rounded-xl font-bold">Confirmar</button>
                                 </div>
                             </div>
                         </div>
                     )}
                 </div>
             </div>
         )}

         {activeTab === 'assistant' && (
             <div className="h-[600px] flex flex-col bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden animate-slide-up">
                 <div className="flex-1 p-6 overflow-y-auto space-y-6">
                     {chatHistory.map((msg, i) => (
                         <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                             <div className={`max-w-[85%] p-5 rounded-3xl text-base font-medium leading-relaxed ${msg.role === 'user' ? 'bg-agro-green text-white rounded-br-none' : 'bg-gray-100 dark:bg-slate-900 text-gray-800 dark:text-gray-200 rounded-bl-none'}`}>
                                 {msg.text}
                             </div>
                         </div>
                     ))}
                     {isChatLoading && <div className="p-4 text-center text-gray-400 font-bold animate-pulse">Tonico está digitando...</div>}
                 </div>
                 <form onSubmit={handleChatSubmit} className="p-4 bg-gray-50 dark:bg-slate-900 border-t border-gray-100 dark:border-slate-700 flex gap-2">
                     <input 
                        className="flex-1 p-4 rounded-2xl border-2 border-gray-200 dark:border-slate-700 focus:border-agro-green outline-none"
                        placeholder="Pergunte ao Tonico..."
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                     />
                     <button type="submit" disabled={!chatInput.trim() || isChatLoading} className="bg-agro-green text-white p-4 rounded-2xl shadow-lg">
                         <Send size={24} />
                     </button>
                 </form>
             </div>
         )}

         {activeTab === 'reports' && <Reports crop={crop} />}
      </div>
    </div>
  );
};
