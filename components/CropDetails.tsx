import React, { useState, useEffect, useRef } from 'react';
import { CropData, TimelineStage, Material, HarvestLog } from '../types';
import { getAssistantResponse } from '../services/geminiService';
import { getCurrentPrice } from '../services/marketService';
import { Reports } from './Reports';
import { ArrowLeft, Calendar, Send, Edit2, Trash2, Plus, X, Warehouse, Package, Truck, TrendingUp } from 'lucide-react';
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

  const [isEditingPrices, setIsEditingPrices] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItem, setNewItem] = useState<Material>({ name: '', quantity: 0, unit: 'un', unitPriceEstimate: 0, category: 'outros' });

  const [isEditingTimeline, setIsEditingTimeline] = useState(false);

  const [isAddingHarvest, setIsAddingHarvest] = useState(false);
  const [editingHarvestId, setEditingHarvestId] = useState<string | null>(null);
  const [harvestForm, setHarvestForm] = useState<HarvestLog>({ id: '', date: new Date().toISOString().split('T')[0], quantity: 0, unit: 'sc', location: '', qualityNote: '' });
  const [currentMarketPrice, setCurrentMarketPrice] = useState<number>(0);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (activeTab === 'storage') {
      getCurrentPrice(crop.type).then(price => setCurrentMarketPrice(price)).catch(() => setCurrentMarketPrice(0));
    }
  }, [activeTab, crop.type]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const getTheme = (type: string) => {
    switch(type) {
      case 'cafe': return { main: 'text-[#A67C52]', bg: 'bg-[#A67C52]', gradient: 'from-[#A67C52] to-[#8B6642]' };
      case 'milho': return { main: 'text-orange-500', bg: 'bg-orange-500', gradient: 'from-orange-500 to-orange-600' };
      case 'soja': return { main: 'text-yellow-500', bg: 'bg-yellow-500', gradient: 'from-yellow-500 to-yellow-600' };
      default: return { main: 'text-agro-green', bg: 'bg-agro-green', gradient: 'from-agro-green to-green-700' };
    }
  };
  const theme = getTheme(crop.type);

  // Timeline handlers
  const toggleTask = (stageId: string, taskId: string) => {
    const updatedTimeline = (crop.timeline || []).map(stage => {
      if (stage.id === stageId) {
        return { ...stage, tasks: (stage.tasks || []).map(t => t.id === taskId ? { ...t, done: !t.done } : t) };
      }
      return stage;
    });
    onUpdateCrop({ ...crop, timeline: updatedTimeline });
  };

  const handleAddStage = () => {
    const newStage: TimelineStage = { id: Math.random().toString(36).slice(2), name: 'Novo Estágio', date: new Date().toISOString().split('T')[0], tasks: [] };
    onUpdateCrop({ ...crop, timeline: [...(crop.timeline || []), newStage] });
  };

  const handleRemoveStage = (index: number) => {
    const updated = [...(crop.timeline || [])];
    updated.splice(index, 1);
    onUpdateCrop({ ...crop, timeline: updated });
  };

  const handleUpdateStage = (index: number, field: keyof TimelineStage, value: any) => {
    const updated = [...(crop.timeline || [])];
    updated[index] = { ...updated[index], [field]: value } as TimelineStage;
    onUpdateCrop({ ...crop, timeline: updated });
  };

  // Materials handlers
  const handleUpdateMaterial = (index: number, field: 'quantity' | 'unitPriceEstimate', value: string) => {
    const updated = [...(crop.materials || [])];
    updated[index] = { ...updated[index], [field]: parseFloat(value) || 0 } as Material;
    onUpdateCrop({ ...crop, materials: updated });
  };

  const handleRemoveItem = (index: number) => {
    const updated = [...(crop.materials || [])];
    updated.splice(index, 1);
    onUpdateCrop({ ...crop, materials: updated });
  };

  const handleAddItem = () => {
    onUpdateCrop({ ...crop, materials: [...(crop.materials || []), newItem] });
    setNewItem({ name: '', quantity: 0, unit: 'un', unitPriceEstimate: 0, category: 'outros' });
    setIsAddingItem(false);
  };

  // Harvest handlers
  const handleSaveHarvest = () => {
    if (harvestForm.quantity <= 0) return alert('Quantidade deve ser maior que zero.');
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
    if (!confirm('Excluir este registro de colheita?')) return;
    const updatedLogs = (crop.harvestLogs || []).filter(h => h.id !== id);
    onUpdateCrop({ ...crop, harvestLogs: updatedLogs });
  };

  // Chat / assistant
  const handleChatSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    setIsChatLoading(true);
    try {
      const aiResponse = await getAssistantResponse(userMsg);
      setChatHistory(prev => [...prev, { role: 'ai', text: aiResponse }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'ai', text: 'Desculpe, ocorreu um erro ao obter resposta do assistente.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // PDF export (simples)
  const generatePDF = () => {
    setIsGeneratingPdf(true);
    try {
      const doc = new jsPDF();
      doc.text(`Relatório da Lavoura - ${crop.name}`, 14, 20);
      autoTable(doc, { head: [['Campo', 'Valor']], body: [['Área (ha)', String(crop.areaHa)], ['Meta produtividade', String(crop.productivityGoal)]] });
      const filename = `${crop.name.replace(/\s+/g, '_')}_report.pdf`;
      doc.save(filename);
    } catch (e) {
      console.error(e);
      alert('Erro ao gerar PDF');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Renders
  const renderOverview = () => (
    <div className="p-4 text-gray-700 dark:text-gray-300">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl">Área: <strong>{crop.areaHa} ha</strong></div>
        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl">Tipo: <strong>{crop.type}</strong></div>
        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl">Meta produtividade: <strong>{crop.productivityGoal}</strong></div>
      </div>
    </div>
  );

  const renderFinance = () => {
    const totalCost = (crop.materials || []).reduce((acc, m) => acc + ((m.unitPriceEstimate || 0) * (m.quantity || 0)), 0);
    return (
      <div className="p-4">
        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl mb-4">
          <h4 className="font-bold mb-2">Resumo Financeiro</h4>
          <p>Custo estimado: R$ {totalCost.toFixed(2)}</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl">
          <h4 className="font-bold mb-2">Materiais</h4>
          {(crop.materials || []).map((m, idx) => (
            <div key={idx} className="flex justify-between items-center py-2 border-b">
              <div>
                <div className="font-semibold">{m.name}</div>
                <div className="text-xs text-gray-500">{m.quantity} {m.unit}</div>
              </div>
              <div className="flex items-center gap-2">
                <input className="w-20 p-1 rounded" value={String(m.unitPriceEstimate || '')} onChange={e => handleUpdateMaterial(idx, 'unitPriceEstimate', e.target.value)} />
                <button onClick={() => handleRemoveItem(idx)} className="text-red-500">Remover</button>
              </div>
            </div>
          ))}

          {isAddingItem ? (
            <div className="mt-3 space-y-2">
              <input placeholder="Nome" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="w-full p-2 rounded" />
              <div className="flex gap-2">
                <input placeholder="Qtd" value={String(newItem.quantity)} onChange={e => setNewItem({...newItem, quantity: parseFloat(e.target.value) || 0})} className="w-1/3 p-2 rounded" />
                <input placeholder="Preço" value={String(newItem.unitPriceEstimate)} onChange={e => setNewItem({...newItem, unitPriceEstimate: parseFloat(e.target.value) || 0})} className="w-1/3 p-2 rounded" />
                <button onClick={handleAddItem} className="bg-green-600 text-white px-3 rounded">Adicionar</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setIsAddingItem(true)} className="mt-3 text-sm text-green-600">+ Novo material</button>
          )}
        </div>
      </div>
    );
  };

  const renderTimelineContent = () => (
    <div className="space-y-4">
      {(crop.timeline || []).map((stage, index) => (
        <div key={stage.id} className="p-4 bg-white dark:bg-slate-800 rounded-xl">
          <div className="flex justify-between items-center mb-2">
            <input value={stage.name} onChange={e => handleUpdateStage(index, 'name', e.target.value)} className="font-bold text-lg bg-transparent" />
            <div>
              <input type="date" value={stage.date} onChange={e => handleUpdateStage(index, 'date', e.target.value)} />
              <button onClick={() => handleRemoveStage(index)} className="ml-3 text-red-500">Excluir</button>
            </div>
          </div>

          <div className="space-y-2">
            {(stage.tasks || []).map(task => (
              <div key={task.id} className="flex items-center gap-3">
                <input type="checkbox" checked={task.done} onChange={() => toggleTask(stage.id, task.id)} />
                <span className={task.done ? 'line-through text-gray-400' : ''}>{task.label}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      <button onClick={handleAddStage} className="bg-green-600 text-white px-4 py-2 rounded">Adicionar Estágio</button>
    </div>
  );

  const renderAssistant = () => (
    <div className="p-4 flex flex-col gap-4">
      <div ref={chatScrollRef} className="h-64 overflow-y-auto p-3 bg-white dark:bg-slate-800 rounded-xl border dark:border-slate-700">
        {chatHistory.map((msg, i) => (
          <div key={i} className={`mb-3 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
            <div className={`inline-block max-w-[80%] p-2 rounded ${msg.role === 'user' ? 'bg-green-50 dark:bg-green-900/20' : 'bg-slate-100 dark:bg-slate-700'}`}>
              <div className="text-sm">{msg.text}</div>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleChatSubmit} className="flex gap-2">
        <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Pergunte algo ao assistente" className="flex-1 p-3 rounded-xl border" />
        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-xl">{isChatLoading ? '...' : <Send size={16} />}</button>
      </form>
    </div>
  );

  const renderStorage = () => {
    const logs = crop.harvestLogs || [];
    const goalValue = parseFloat(String(crop.productivityGoal).replace(/[^0-9.]/g, '')) || 0;
    const totalExpected = goalValue * (crop.areaHa || 0);
    const totalHarvested = logs.reduce((acc, l) => acc + (l.quantity || 0), 0);
    const progress = totalExpected > 0 ? (totalHarvested / totalExpected) * 100 : 0;
    const estimatedRevenue = totalHarvested * (currentMarketPrice || 0);

    return (
      <div className="space-y-6 animate-slide-up">
        {/* Progress & Revenue Card */}
        <div className={`rounded-3xl p-8 text-white shadow-lg bg-gradient-to-br ${theme.gradient} relative overflow-hidden`}>
           <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')]" />
           <div className="relative z-10">
              <h3 className="font-bold text-lg opacity-90 mb-1 flex items-center gap-2"><Warehouse size={20} /> Visão Geral da Colheita</h3>
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
                           <p className="text-xs font-medium opacity-80 mb-1 flex items-center gap-1"><TrendingUp size={14}/> Receita Estimada (Cotação Hoje)</p>
                           <p className="text-2xl font-bold text-green-300">{estimatedRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                           <p className="text-[10px] opacity-60 mt-1">Baseado em R$ {currentMarketPrice.toFixed(2)}/sc</p>
                      </div>
                  )}
              </div>
              <div className="mt-8">
                  <div className="flex justify-between text-xs font-bold mb-2 opacity-80"><span>Progresso da Safra</span><span>{progress.toFixed(1)}% da Meta ({totalExpected.toLocaleString('pt-BR')} sc)</span></div>
                  <div className="w-full bg-black/20 rounded-full h-3 overflow-hidden border border-white/10">
                      <div className="h-full bg-white rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(255,255,255,0.5)]" style={{ width: `${Math.min(progress, 100)}%` }} />
                  </div>
              </div>
           </div>
        </div>

        {/* Action & List */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
           <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-800 dark:text-white">Histórico de Cargas</h3>
              <button onClick={() => { setIsAddingHarvest(!isAddingHarvest); if (!isAddingHarvest) { setHarvestForm({ id: '', date: new Date().toISOString().split('T')[0], quantity: 0, unit: 'sc', location: '', qualityNote: '' }); setEditingHarvestId(null); } }} className="flex items-center gap-2 text-sm font-bold text-agro-green bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg hover:bg-green-100 transition-colors">{isAddingHarvest ? <X size={16}/> : <Plus size={16}/>} {isAddingHarvest ? 'Cancelar' : 'Nova Carga'}</button>
           </div>

           {isAddingHarvest && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 animate-fade-in">
                 <h4 className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-3">{editingHarvestId ? 'Editar Carga' : 'Registrar Colheita'}</h4>
                 <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="col-span-2">
                       <label className="text-[10px] font-bold text-gray-400 uppercase">Local de Armazenamento</label>
                       <input type="text" placeholder="Ex: Silo 1, Cooperativa" className="w-full p-3 rounded-xl border dark:border-slate-600 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-agro-green/20" value={harvestForm.location} onChange={e => setHarvestForm({...harvestForm, location: e.target.value})} />
                    </div>
                    <div>
                       <label className="text-[10px] font-bold text-gray-400 uppercase">Data</label>
                       <input type="date" className="w-full p-3 rounded-xl border dark:border-slate-600 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-agro-green/20" value={harvestForm.date} onChange={e => setHarvestForm({...harvestForm, date: e.target.value})} />
                    </div>
                    <div>
                       <label className="text-[10px] font-bold text-gray-400 uppercase">Qtd (Sacas)</label>
                       <input type="number" placeholder="0.00" className="w-full p-3 rounded-xl border dark:border-slate-600 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-agro-green/20 font-bold" value={harvestForm.quantity || ''} onChange={e => setHarvestForm({...harvestForm, quantity: parseFloat(e.target.value)})} />
                    </div>
                    <div className="col-span-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Obs. Qualidade (Opcional)</label>
                        <input type="text" placeholder="Ex: Umidade 13%, Impureza 1%" className="w-full p-3 rounded-xl border dark:border-slate-600 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-agro-green/20 text-sm" value={harvestForm.qualityNote || ''} onChange={e => setHarvestForm({...harvestForm, qualityNote: e.target.value})} />
                    </div>
                 </div>
                 <button onClick={handleSaveHarvest} className="w-full py-3 bg-agro-green text-white font-bold rounded-xl hover:bg-green-700 transition-transform active:scale-95 shadow-lg shadow-green-600/20">{editingHarvestId ? 'Salvar Alterações' : 'Confirmar Registro'}</button>
              </div>
           )}

           <div className="space-y-3">
              {logs.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 dark:text-gray-500"><Truck size={40} className="mx-auto mb-2 opacity-50" /><p>Nenhuma colheita registrada ainda.</p></div>
              ) : (
                  logs.map((log) => (
                     <div key={log.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-2xl border border-gray-100 dark:border-slate-700 hover:border-agro-green/30 transition-colors group">
                        <div className="flex items-center gap-3">
                           <div className={`p-3 rounded-xl bg-white dark:bg-slate-800 text-agro-green shadow-sm`}><Package size={20} /></div>
                           <div>
                              <h4 className="font-bold text-gray-800 dark:text-white text-sm">{log.location}</h4>
                              <p className="text-xs text-gray-500 flex items-center gap-1"><Calendar size={10}/> {new Date(log.date).toLocaleDateString('pt-BR')}</p>
                              {log.qualityNote && (<p className="text-[10px] text-orange-500 mt-0.5 bg-orange-50 dark:bg-orange-900/20 px-1.5 py-0.5 rounded-md inline-block">{log.qualityNote}</p>)}
                           </div>
                        </div>
                        <div className="flex items-center gap-2">
                           <div className="text-right mr-2"><span className="block font-extrabold text-lg text-gray-900 dark:text-white leading-tight">{log.quantity}</span><span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{log.unit}</span></div>
                           <button onClick={() => handleEditHarvest(log)} className="p-2 text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Editar"><Edit2 size={16}/></button>
                           <button onClick={() => handleDeleteHarvest(log.id)} className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Excluir"><Trash2 size={16}/></button>
                        </div>
                     </div>
                  ))
              )}
           </div>
        </div>
      </div>
    );
  };

  // Main return
  return (
    <div className="p-4 md:p-8">
      <button className="flex items-center gap-2 mb-6 text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white" onClick={onBack}><ArrowLeft size={18} /> Voltar</button>
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900 dark:text-white">{crop.name}</h1>

      <div className="flex gap-4 mb-6 border-b dark:border-slate-700">
        {[ { id: 'overview', label: 'Visão Geral' }, { id: 'finance', label: 'Finanças' }, { id: 'timeline', label: 'Cronograma' }, { id: 'assistant', label: 'Assistente' }, { id: 'storage', label: 'Armazenagem' }, { id: 'reports', label: 'Relatórios' } ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`pb-2 px-1 font-semibold ${activeTab === tab.id ? `${theme.main} border-b-2 ${theme.bg}` : 'text-gray-500 dark:text-gray-400'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'finance' && renderFinance()}
        {activeTab === 'timeline' && <div className="p-4">{renderTimelineContent()}</div>}
        {activeTab === 'assistant' && renderAssistant()}
        {activeTab === 'storage' && renderStorage()}
        {activeTab === 'reports' && <Reports crop={crop} />}
      </div>

    </div>
  );
};

export default CropDetails;
