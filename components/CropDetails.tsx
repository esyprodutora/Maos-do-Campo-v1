import React, { useState } from 'react';
import { CropData, TimelineStage, Material } from '../types';
import { getAssistantResponse } from '../services/geminiService';
import { ArrowLeft, Calendar, DollarSign, ListTodo, MessageSquare, Send, CheckCircle, Circle, AlertCircle, Droplets, Ruler, ShoppingBag, Download, Loader2, Edit2, Check, MapPin, Navigation } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CropDetailsProps {
  crop: CropData;
  onBack: () => void;
  onUpdateCrop: (updatedCrop: CropData) => void;
}

export const CropDetails: React.FC<CropDetailsProps> = ({ crop, onBack, onUpdateCrop }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'finance' | 'timeline' | 'assistant'>('overview');
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'ai', text: string}[]>([
    { role: 'ai', text: `Olá! Sou seu assistente para a lavoura ${crop.name}. Como posso ajudar hoje?` }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  // @ts-ignore
  const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  
  // State for Finance Editing
  const [isEditingPrices, setIsEditingPrices] = useState(false);

  // Helper styles based on crop type - Expanded for 10 crops
  const getTheme = (type: string) => {
    switch(type) {
      case 'cafe': return { main: 'text-[#A67C52]', bg: 'bg-[#A67C52]', light: 'bg-[#FAF3E0] dark:bg-[#A67C52]/20' };
      case 'milho': return { main: 'text-orange-500', bg: 'bg-orange-500', light: 'bg-orange-50 dark:bg-orange-500/20' };
      case 'soja': return { main: 'text-yellow-500', bg: 'bg-yellow-500', light: 'bg-yellow-50 dark:bg-yellow-500/20' };
      case 'cana': return { main: 'text-green-600', bg: 'bg-green-600', light: 'bg-green-100 dark:bg-green-600/20' };
      case 'algodao': return { main: 'text-slate-500 dark:text-slate-300', bg: 'bg-slate-500', light: 'bg-slate-100 dark:bg-slate-500/20' };
      case 'arroz': return { main: 'text-yellow-600', bg: 'bg-yellow-400', light: 'bg-yellow-50 dark:bg-yellow-400/20' };
      case 'feijao': return { main: 'text-red-700', bg: 'bg-red-700', light: 'bg-red-50 dark:bg-red-700/20' };
      case 'trigo': return { main: 'text-amber-500', bg: 'bg-amber-500', light: 'bg-amber-50 dark:bg-amber-500/20' };
      case 'laranja': return { main: 'text-orange-600', bg: 'bg-orange-600', light: 'bg-orange-100 dark:bg-orange-600/20' };
      case 'mandioca': return { main: 'text-amber-800', bg: 'bg-amber-800', light: 'bg-amber-100 dark:bg-amber-800/20' };
      default: return { main: 'text-agro-green', bg: 'bg-agro-green', light: 'bg-green-50 dark:bg-green-900/20' };
    }
  };
  const theme = getTheme(crop.type);

  const toggleTask = (stageId: string, taskId: string) => {
    const updatedTimeline = crop.timeline.map(stage => {
      if (stage.id === stageId) {
        const updatedTasks = stage.tasks.map(task => 
          task.id === taskId ? { ...task, done: !task.done } : task
        );
        const allDone = updatedTasks.every(t => t.done);
        return { 
          ...stage, 
          tasks: updatedTasks, 
          status: allDone ? 'concluido' : 'em_andamento' 
        } as TimelineStage;
      }
      return stage;
    });
    onUpdateCrop({ ...crop, timeline: updatedTimeline });
  };

  const handleUpdateMaterial = (index: number, field: 'quantity' | 'unitPriceEstimate', value: string) => {
    const numValue = parseFloat(value);
    
    const updatedMaterials = [...crop.materials];
    const item = { ...updatedMaterials[index] };

    // Se o valor for inválido (vazio/NaN), assume 0 para evitar erros de cálculo, mas permite edição
    item[field] = isNaN(numValue) ? 0 : numValue;

    updatedMaterials[index] = item;

    // Recalculate Total Estimated Cost
    const newTotalCost = updatedMaterials.reduce((acc, m) => acc + (m.quantity * m.unitPriceEstimate), 0);

    onUpdateCrop({
      ...crop,
      materials: updatedMaterials,
      estimatedCost: newTotalCost
    });
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsChatLoading(true);

    const context = `Lavoura: ${crop.name}, Cultura: ${crop.type}, Fase atual: ${crop.timeline.find(t => t.status === 'em_andamento')?.title || 'Planejamento'}`;
    const response = await getAssistantResponse(userMsg, context);

    setChatHistory(prev => [...prev, { role: 'ai', text: response }]);
    setIsChatLoading(false);
  };

  const generatePDF = () => {
    setIsGeneratingPdf(true);
    const doc = new jsPDF();

    // Header
    doc.setFillColor(39, 174, 96); // Agro Green
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('MÃOS DO CAMPO', 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text('Relatório de Planejamento de Safra', 105, 22, { align: 'center' });

    // Info Section
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(14);
    doc.text(`Lavoura: ${crop.name}`, 14, 45);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Cultura: ${crop.type.toUpperCase()}`, 14, 52);
    doc.text(`Área: ${crop.areaHa} ha`, 60, 52);
    doc.text(`Solo: ${crop.soilType}`, 100, 52);
    doc.text(`Espaçamento: ${crop.spacing}`, 140, 52);

    doc.text(`Data Relatório: ${new Date().toLocaleDateString('pt-BR')}`, 14, 58);
    doc.text(`Previsão Colheita: ${new Date(crop.estimatedHarvestDate).toLocaleDateString('pt-BR')}`, 100, 58);

    // Financial Table
    doc.setFontSize(12);
    doc.setTextColor(39, 174, 96);
    doc.text('Resumo Financeiro e Materiais', 14, 70);

    const tableData = crop.materials.map(m => [
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
      foot: [['', '', '', 'TOTAL ESTIMADO:', `R$ ${crop.estimatedCost.toLocaleString('pt-BR')}`]],
      showFoot: 'lastPage'
    });

    // Timeline Section
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(12);
    doc.setTextColor(39, 174, 96);
    doc.text('Cronograma de Atividades', 14, finalY);

    let currentY = finalY + 10;
    
    crop.timeline.forEach((stage, index) => {
      // Check for page break
      if (currentY > 270) {
        doc.addPage();
        currentY = 20;
      }
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}. ${stage.title} (${stage.dateEstimate})`, 14, currentY);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      
      const descLines = doc.splitTextToSize(stage.description, 180);
      doc.text(descLines, 14, currentY + 5);
      
      currentY += 15 + (descLines.length * 4);
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Página ${i} de ${pageCount}`, 195, 290, { align: 'right' });
    }

    doc.save(`plano_${crop.name.replace(/\s+/g, '_').toLowerCase()}.pdf`);
    setIsGeneratingPdf(false);
  };

  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up">
       
       {/* Details Card */}
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

       {/* Map / Advice Card Column */}
       <div className="flex flex-col gap-6">
            {/* Recommendation Card */}
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
              {/* Decorative Blob */}
              <div className={`absolute -bottom-10 -right-10 w-40 h-40 rounded-full ${theme.bg} opacity-10 blur-2xl`}></div>
           </div>

           {/* Mini Map Card */}
           {crop.coordinates && (
             <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
                <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <MapPin className="text-agro-green" size={20}/> Localização
                </h3>
                <div className="relative w-full h-40 bg-gray-200 dark:bg-slate-700 rounded-xl overflow-hidden mb-4 group cursor-pointer">
                     <iframe
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        style={{ border: 0 }}
                        src={`https://www.google.com/maps/embed/v1/place?key=${mapsApiKey}&q=${crop.coordinates.lat},${crop.coordinates.lng}&maptype=satellite&zoom=15`}
                        allowFullScreen
                     ></iframe>
                     <a 
                       href={`https://www.google.com/maps/search/?api=1&query=${crop.coordinates.lat},${crop.coordinates.lng}`}
                       target="_blank"
                       rel="noreferrer"
                       className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"
                     />
                </div>
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
    const data = crop.materials.map(m => ({
        name: m.category,
        value: m.quantity * m.unitPriceEstimate
    })).reduce((acc: any[], curr) => {
        const found = acc.find(a => a.name === curr.name);
        if (found) found.value += curr.value;
        else acc.push(curr);
        return acc;
    }, []);

    return (
      <div className="space-y-6 animate-slide-up">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           {/* Chart Card */}
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
                   {crop.estimatedCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                 </p>
                 {isEditingPrices && <p className="text-xs text-agro-green animate-pulse">Atualizando...</p>}
               </div>
             </div>
           </div>

           {/* Receipt Card */}
           <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-800 dark:text-white text-xl flex items-center gap-2">
                   <ShoppingBag className="text-agro-green"/> Lista de Compras
                </h3>
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

              <div className="flex-1 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar bg-white dark:bg-slate-800">
                <div className="space-y-3">
                  {crop.materials.map((m, i) => (
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
                             </div>
                             <div className="flex items-center gap-1">
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
                               {(m.quantity * m.unitPriceEstimate).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
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
              
              {isEditingPrices && (
                 <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-xs rounded-xl flex items-center gap-2 border border-yellow-100 dark:border-yellow-900/30">
                    <AlertCircle size={16} />
                    <span>Edite preços e quantidades. O total atualiza automaticamente.</span>
                 </div>
              )}
           </div>
        </div>
      </div>
    );
  };

  const renderTimeline = () => (
    <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 animate-slide-up">
      <h3 className="font-bold text-xl text-gray-800 dark:text-white mb-8 pl-4">Linha do Tempo</h3>
      <div className="relative pl-8 border-l-2 border-gray-100 dark:border-slate-700 ml-4 space-y-10">
        {crop.timeline.map((stage, index) => (
          <div key={stage.id} className="relative group">
             {/* Timeline Dot */}
             <div className={`
               absolute -left-[43px] top-0 w-8 h-8 rounded-full border-4 border-white dark:border-slate-800 shadow-md flex items-center justify-center
               ${stage.status === 'concluido' ? 'bg-agro-green' : stage.status === 'em_andamento' ? 'bg-agro-yellow' : 'bg-gray-200 dark:bg-slate-600'}
             `}>
               {stage.status === 'concluido' && <CheckCircle size={14} className="text-white"/>}
               {stage.status === 'em_andamento' && <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>}
             </div>
             
             {/* Content */}
             <div className={`
                p-6 rounded-2xl border transition-all duration-300
                ${stage.status === 'em_andamento' ? 'bg-white dark:bg-slate-800 border-agro-yellow shadow-lg ring-1 ring-agro-yellow/20' : 'bg-gray-50/50 dark:bg-slate-900 border-gray-100 dark:border-slate-700'}
             `}>
               <div className="flex justify-between items-start mb-3">
                 <h4 className={`text-lg font-bold ${stage.status === 'em_andamento' ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>{stage.title}</h4>
                 <span className="text-xs font-bold font-mono bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 px-3 py-1 rounded-full text-gray-500 dark:text-gray-300 shadow-sm">
                   {stage.dateEstimate}
                 </span>
               </div>
               <p className="text-gray-500 dark:text-gray-400 mb-5 leading-relaxed">{stage.description}</p>
               
               <div className="grid gap-3">
                 {stage.tasks.map(task => (
                   <div key={task.id} 
                        onClick={() => toggleTask(stage.id, task.id)}
                        className={`
                          flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all border
                          ${task.done 
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/30' 
                            : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 hover:border-agro-green hover:shadow-md'}
                        `}>
                     <div className={`
                        w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0
                        ${task.done ? 'bg-agro-green border-agro-green' : 'border-gray-300 dark:border-slate-500'}
                     `}>
                        {task.done && <CheckCircle size={14} className="text-white"/>}
                     </div>
                     <span className={`text-sm font-medium ${task.done ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-700 dark:text-gray-200'}`}>
                       {task.text}
                     </span>
                   </div>
                 ))}
               </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );

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
               <div className={`
                 max-w-[85%] p-5 rounded-2xl text-sm leading-relaxed shadow-sm
                 ${msg.role === 'user' 
                    ? 'bg-agro-green text-white rounded-tr-sm' 
                    : 'bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-100 rounded-tl-sm border border-gray-100 dark:border-slate-600'}
               `}>
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
    <div className="space-y-6 pb-20">
      {/* Hero Header */}
      <div className={`rounded-3xl p-6 md:p-10 text-white shadow-xl ${theme.bg} relative overflow-hidden transition-all duration-500`}>
         <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <button onClick={onBack} className="p-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl transition-all">
                <ArrowLeft size={24} className="text-white"/>
              </button>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight">{crop.name}</h1>
                <p className="text-white/80 font-medium mt-1 flex items-center gap-2">
                   <span className="capitalize bg-white/20 px-2 py-0.5 rounded text-sm">{crop.type}</span> 
                   <span>•</span>
                   <span>{crop.areaHa} hectares</span>
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap md:flex-nowrap gap-2">
                <div className="flex gap-2 bg-white/10 p-1.5 rounded-2xl backdrop-blur-sm mr-2">
                  {[
                    { id: 'overview', label: 'Visão', icon: ListTodo },
                    { id: 'finance', label: 'Finanças', icon: DollarSign },
                    { id: 'timeline', label: 'Etapas', icon: Calendar },
                    { id: 'assistant', label: 'IA', icon: MessageSquare },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`
                        flex items-center gap-2 px-3 py-2 md:px-4 md:py-3 rounded-xl font-bold text-sm transition-all
                        ${activeTab === tab.id 
                          ? 'bg-white text-gray-900 shadow-lg scale-105' 
                          : 'text-white hover:bg-white/10'}
                      `}
                    >
                      <tab.icon size={18} />
                      <span className="hidden lg:inline">{tab.label}</span>
                    </button>
                  ))}
                </div>

                <button 
                  onClick={generatePDF}
                  disabled={isGeneratingPdf}
                  className="bg-white/90 hover:bg-white text-agro-green p-3 md:px-4 md:py-3 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2 disabled:opacity-70"
                >
                  {isGeneratingPdf ? <Loader2 size={18} className="animate-spin"/> : <Download size={18} />}
                  <span className="hidden sm:inline">Exportar PDF</span>
                </button>
            </div>
         </div>
         {/* Decorative Circles */}
         <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
         <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-black/10 rounded-full blur-2xl"></div>
      </div>

      {/* Content Area */}
      <div className="min-h-[500px]">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'finance' && renderFinance()}
        {activeTab === 'timeline' && renderTimeline()}
        {activeTab === 'assistant' && renderAssistant()}
      </div>
    </div>
  );
};