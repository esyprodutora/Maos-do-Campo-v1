
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
  PlayCircle, StopCircle, Hammer
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

  // --- LÓGICA DO CRONOGRAMA ---
  const [expandedStageId, setExpandedStageId] = useState<string | null>(crop.timeline?.[0]?.id || null);
  // Controla qual aba interna do card está ativa (tasks ou resources)
  const [stageTab, setStageTab] = useState<'tasks' | 'resources'>('tasks');

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

  const renderTimeline = () => (
    <div className="space-y-8 animate-slide-up pb-24">
      {/* Modal de Formulário (Overlay) */}
      {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl animate-slide-up border border-gray-100 dark:border-slate-700">
                  <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-slate-700 pb-4">
                      <h3 className="text-xl font-extrabold text-gray-800 dark:text-white flex items-center gap-2">
                          {editingResourceId ? <Edit2 className="text-agro-green"/> : <Plus className="text-agro-green"/>}
                          {editingResourceId ? 'Editar Item' : 'Adicionar Novo Item'}
                      </h3>
                      <button onClick={() => setIsModalOpen(false)} className="p-3 bg-gray-100 dark:bg-slate-700 rounded-full text-gray-500 hover:bg-gray-200">
                          <X size={24} />
                      </button>
                  </div>

                  <div className="space-y-6">
                      <div>
                          <label className="block text-sm font-bold text-gray-500 mb-2">O que você vai usar?</label>
                          <input 
                              autoFocus
                              className="w-full p-4 text-lg bg-gray-50 dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-700 rounded-2xl focus:border-agro-green outline-none font-bold text-gray-800 dark:text-white placeholder:font-normal"
                              placeholder="Ex: Adubo, Trator, Diária..."
                              value={resourceForm.name}
                              onChange={e => setResourceForm({...resourceForm, name: e.target.value})}
                          />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-bold text-gray-500 mb-2">Quanto?</label>
                              <input 
                                  type="number"
                                  className="w-full p-4 text-lg bg-gray-50 dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-700 rounded-2xl focus:border-agro-green outline-none font-bold text-gray-800 dark:text-white"
                                  placeholder="0"
                                  value={resourceForm.quantity || ''}
                                  onChange={e => setResourceForm({...resourceForm, quantity: Number(e.target.value)})}
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-bold text-gray-500 mb-2">Unidade</label>
                              <input 
                                  className="w-full p-4 text-lg bg-gray-50 dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-700 rounded-2xl focus:border-agro-green outline-none font-bold text-gray-800 dark:text-white"
                                  placeholder="kg, lt, un"
                                  value={resourceForm.unit || ''}
                                  onChange={e => setResourceForm({...resourceForm, unit: e.target.value})}
                              />
                          </div>
                      </div>

                      <div>
                          <label className="block text-sm font-bold text-gray-500 mb-2">Preço por Unidade (R$)</label>
                          <input 
                              type="number"
                              className="w-full p-4 text-lg bg-gray-50 dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-700 rounded-2xl focus:border-agro-green outline-none font-bold text-gray-800 dark:text-white"
                              placeholder="0.00"
                              value={resourceForm.unitCost || ''}
                              onChange={e => setResourceForm({...resourceForm, unitCost: Number(e.target.value)})}
                          />
                      </div>

                      <div className="bg-green-50 dark:bg-green-900/20 p-5 rounded-2xl flex justify-between items-center border border-green-100 dark:border-green-900/30">
                          <span className="font-bold text-green-800 dark:text-green-300">Total Previsto:</span>
                          <span className="text-3xl font-black text-green-600 dark:text-green-400">
                              {((Number(resourceForm.quantity) || 0) * (Number(resourceForm.unitCost) || 0)).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
                          </span>
                      </div>

                      <button 
                          onClick={handleSaveResource}
                          className="w-full py-4 bg-agro-green text-white font-bold text-lg rounded-2xl shadow-lg shadow-green-600/30 active:scale-95 transition-transform hover:bg-green-700"
                      >
                          Confirmar e Salvar
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Título da Seção */}
      <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-1">Acompanhamento da Safra</h2>
          <p className="text-gray-500 text-sm">Toque nas etapas abaixo para ver detalhes.</p>
      </div>

      {/* Lista de Cards de Etapas */}
      <div className="space-y-6">
        {crop.timeline?.map((stage, idx) => {
          const isExpanded = expandedStageId === stage.id;
          const stageCost = stage.resources?.reduce((a,b) => a + b.totalCost, 0) || 0;
          
          return (
            <div 
                key={stage.id} 
                className={`
                    relative bg-white dark:bg-slate-800 rounded-3xl transition-all duration-300 overflow-hidden
                    ${isExpanded ? 'shadow-2xl ring-2 ring-agro-green scale-[1.01]' : 'shadow-md border border-gray-200 dark:border-slate-700'}
                `}
            >
                 {/* Cabeçalho do Card (Sempre Visível) */}
                 <div 
                   onClick={() => setExpandedStageId(isExpanded ? null : stage.id)}
                   className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                 >
                    <div className="flex justify-between items-start mb-3">
                        {/* Badges de Status e Número */}
                        <div className="flex items-center gap-2">
                            <span className={`
                                w-8 h-8 rounded-full flex items-center justify-center font-black text-sm
                                ${stage.status === 'concluido' ? 'bg-agro-green text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-500'}
                            `}>
                                {stage.status === 'concluido' ? <Check size={16}/> : idx + 1}
                            </span>
                            {stage.status === 'concluido' && (
                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-lg text-xs font-bold uppercase">Concluída</span>
                            )}
                        </div>

                        {/* Valor da Etapa (Destaque) */}
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] uppercase font-bold text-gray-400">Custo Previsto</span>
                            <span className="text-lg font-black text-agro-green">
                                {stageCost.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
                            </span>
                        </div>
                    </div>

                    <div className="flex justify-between items-end">
                        <div className="flex-1 pr-4">
                            <h3 className="text-xl font-extrabold text-gray-900 dark:text-white leading-tight mb-1">{stage.title}</h3>
                            <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
                                <Calendar size={14} />
                                <span>Previsão: {stage.dateEstimate}</span>
                            </div>
                        </div>
                        <div className={`p-2 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                            <ChevronDown size={20} />
                        </div>
                    </div>
                 </div>

                 {/* Conteúdo Expandido (Abas) */}
                 {isExpanded && (
                   <div className="border-t border-gray-100 dark:border-slate-700 animate-fade-in bg-gray-50 dark:bg-slate-900/50">
                      
                      {/* Navegação Interna do Card (Abas Grandes) */}
                      <div className="flex p-2 gap-2 bg-white dark:bg-slate-800 mx-4 mt-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                          <button 
                            onClick={() => setStageTab('tasks')}
                            className={`flex-1 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors ${stageTab === 'tasks' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'text-gray-500 hover:bg-gray-50'}`}
                          >
                              <ListTodo size={18} /> O QUE FAZER
                          </button>
                          <button 
                            onClick={() => setStageTab('resources')}
                            className={`flex-1 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors ${stageTab === 'resources' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'text-gray-500 hover:bg-gray-50'}`}
                          >
                              <Wallet size={18} /> O QUE GASTAR
                          </button>
                      </div>

                      {/* Conteúdo da Aba: TAREFAS */}
                      {stageTab === 'tasks' && (
                          <div className="p-6">
                              <p className="text-gray-500 text-sm mb-4 italic">"{stage.description}"</p>
                              <div className="space-y-3">
                                  {stage.tasks?.map(task => (
                                      <div 
                                          key={task.id} 
                                          onClick={() => toggleTask(stage.id, task.id)} 
                                          className={`
                                              flex items-center gap-4 p-4 rounded-2xl cursor-pointer border-2 transition-all
                                              ${task.done 
                                                  ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-900/30' 
                                                  : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:border-blue-300'}
                                          `}
                                      >
                                          <div className={`
                                              shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors
                                              ${task.done ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600'}
                                          `}>
                                              {task.done && <Check size={16}/>}
                                          </div>
                                          <span className={`font-medium text-lg leading-snug ${task.done ? 'text-blue-800 dark:text-blue-300 line-through opacity-70' : 'text-gray-800 dark:text-gray-200'}`}>
                                              {task.text}
                                          </span>
                                      </div>
                                  ))}
                              </div>
                              
                              {/* Botão Concluir Etapa (Fica em Tarefas pois é uma ação de fluxo) */}
                              {stage.status !== 'concluido' && (
                                <div className="mt-8 pt-4 border-t border-gray-200 dark:border-slate-700">
                                    <button 
                                        onClick={() => handleCompleteStage(stage)}
                                        className="w-full flex flex-col items-center justify-center bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-transform"
                                    >
                                        <div className="flex items-center gap-2 text-lg">
                                            <CheckCircle2 size={24} className="text-green-400 dark:text-green-600" />
                                            Finalizar Esta Etapa
                                        </div>
                                        <span className="text-xs opacity-60 font-normal mt-1">Lança os custos no financeiro automaticamente</span>
                                    </button>
                                </div>
                              )}
                          </div>
                      )}

                      {/* Conteúdo da Aba: CUSTOS (RECURSOS) */}
                      {stageTab === 'resources' && (
                          <div className="p-6">
                              {/* Grid de Botões de Adição */}
                              <div className="grid grid-cols-3 gap-3 mb-8">
                                  <button 
                                      onClick={() => openResourceModal(stage.id, 'insumo')}
                                      className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border-b-4 border-green-500 active:border-b-0 active:translate-y-1 transition-all"
                                  >
                                      <div className="bg-green-100 p-2 rounded-full mb-2"><Beaker size={24} className="text-green-600"/></div>
                                      <span className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase">Produto</span>
                                  </button>
                                  <button 
                                      onClick={() => openResourceModal(stage.id, 'maquinario')}
                                      className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border-b-4 border-orange-500 active:border-b-0 active:translate-y-1 transition-all"
                                  >
                                      <div className="bg-orange-100 p-2 rounded-full mb-2"><Tractor size={24} className="text-orange-600"/></div>
                                      <span className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase">Máquina</span>
                                  </button>
                                  <button 
                                      onClick={() => openResourceModal(stage.id, 'mao_de_obra')}
                                      className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border-b-4 border-blue-500 active:border-b-0 active:translate-y-1 transition-all"
                                  >
                                      <div className="bg-blue-100 p-2 rounded-full mb-2"><User size={24} className="text-blue-600"/></div>
                                      <span className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase">Pessoa</span>
                                  </button>
                              </div>

                              {/* Lista de Itens Adicionados */}
                              <div className="space-y-4">
                                  {stage.resources?.length === 0 && (
                                      <div className="text-center py-10 bg-white dark:bg-slate-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-700">
                                          <p className="text-gray-400 font-medium">Nenhum custo lançado.</p>
                                          <p className="text-xs text-gray-400 mt-1">Toque nos botões acima para adicionar.</p>
                                      </div>
                                  )}

                                  {/* Renderização em Lista Estilizada */}
                                  {stage.resources?.map(res => {
                                      let iconColor = "text-gray-500";
                                      let bgColor = "bg-gray-50";
                                      let Icon = Package;
                                      
                                      if(res.type === 'insumo') { iconColor = "text-green-600"; bgColor = "bg-green-50 dark:bg-green-900/10"; Icon = Beaker; }
                                      if(res.type === 'maquinario') { iconColor = "text-orange-600"; bgColor = "bg-orange-50 dark:bg-orange-900/10"; Icon = Tractor; }
                                      if(res.type === 'mao_de_obra') { iconColor = "text-blue-600"; bgColor = "bg-blue-50 dark:bg-blue-900/10"; Icon = User; }

                                      return (
                                          <div key={res.id} className="flex flex-col md:flex-row md:items-center bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                                              {/* Ícone e Nome */}
                                              <div className="flex items-center gap-4 flex-1 mb-3 md:mb-0">
                                                  <div className={`w-12 h-12 rounded-xl ${bgColor} flex items-center justify-center shrink-0`}>
                                                      <Icon size={24} className={iconColor} />
                                                  </div>
                                                  <div>
                                                      <h4 className="font-bold text-gray-900 dark:text-white text-base">{res.name}</h4>
                                                      <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                                                          <span className="bg-gray-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">{res.quantity} {res.unit}</span>
                                                          <span>x</span>
                                                          <span>{res.unitCost.toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}</span>
                                                      </p>
                                                  </div>
                                              </div>

                                              {/* Total e Ações */}
                                              <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 border-gray-100 dark:border-slate-700 pt-3 md:pt-0">
                                                  <span className="text-lg font-black text-gray-800 dark:text-white">
                                                      {res.totalCost.toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}
                                                  </span>
                                                  
                                                  <div className="flex gap-2">
                                                      <button 
                                                          onClick={() => openResourceModal(stage.id, res.type, res)}
                                                          className="p-2.5 bg-gray-100 dark:bg-slate-700 text-blue-600 rounded-xl hover:bg-blue-50 transition-colors"
                                                      >
                                                          <Edit2 size={18} />
                                                      </button>
                                                      <button 
                                                          onClick={() => handleDeleteResource(stage.id, res.id)}
                                                          className="p-2.5 bg-gray-100 dark:bg-slate-700 text-red-500 rounded-xl hover:bg-red-50 transition-colors"
                                                      >
                                                          <Trash2 size={18} />
                                                      </button>
                                                  </div>
                                              </div>
                                          </div>
                                      );
                                  })}
                              </div>
                          </div>
                      )}
                   </div>
                 )}
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
