import React, { useState } from 'react';
import { CropData } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, LineChart, Line, CartesianGrid } from 'recharts';
import { Download, DollarSign, Layers, Warehouse, FileText, Filter, ChevronDown, TrendingUp, Calendar, AlertCircle, PieChart as PieIcon } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportsProps {
  crop: CropData;
}

export const Reports: React.FC<ReportsProps> = ({ crop }) => {
  const [reportType, setReportType] = useState<'general' | 'financial' | 'stages' | 'storage'>('general');
  const [isGenerating, setIsGenerating] = useState(false);
  const [period, setPeriod] = useState<'safra' | '30d' | '90d'>('safra');

  // --- Data Processing ---
  const materials = crop.materials || [];
  const totalCostEstimated = crop.estimatedCost || 0;
  const totalCostReal = materials.reduce((acc, m) => acc + (m.realCost || 0), 0);
  
  const timeline = crop.timeline || [];
  const completedStages = timeline.filter(s => s.status === 'concluido').length;
  const totalStages = timeline.length;
  const stageProgress = totalStages > 0 ? (completedStages / totalStages) * 100 : 0;

  const logs = crop.harvestLogs || [];
  const totalHarvested = logs.reduce((acc, l) => acc + l.quantity, 0);
  const goalValue = parseFloat(crop.productivityGoal.replace(/[^0-9.]/g, '')) || 0;
  const totalExpected = goalValue * crop.areaHa;
  const harvestProgress = totalExpected > 0 ? (totalHarvested / totalExpected) * 100 : 0;

  // Mock Revenue Calculation (Simplified)
  // In a real app, we would fetch current price from marketService here or pass as prop
  const mockPrice = 120; // Example price
  const revenue = totalHarvested * mockPrice;
  const profit = revenue - totalCostReal;

  const categoryData = materials.reduce((acc: any[], item) => {
    const existing = acc.find(i => i.name === item.category);
    const value = item.realCost || (item.quantity || 0) * (item.unitPriceEstimate || 0);
    if (existing) {
      existing.value += value;
    } else {
      acc.push({ name: item.category, value: value });
    }
    return acc;
  }, []).map(i => ({ ...i, name: i.name.charAt(0).toUpperCase() + i.name.slice(1) }));

  const costComparisonData = [
    { name: 'Estimado', valor: totalCostEstimated, color: '#94A3B8' },
    { name: 'Realizado', valor: totalCostReal, color: '#27AE60' },
  ];

  const storageData = logs.map(log => ({
      name: new Date(log.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      quantidade: log.quantity
  }));

  const COLORS = ['#27AE60', '#F2C94C', '#E67E22', '#2C3E50', '#8E44AD'];

  // --- Export PDF Logic ---
  const generatePDF = () => {
    setIsGenerating(true);
    const doc = new jsPDF();

    // Header
    doc.setFillColor(39, 174, 96);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('MÃOS DO CAMPO', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    let title = "Relatório Geral de Safra";
    if(reportType === 'financial') title = "Relatório Financeiro Detalhado";
    if(reportType === 'stages') title = "Relatório de Cronograma e Etapas";
    if(reportType === 'storage') title = "Relatório de Colheita e Estoque";
    doc.text(title, 105, 32, { align: 'center' });

    // Info Section
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(12);
    doc.text(`Lavoura: ${crop.name} (${crop.type})`, 14, 50);
    doc.setFontSize(10);
    doc.text(`Área: ${crop.areaHa} ha`, 14, 56);
    doc.text(`Emissão: ${new Date().toLocaleDateString('pt-BR')}`, 14, 62);

    let currentY = 70;

    // 1. Financeiro
    if (reportType === 'general' || reportType === 'financial') {
        doc.setFontSize(14);
        doc.setTextColor(39, 174, 96);
        doc.text("Resumo Financeiro", 14, currentY);
        currentY += 5;

        const financeSummary = [
            ['Custo Estimado', `R$ ${totalCostEstimated.toLocaleString('pt-BR')}`],
            ['Custo Realizado', `R$ ${totalCostReal.toLocaleString('pt-BR')}`],
            ['Diferença', `R$ ${(totalCostEstimated - totalCostReal).toLocaleString('pt-BR')}`]
        ];

        autoTable(doc, {
            startY: currentY,
            head: [['Indicador', 'Valor']],
            body: financeSummary,
            theme: 'striped',
            headStyles: { fillColor: [39, 174, 96] },
            margin: { top: 10 }
        });
        
        currentY = (doc as any).lastAutoTable.finalY + 15;

        // Materiais Detalhados
        if (currentY > 250) { doc.addPage(); currentY = 20; }
        doc.text("Detalhamento de Insumos", 14, currentY);
        currentY += 5;

        const matData = materials.map(m => [
            m.name, 
            m.category, 
            `${m.quantity} ${m.unit}`, 
            `R$ ${m.realCost ? m.realCost.toFixed(2) : '0.00'}`
        ]);

        autoTable(doc, {
            startY: currentY,
            head: [['Item', 'Categoria', 'Qtd', 'Pago Real']],
            body: matData,
            theme: 'grid',
            styles: { fontSize: 8 }
        });
        currentY = (doc as any).lastAutoTable.finalY + 15;
    }

    // 2. Etapas
    if (reportType === 'general' || reportType === 'stages') {
        if (currentY > 240) { doc.addPage(); currentY = 20; }
        
        doc.setFontSize(14);
        doc.setTextColor(39, 174, 96);
        doc.text("Cronograma de Atividades", 14, currentY);
        currentY += 5;

        const stageData = timeline.map(s => [
            s.title,
            s.dateEstimate,
            s.status.toUpperCase(),
            s.endDate || '-'
        ]);

        autoTable(doc, {
            startY: currentY,
            head: [['Etapa', 'Início Previsto', 'Status', 'Fim Real']],
            body: stageData,
            theme: 'striped',
            headStyles: { fillColor: [242, 201, 76], textColor: 50 } 
        });
        currentY = (doc as any).lastAutoTable.finalY + 15;
    }

    // 3. Colheita
    if (reportType === 'general' || reportType === 'storage') {
        if (currentY > 240) { doc.addPage(); currentY = 20; }

        doc.setFontSize(14);
        doc.setTextColor(39, 174, 96);
        doc.text("Registro de Colheita", 14, currentY);
        currentY += 5;

        const harvestData = logs.map(l => [
            new Date(l.date).toLocaleDateString('pt-BR'),
            l.location,
            `${l.quantity} ${l.unit}`,
            l.qualityNote || '-'
        ]);

        if (harvestData.length > 0) {
            autoTable(doc, {
                startY: currentY,
                head: [['Data', 'Local', 'Qtd', 'Obs']],
                body: harvestData,
                theme: 'striped',
                headStyles: { fillColor: [230, 126, 34] } 
            });
            currentY = (doc as any).lastAutoTable.finalY + 10;
        } else {
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text("(Nenhum registro de colheita)", 14, currentY + 10);
            currentY += 20;
        }

        if (currentY > 270) { doc.addPage(); currentY = 20; }
        doc.setFontSize(10);
        doc.setTextColor(0);
        doc.text(`Total Colhido: ${totalHarvested.toLocaleString('pt-BR')} sc`, 14, currentY);
    }

    // Salvar
    doc.save(`relatorio_${reportType}_${crop.name.replace(/\s+/g, '_').toLowerCase()}.pdf`);
    setIsGenerating(false);
  };

  return (
    <div className="space-y-8 pb-24 animate-slide-up">
      
      {/* --- HEADER DE CONTROLE --- */}
      <div className="bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col sm:flex-row gap-2 sticky top-0 z-10">
          <div className="flex overflow-x-auto no-scrollbar gap-1 flex-1 p-1">
             {[
                 { id: 'general', label: 'Geral', icon: PieIcon },
                 { id: 'financial', label: 'Financeiro', icon: DollarSign },
                 { id: 'stages', label: 'Etapas', icon: Layers },
                 { id: 'storage', label: 'Estoque', icon: Warehouse },
             ].map(type => (
                 <button
                    key={type.id}
                    onClick={() => setReportType(type.id as any)}
                    className={`
                        flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex-1 justify-center
                        ${reportType === type.id 
                            ? 'bg-agro-green text-white shadow-md scale-105' 
                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'}
                    `}
                  >
                    <type.icon size={18} /> {type.label}
                  </button>
              ))}
          </div>
          
          <div className="flex gap-2 p-1">
            <select 
                value={period}
                onChange={(e) => setPeriod(e.target.value as any)}
                className="bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300 text-sm font-bold rounded-xl px-3 py-2 border-none outline-none cursor-pointer"
            >
                <option value="safra">Safra Atual</option>
                <option value="90d">90 Dias</option>
                <option value="30d">30 Dias</option>
            </select>
            <button 
                onClick={generatePDF}
                disabled={isGenerating}
                className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-70"
            >
                {isGenerating ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div> : <Download size={18} />}
                <span className="hidden sm:inline">PDF</span>
            </button>
          </div>
      </div>

      {/* --- DASHBOARD DINÂMICO --- */}
      
      {/* 1. RELATÓRIO GERAL */}
      {reportType === 'general' && (
        <div className="space-y-6 animate-fade-in">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-white to-green-50 dark:from-slate-800 dark:to-slate-900 p-5 rounded-3xl shadow-sm border border-green-100 dark:border-slate-700 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-agro-green"><DollarSign size={64}/></div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Custo Real</p>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white mt-1 truncate">
                        {totalCostReal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                    </h3>
                    <div className="mt-3 w-full bg-gray-200 dark:bg-slate-700 rounded-full h-1.5">
                        <div className="bg-agro-green h-1.5 rounded-full" style={{width: `${Math.min((totalCostReal/totalCostEstimated)*100, 100)}%`}}></div>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 text-right">of {totalCostEstimated.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 relative overflow-hidden">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Etapas</p>
                    <div className="flex items-end gap-2 mt-1">
                        <h3 className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">{stageProgress.toFixed(0)}%</h3>
                        <span className="text-xs text-gray-400 mb-1">Concluído</span>
                    </div>
                    <div className="flex gap-1 mt-3">
                         {Array.from({length: 5}).map((_, i) => (
                             <div key={i} className={`h-1.5 flex-1 rounded-full ${i < (stageProgress/20) ? 'bg-blue-500' : 'bg-gray-100 dark:bg-slate-700'}`}></div>
                         ))}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 relative overflow-hidden">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Colheita</p>
                    <h3 className="text-2xl font-extrabold text-orange-500 dark:text-orange-400 mt-1">
                        {totalHarvested.toLocaleString('pt-BR')} <span className="text-sm font-medium text-gray-400">sc</span>
                    </h3>
                    <p className="text-xs text-green-600 mt-2 font-bold bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-lg inline-block">
                        +{(harvestProgress).toFixed(1)}% da Meta
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 relative overflow-hidden">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Lucro Est.</p>
                    <h3 className={`text-2xl font-extrabold mt-1 ${profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {profit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                    </h3>
                    <p className="text-[10px] text-gray-400 mt-2">Baseado em cotação atual</p>
                </div>
            </div>

            {/* Overview Chart */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
                <h3 className="font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                    <TrendingUp className="text-blue-500" size={20}/> Burn Down (Gastos)
                </h3>
                <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={costComparisonData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" tick={{fontSize: 12}} width={70} />
                            <Tooltip 
                                cursor={{fill: 'transparent'}}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`}
                            />
                            <Bar dataKey="valor" radius={[0, 6, 6, 0]} barSize={40}>
                                {costComparisonData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
      )}

      {/* 2. RELATÓRIO FINANCEIRO */}
      {reportType === 'financial' && (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
                <h3 className="font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
                    <DollarSign className="text-green-500"/> Detalhamento de Custos
                </h3>
                <p className="text-sm text-gray-500 mb-6">Comparativo de gastos por categoria de insumo.</p>
                
                <div className="flex flex-col lg:flex-row items-center gap-8">
                    <div className="h-64 w-full lg:w-1/2">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`} />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    
                    <div className="w-full lg:w-1/2 space-y-3">
                        {categoryData.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[idx % COLORS.length]}}></div>
                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{item.name}</span>
                                </div>
                                <span className="text-sm font-mono font-bold text-gray-900 dark:text-white">
                                    R$ {item.value.toLocaleString('pt-BR', {maximumFractionDigits: 0})}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-3xl border border-blue-100 dark:border-blue-900/50">
                <div className="flex gap-4">
                    <AlertCircle className="text-blue-500 shrink-0" />
                    <div>
                        <h4 className="font-bold text-blue-700 dark:text-blue-300 mb-1">Análise de Fluxo</h4>
                        <p className="text-sm text-blue-600 dark:text-blue-400 leading-relaxed">
                            Seus custos com {categoryData.sort((a,b) => b.value - a.value)[0]?.name} representam a maior fatia do orçamento. 
                            Considere cotar fornecedores alternativos para a próxima safra.
                        </p>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* 3. RELATÓRIO DE ETAPAS */}
      {reportType === 'stages' && (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 animate-fade-in">
              <h3 className="font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                  <Layers className="text-blue-500"/> Cronograma de Atividades
              </h3>
              <div className="space-y-8 relative pl-6 border-l-2 border-gray-100 dark:border-slate-700 ml-2">
                  {timeline.map((stage, i) => (
                      <div key={i} className="relative">
                          <div className={`absolute -left-[31px] top-0 w-6 h-6 rounded-full border-4 border-white dark:border-slate-800 shadow-sm ${stage.status === 'concluido' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <div className="bg-gray-50 dark:bg-slate-700/30 p-4 rounded-2xl border border-gray-100 dark:border-slate-700/50">
                              <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-bold text-gray-900 dark:text-white">{stage.title}</h4>
                                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${stage.status === 'concluido' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                                      {stage.status}
                                  </span>
                              </div>
                              <p className="text-sm text-gray-500 mb-3">{stage.description}</p>
                              <div className="flex gap-4 text-xs text-gray-400">
                                  <span className="flex items-center gap-1"><Calendar size={12}/> Est: {stage.dateEstimate}</span>
                                  {stage.endDate && <span className="flex items-center gap-1 text-green-600 font-bold"><Check size={12}/> Real: {stage.endDate}</span>}
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* 4. RELATÓRIO DE ARMAZENAGEM */}
      {reportType === 'storage' && (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 animate-fade-in">
               <div className="flex justify-between items-center mb-6">
                   <h3 className="font-bold text-gray-800 dark:text-white text-lg flex items-center gap-2">
                        <Warehouse className="text-orange-500"/> Evolução da Colheita
                   </h3>
                   <div className="text-right">
                       <p className="text-xs text-gray-400 uppercase font-bold">Total</p>
                       <p className="text-xl font-extrabold text-gray-900 dark:text-white">{totalHarvested.toLocaleString('pt-BR')} sc</p>
                   </div>
               </div>

               {storageData.length > 0 ? (
                   <div className="h-72 w-full">
                       <ResponsiveContainer width="100%" height="100%">
                           <BarChart data={storageData} margin={{top: 20, right: 30, left: 20, bottom: 5}}>
                               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                               <XAxis dataKey="name" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                               <YAxis axisLine={false} tickLine={false} />
                               <Tooltip 
                                    cursor={{fill: '#F8FAFC'}}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                               />
                               <Bar dataKey="quantidade" fill="#E67E22" radius={[6, 6, 0, 0]} name="Sacas Colhidas" barSize={50} />
                           </BarChart>
                       </ResponsiveContainer>
                   </div>
               ) : (
                   <div className="flex flex-col items-center justify-center py-16 bg-gray-50 dark:bg-slate-700/30 rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-700">
                       <Warehouse className="text-gray-300 mb-3" size={48} />
                       <p className="text-gray-400 font-medium">Nenhum registro de colheita encontrado.</p>
                       <p className="text-xs text-gray-400 mt-1">Adicione cargas na aba "Armazenagem".</p>
                   </div>
               )}
          </div>
      )}

    </div>
  );
};
