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
  PlayCircle, StopCircle, Hammer, AlertTriangle, Loader2
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
  const [stageTab, setStageTab] = useState<'tasks' | 'resources'>('tasks');

  // Estado para Edição do Cabeçalho do Card (Título e Datas)
  const [editingStageMetaId, setEditingStageMetaId] = useState<string | null>(null);
  const [metaForm, setMetaForm] = useState({ title: '', startDate: '', endDate: '' });

  // Estado para Nova Tarefa
  const [newTaskText, setNewTaskText] = useState('');

  // Controle do Modal de Recurso
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStageId, setModalStageId] = useState<string | null>(null);
  const [editingResourceId, setEditingResourceId] = useState<string | null>(null);
  const [resourceForm, setResourceForm] = useState<Partial<StageResource>>({
      name: '', type: 'insumo', quantity: 0, unit: 'un', unitCost: 0, ownership: 'alugado'
  });

  // --- CRUD DE ETAPAS (CARDS) ---

  const handleAddStage = () => {
      const newStage: TimelineStage = {
          id: Math.random().toString(36).substr(2, 9),
          title: "Nova Etapa",
          description: "Descreva o objetivo desta etapa.",
          status: 'pendente',
          dateEstimate: '',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          tasks: [],
          resources: [],
          type: 'manejo'
      };
      
      onUpdateCrop({ ...crop, timeline: [...(crop.timeline || []), newStage] });
      setExpandedStageId(newStage.id);
      // Entra direto em modo de edição
      setEditingStageMetaId(newStage.id);
      setMetaForm({ title: newStage.title, startDate: newStage.startDate!, endDate: newStage.endDate! });
  };

  const handleDeleteStage = (stageId: string) => {
      if(!confirm("Tem certeza que deseja excluir esta etapa inteira? Todos os dados dela serão perdidos.")) return;
      const updatedTimeline = crop.timeline.filter(s => s.id !== stageId);
      onUpdateCrop({ ...crop, timeline: updatedTimeline });
  };

  const startEditingMeta = (stage: TimelineStage, e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingStageMetaId(stage.id);
      setMetaForm({ 
          title: stage.title, 
          startDate: stage.startDate || '', 
          endDate: stage.endDate || '' 
      });
  };

  const saveStageMeta = (stageId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const updatedTimeline = crop.timeline.map(s => {
          if(s.id === stageId) {
              return { 
                  ...s, 
                  title: metaForm.title, 
                  startDate: metaForm.startDate, 
                  endDate: metaForm.endDate 
              };
          }
          return s;
      });
      onUpdateCrop({ ...crop, timeline: updatedTimeline });
      setEditingStageMetaId(null);
  };

  // --- CRUD DE TAREFAS ---

  const handleAddTask = (stageId: string) => {
      if(!newTaskText.trim()) return;
      const updatedTimeline = crop.timeline.map(stage => {
          if(stage.id === stageId) {
              return { 
                  ...stage, 
                  tasks: [...stage.tasks, { id: Math.random().toString(36).substr(2, 9), text: newTaskText, done: false }]
              };
          }
          return stage;
      });
      onUpdateCrop({ ...crop, timeline: updatedTimeline });
      setNewTaskText('');
  };

  const handleDeleteTask = (stageId: string, taskId: string) => {
      const updatedTimeline = crop.timeline.map(stage => {
          if(stage.id === stageId) {
              return { ...stage, tasks: stage.tasks.filter(t => t.id !== taskId) };
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

  // --- CRUD DE RECURSOS (Modais) ---

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

  // --- LÓGICA DE ESTOQUE E FINANCEIRA (Mantida igual) ---
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

  const renderTimeline = () => (
    <div className="space-y-8 animate-slide-up pb-24">
      {/* Modal de Recursos */}
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
          <p className="text-gray-500 text-sm">Toque nos cartões para ver e editar detalhes.</p>
      </div>

      {/* Lista de Cards de Etapas */}
      <div className="space-y-8">
        {crop.timeline?.map((stage, idx) => {
          const isExpanded = expandedStageId === stage.id;
          const isEditingMeta = editingStageMetaId === stage.id;
          const stageCost = stage.resources?.reduce((a,b) => a + b.totalCost, 0) || 0;

          // Date logic
          const startDate = stage.startDate ? new Date(stage.startDate).toLocaleDateString('pt-BR') : null;
          const endDate = stage.endDate ? new Date(stage.endDate).toLocaleDateString('pt-BR') : null;
          const isDelayed = stage.endDate && new Date(stage.endDate) < new Date() && stage.status !== 'concluido';
          
          return (
            <div 
                key={stage.id} 
                className={`
                    relative bg-white dark:bg-slate-800 rounded-3xl transition-all duration-300 overflow-hidden
                    ${isExpanded ? 'shadow-2xl ring-2 ring-agro-green scale-[1.01] z-10' : 'shadow-md border border-gray-200 dark:border-slate-700'}
                `}
            >
                 {/* Cabeçalho do Card */}
                 <div 
                   onClick={() => !isEditingMeta && setExpandedStageId(isExpanded ? null : stage.id)}
                   className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                 >
                    {/* Linha Superior: Status e Custo */}
                    <div className="flex justify-between items-start mb-4">
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
                            {isDelayed && (
                                <span className="bg-red-100 text-red-700 px-2 py-1 rounded-lg text-xs font-bold uppercase flex items-center gap-1">
                                    <AlertTriangle size={12}/> Atrasada
                                </span>
                            )}
                        </div>
                        
                        {!isEditingMeta && (
                            <button 
                                onClick={(e) => startEditingMeta(stage, e)} 
                                className="p-2 bg-gray-100 dark:bg-slate-700 rounded-full text-blue-500 hover:bg-blue-50 transition-colors"
                            >
                                <Edit2 size={16} />
                            </button>
                        )}
                    </div>

                    {/* Modo de Edição do Cabeçalho */}
                    {isEditingMeta ? (
                        <div className="space-y-4 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-400 uppercase">Nome da Etapa</label>
                                <input 
                                    className="w-full text-xl font-bold p-2 bg-gray-50 dark:bg-slate-900 border-2 border-blue-200 rounded-lg focus:border-blue-500 outline-none"
                                    value={metaForm.title}
                                    onChange={(e) => setMetaForm({...metaForm, title: e.target.value})}
                                    autoFocus
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase">Data Início</label>
                                    <input 
                                        type="date"
                                        className="w-full p-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg font-medium"
                                        value={metaForm.startDate}
                                        onChange={(e) => setMetaForm({...metaForm, startDate: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase">Data Fim</label>
                                    <input 
                                        type="date"
                                        className="w-full p-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg font-medium"
                                        value={metaForm.endDate}
                                        onChange={(e) => setMetaForm({...metaForm, endDate: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2 justify-end pt-2">
                                <button 
                                    onClick={(e) => handleDeleteStage(stage.id)}
                                    className="px-4 py-2 text-red-500 font-bold text-sm bg-red-50 rounded-lg hover:bg-red-100"
                                >
                                    Excluir Etapa
                                </button>
                                <button 
                                    onClick={(e) => saveStageMeta(stage.id, e)}
                                    className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700"
                                >
                                    Salvar Alterações
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-between items-end">
                            <div className="flex-1 pr-4">
                                <h3 className="text-xl font-extrabold text-gray-900 dark:text-white leading-tight mb-2">{stage.title}</h3>
                                <div className="flex items-center gap-3 text-sm font-medium">
                                    <div className="flex items-center gap-1.5 text-gray-500 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded-md">
                                        <Calendar size={14} />
                                        <span>
                                            {startDate && endDate ? `${startDate} - ${endDate}` : (stage.dateEstimate || 'Sem data definida')}
                                        </span>
                                    </div>
                                    <span className="text-agro-green font-bold bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-md">
                                        {stageCost.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
                                    </span>
                                </div>
                            </div>
                            <div className={`p-2 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                                <ChevronDown size={20} />
                            </div>
                        </div>
                    )}
                 </div>

                 {/* Conteúdo Expandido (Abas) */}
                 {isExpanded && !isEditingMeta && (
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
                              
                              <div className="space-y-3 mb-6">
                                  {stage.tasks?.map(task => (
                                      <div 
                                          key={task.id} 
                                          className={`
                                              group flex items-center justify-between p-4 rounded-2xl border-2 transition-all
                                              ${task.done 
                                                  ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-900/30' 
                                                  : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700'}
                                          `}
                                      >
                                          <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => toggleTask(stage.id, task.id)}>
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
                                          <button 
                                              onClick={() => handleDeleteTask(stage.id, task.id)}
                                              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                          >
                                              <Trash2 size={18} />
                                          </button>
                                      </div>
                                  ))}
                              </div>

                              {/* Adicionar Nova Tarefa */}
                              <div className="flex gap-2">
                                  <input 
                                      className="flex-1 p-3 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 outline-none focus:border-blue-500"
                                      placeholder="Nova tarefa..."
                                      value={newTaskText}
                                      onChange={(e) => setNewTaskText(e.target.value)}
                                      onKeyDown={(e) => e.key === 'Enter' && handleAddTask(stage.id)}
                                  />
                                  <button 
                                      onClick={() => handleAddTask(stage.id)}
                                      className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-xl font-bold shadow-sm"
                                  >
                                      <Plus size={20} />
                                  </button>
                              </div>
                              
                              {/* Botão Concluir Etapa */}
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

        {/* Botão para Adicionar Nova Etapa */}
        <button 
            onClick={handleAddStage}
            className="w-full py-6 border-4 border-dashed border-gray-300 dark:border-slate-700 rounded-3xl flex flex-col items-center justify-center text-gray-400 hover:text-agro-green hover:border-agro-green hover:bg-green-50 dark:hover:bg-slate-800 transition-all group"
        >
            <div className="w-12 h-12 bg-gray-200 dark:bg-slate-800 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Plus size={24} className="group-hover:text-agro-green"/>
            </div>
            <span className="font-bold text-lg">Adicionar Nova Etapa</span>
            <span className="text-xs">Personalize seu cronograma</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="animate-slide-up pb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={onBack} 
          className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-gray-100 dark:border-slate-700 text-gray-500 hover:text-agro-green transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        
        <div className="text-right">
           <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white leading-none">{crop.name}</h1>
           <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">{crop.type} • {crop.areaHa} ha</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-4 pb-4 mb-4 custom-scrollbar">
        {[
          { id: 'timeline', label: 'Cronograma', icon: Calendar },
          { id: 'finance', label: 'Financeiro', icon: DollarSign },
          { id: 'inventory', label: 'Estoque', icon: Warehouse },
          { id: 'assistant', label: 'Assistente IA', icon: MessageCircle },
          { id: 'reports', label: 'Relatórios', icon: FileText },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all
              ${activeTab === tab.id 
                ? 'bg-agro-green text-white shadow-lg shadow-green-600/30' 
                : 'bg-white dark:bg-slate-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700 border border-transparent'}
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
        
        {activeTab === 'reports' && <Reports crop={crop} />}

        {activeTab === 'assistant' && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden flex flex-col h-[600px]">
            <div className="bg-agro-green p-4 text-white flex items-center gap-3">
               <div className="bg-white/20 p-2 rounded-full">
                  <MessageCircle size={24} />
               </div>
               <div>
                 <h3 className="font-bold">Tonico - Assistente Agrícola</h3>
                 <p className="text-xs opacity-90">Especialista em {crop.type}</p>
               </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-slate-900">
               {chatHistory.map((msg, i) => (
                 <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-tr-none' 
                        : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 shadow-sm border border-gray-200 dark:border-slate-700 rounded-tl-none'
                    }`}>
                       {msg.text}
                    </div>
                 </div>
               ))}
               {isChatLoading && (
                 <div className="flex justify-start">
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-tl-none shadow-sm border border-gray-200 dark:border-slate-700 flex items-center gap-2">
                       <Loader2 size={16} className="animate-spin text-agro-green" />
                       <span className="text-xs text-gray-400">Digitando...</span>
                    </div>
                 </div>
               )}
            </div>

            <form onSubmit={handleChatSubmit} className="p-4 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 flex gap-2">
               <input 
                 value={chatInput}
                 onChange={(e) => setChatInput(e.target.value)}
                 placeholder="Pergunte sobre pragas, clima ou manejo..."
                 className="flex-1 p-4 bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 outline-none focus:border-agro-green transition-colors"
               />
               <button 
                 type="submit" 
                 disabled={!chatInput.trim() || isChatLoading}
                 className="p-4 bg-agro-green text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
               >
                 <Send size={20} />
               </button>
            </form>
          </div>
        )}

        {activeTab === 'finance' && (
           <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
                     <p className="text-sm text-gray-500 font-bold mb-1">Custo Operacional</p>
                     <h3 className="text-2xl font-extrabold text-gray-800 dark:text-white">
                        {totalOperationalCost.toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}
                     </h3>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
                     <p className="text-sm text-gray-500 font-bold mb-1">Total Pago</p>
                     <h3 className="text-2xl font-extrabold text-green-600">
                        {totalPaid.toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}
                     </h3>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
                     <p className="text-sm text-gray-500 font-bold mb-1">Receita</p>
                     <h3 className="text-2xl font-extrabold text-blue-600">
                        {totalRevenue.toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}
                     </h3>
                  </div>
              </div>
              
              <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                  <div className="p-6 border-b border-gray-100 dark:border-slate-700">
                     <h3 className="font-bold text-lg">Histórico de Transações</h3>
                  </div>
                  {crop.transactions?.length === 0 ? (
                      <div className="p-10 text-center text-gray-400">Nenhuma transação registrada.</div>
                  ) : (
                      <div className="divide-y divide-gray-100 dark:divide-slate-700">
                          {crop.transactions?.map(tx => (
                              <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                  <div className="flex items-center gap-4">
                                      <div className={`p-3 rounded-full ${tx.type === 'receita' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                                          {tx.type === 'receita' ? <TrendingUp size={20}/> : <TrendingDown size={20}/>}
                                      </div>
                                      <div>
                                          <p className="font-bold text-gray-800 dark:text-white">{tx.description}</p>
                                          <p className="text-xs text-gray-500">{new Date(tx.date).toLocaleDateString()} • {tx.category}</p>
                                      </div>
                                  </div>
                                  <div className="text-right">
                                      <p className={`font-bold ${tx.type === 'receita' ? 'text-blue-600' : 'text-red-600'}`}>
                                          {tx.type === 'receita' ? '+' : '-'} {tx.amount.toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}
                                      </p>
                                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${tx.status === 'pago' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                          {tx.status}
                                      </span>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
           </div>
        )}

        {activeTab === 'inventory' && (
           <div className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {/* Card Adicionar */}
                   <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
                       <h3 className="font-bold mb-4 flex items-center gap-2">
                           <Plus className="text-agro-green"/> Adicionar Colheita
                       </h3>
                       <div className="space-y-4">
                           <div className="grid grid-cols-2 gap-4">
                               <input 
                                 type="number"
                                 placeholder="Quantidade" 
                                 className="p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl w-full"
                                 value={stockForm.quantity || ''}
                                 onChange={e => setStockForm({...stockForm, quantity: Number(e.target.value)})}
                               />
                               <input 
                                 placeholder="Local (Silo, etc)" 
                                 className="p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl w-full"
                                 value={stockForm.location}
                                 onChange={e => setStockForm({...stockForm, location: e.target.value})}
                               />
                           </div>
                           <button 
                             onClick={handleSaveStock}
                             className="w-full py-3 bg-agro-green text-white font-bold rounded-xl hover:bg-green-700"
                           >
                             Salvar no Estoque
                           </button>
                       </div>
                   </div>

                   {/* Resumo */}
                   <div className="bg-indigo-600 text-white p-6 rounded-3xl shadow-lg shadow-indigo-500/30 flex flex-col justify-between">
                       <div>
                           <p className="opacity-80 font-medium">Valor Estimado em Estoque</p>
                           <h3 className="text-4xl font-extrabold mt-1">
                               {inventoryValue.toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}
                           </h3>
                       </div>
                       <div className="mt-4 flex items-center gap-2 text-sm opacity-80 bg-white/10 p-2 rounded-lg w-fit">
                           <DollarSign size={16} /> Baseado na cotação de hoje (R$ {marketPrice.toFixed(2)})
                       </div>
                   </div>
               </div>

               {/* Lista Estoque */}
               <div className="space-y-4">
                   {crop.inventory?.map(item => (
                       <div key={item.id} className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 flex justify-between items-center">
                           <div className="flex items-center gap-4">
                               <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center text-yellow-600 dark:text-yellow-400">
                                   <Package size={24} />
                               </div>
                               <div>
                                   <h4 className="font-bold text-lg">{item.quantity} {item.unit}</h4>
                                   <p className="text-gray-500 text-sm">{item.location} • {new Date(item.dateStored).toLocaleDateString()}</p>
                               </div>
                           </div>
                           
                           <div className="flex items-center gap-3">
                               <button 
                                 onClick={() => {
                                     setSelectedStockItem(item);
                                     setStockForm({ ...stockForm, quantity: item.quantity, price: marketPrice });
                                     setIsSellingStock(true);
                                 }}
                                 className="px-4 py-2 bg-green-50 text-green-700 font-bold rounded-xl hover:bg-green-100"
                               >
                                   Vender
                               </button>
                           </div>
                       </div>
                   ))}
               </div>
               
               {/* Modal Venda */}
               {isSellingStock && selectedStockItem && (
                   <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                       <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl w-full max-w-md">
                           <h3 className="text-xl font-bold mb-4">Registrar Venda</h3>
                           <p className="mb-4 text-gray-500">Quanto você vendeu de {selectedStockItem.location}?</p>
                           
                           <div className="space-y-4">
                               <div>
                                   <label className="block text-sm font-bold mb-1">Quantidade ({selectedStockItem.unit})</label>
                                   <input 
                                     type="number"
                                     className="w-full p-3 border rounded-xl dark:bg-slate-900 dark:border-slate-700"
                                     value={stockForm.quantity}
                                     onChange={e => setStockForm({...stockForm, quantity: Number(e.target.value)})}
                                   />
                               </div>
                               <div>
                                   <label className="block text-sm font-bold mb-1">Preço Final (Total ou Unitário? Vamos usar Unitário)</label>
                                   <input 
                                     type="number"
                                     className="w-full p-3 border rounded-xl dark:bg-slate-900 dark:border-slate-700"
                                     value={stockForm.price}
                                     onChange={e => setStockForm({...stockForm, price: Number(e.target.value)})}
                                   />
                               </div>
                               <div className="flex gap-2 mt-6">
                                   <button onClick={resetStockForm} className="flex-1 py-3 text-gray-500 font-bold">Cancelar</button>
                                   <button onClick={handleSellStock} className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl">Confirmar Venda</button>
                               </div>
                           </div>
                       </div>
                   </div>
               )}
           </div>
        )}
      </div>
      
      {/* Botão de Excluir Lavoura no rodapé */}
      <div className="mt-12 pt-8 border-t border-gray-200 dark:border-slate-700 flex justify-center">
          <button 
            onClick={onDeleteCrop}
            className="text-red-500 hover:text-red-700 text-sm font-bold flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
              <Trash2 size={16} /> Excluir esta lavoura permanentemente
          </button>
      </div>

    </div>
  );
};