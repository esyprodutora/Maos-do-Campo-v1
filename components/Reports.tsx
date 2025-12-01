import React, { useState } from 'react';
import { CropData } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { Download, Calendar, TrendingUp, DollarSign, PieChart as PieIcon, FileText, Filter, ChevronDown, Warehouse, Layers, AlertCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportsProps {
  crop: CropData;
}

export const Reports: React.FC<ReportsProps> = ({ crop }) => {
  const [period, setPeriod] = useState<'safra' | '30d' | '90d'>('safra');
  const [reportType, setReportType] = useState<'general' | 'financial' | 'stages' | 'storage'>('general');

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

  // Financial Data for Charts
  const categoryData = materials.reduce((acc: any[], item) => {
    const existing = acc.find(i => i.name === item.category);
    const value = (item.quantity || 0) * (item.unitPriceEstimate || 0);
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

  // Storage Data
  const storageData = logs.map(log => ({
      name: new Date(log.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      quantidade: log.quantity
  }));

  const COLORS = ['#27AE60', '#F2C94C', '#E67E22', '#2C3E50', '#8E44AD'];

  // --- Export Function ---
  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(39, 174, 96);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('MÃOS DO CAMPO', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Relatório Geral de Desempenho', 105, 30, { align: 'center' });

    // Info
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Lavoura: ${crop.name}`, 14, 55);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Cultura: ${crop.type.toUpperCase()}`, 14, 62);
    doc.text(`Área: ${crop.areaHa} ha`, 60, 62);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 150, 62);

    // Financial Summary
    doc.text('FINANCEIRO', 14, 75);
    doc.setLineWidth(0.5);
    doc.line(14, 77, 196, 77);
    
    const financeBody = [
        ['Custo Estimado', `R$ ${totalCostEstimated.toLocaleString('pt-BR')}`],
        ['Custo Realizado', `R$ ${totalCostReal.toLocaleString('pt-BR')}`],
        ['Diferença', `R$ ${(totalCostEstimated - totalCostReal).toLocaleString('pt-BR')}`]
    ];
    autoTable(doc, { startY: 80, head: [['Métrica', 'Valor']], body: financeBody, theme: 'striped' });

    // Harvest Summary
    let finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.text('COLHEITA & ARMAZENAGEM', 14, finalY);
    doc.line(14, finalY + 2, 196, finalY + 2);

    const harvestBody = [
        ['Meta Total', `${totalExpected.toLocaleString('pt-BR')} sc`],
        ['Colhido', `${totalHarvested.toLocaleString('pt-BR')} sc`],
        ['Progresso', `${harvestProgress.toFixed(1)}%`]
    ];
    autoTable(doc, { startY: finalY + 5, head: [['Métrica', 'Valor']], body: harvestBody, theme: 'striped' });

    doc.save(`relatorio_completo_${crop.name}.pdf`);
  };

  return (
    <div className="space-y-6 pb-24 animate-slide-up">
      
      {/* Controls & Filter */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col lg:flex-row justify-between items-center gap-4">
          
          {/* Report Type Tabs */}
          <div className="flex overflow-x-auto no-scrollbar gap-2 w-full lg:w-auto bg-gray-50 dark:bg-slate-900 p-1 rounded-xl">
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
                        flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap
                        ${reportType === type.id 
                            ? 'bg-white dark:bg-slate-700 text-agro-green shadow-sm' 
                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'}
                    `}
                  >
                    <type.icon size={16} /> {type.label}
                  </button>
              ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3 w-full lg:w-auto">
             {/* Period Filter - Visual Only for MVP */}
             <div className="relative">
                 <select 
                    value={period}
                    onChange={(e) => setPeriod(e.target.value as any)}
                    className="appearance-none bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 pl-4 pr-10 py-2.5 rounded-xl text-sm font-bold border-none focus:ring-2 focus:ring-agro-green/20 cursor-pointer"
                 >
                     <option value="safra">Safra Atual</option>
                     <option value="90d">Últimos 90 dias</option>
                     <option value="30d">Últimos 30 dias</option>
                 </select>
                 <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
             </div>

             <button 
                onClick={generatePDF}
                className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-agro-green text-white rounded-xl font-bold hover:bg-green-700 transition-all active:scale-95 shadow-lg shadow-green-600/20"
             >
                <Download size={18} /> <span className="hidden sm:inline">PDF</span>
             </button>
          </div>
      </div>

      {/* --- GENERAL REPORT --- */}
      {reportType === 'general' && (
        <div className="space-y-6 animate-fade-in">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5"><DollarSign size={48}/></div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Investimento</p>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white mt-1">
                        {totalCostReal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                    </h3>
                    <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-bold inline-block mt-2">Realizado</span>
                </div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5"><Layers size={48}/></div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Etapas</p>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
                        {stageProgress.toFixed(0)}%
                    </h3>
                    <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-bold inline-block mt-2">Concluído</span>
                </div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5"><Warehouse size={48}/></div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Colheita</p>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-orange-600 dark:text-orange-400 mt-1">
                        {totalHarvested.toLocaleString('pt-BR')} <span className="text-sm font-medium text-gray-400">sc</span>
                    </h3>
                    <span className="text-[10px] text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full font-bold inline-block mt-2">{harvestProgress.toFixed(0)}% da Meta</span>
                </div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5"><AlertCircle size={48}/></div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Eficiência</p>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-purple-600 dark:text-purple-400 mt-1">
                        Alta
                    </h3>
                    <span className="text-[10px] text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full font-bold inline-block mt-2">IA Score</span>
                </div>
            </div>

            {/* General Chart */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
                <h3 className="font-bold text-gray-800 dark:text-white mb-6 text-lg">Visão Geral de Custos</h3>
                <div className="h-64 w-full">
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
                            <Bar dataKey="valor" radius={[0, 4, 4, 0]} barSize={30}>
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

      {/* --- FINANCIAL REPORT --- */}
      {reportType === 'financial' && (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
                <h3 className="font-bold text-gray-800 dark:text-white mb-6 text-lg">Distribuição por Categoria</h3>
                <div className="h-72 w-full">
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
                                label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
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
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
                <h3 className="font-bold text-gray-800 dark:text-white mb-4 text-lg">Detalhamento</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-slate-700 dark:text-gray-400">
                            <tr>
                                <th className="px-6 py-3 rounded-l-lg">Item</th>
                                <th className="px-6 py-3">Categoria</th>
                                <th className="px-6 py-3 text-right rounded-r-lg">Total (Est)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {materials.map((m, i) => (
                                <tr key={i} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{m.name}</td>
                                    <td className="px-6 py-4">{m.category}</td>
                                    <td className="px-6 py-4 text-right">
                                        {((m.quantity || 0) * (m.unitPriceEstimate || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}

      {/* --- STAGES REPORT --- */}
      {reportType === 'stages' && (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 animate-fade-in">
              <h3 className="font-bold text-gray-800 dark:text-white mb-6 text-lg">Cronograma de Atividades</h3>
              <div className="space-y-8 relative pl-4 border-l-2 border-gray-100 dark:border-slate-700">
                  {timeline.map((stage, i) => (
                      <div key={i} className="relative">
                          <div className={`absolute -left-[21px] top-0 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 ${stage.status === 'concluido' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <div className="mb-1 flex items-center gap-2">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded ${stage.status === 'concluido' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                  {stage.status.toUpperCase()}
                              </span>
                              <span className="text-xs text-gray-400">{stage.dateEstimate}</span>
                          </div>
                          <h4 className="text-md font-bold text-gray-900 dark:text-white">{stage.title}</h4>
                          <p className="text-sm text-gray-500 mt-1">{stage.description}</p>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* --- STORAGE REPORT --- */}
      {reportType === 'storage' && (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 animate-fade-in">
               <h3 className="font-bold text-gray-800 dark:text-white mb-6 text-lg">Entradas de Colheita</h3>
               {storageData.length > 0 ? (
                   <div className="h-64 w-full">
                       <ResponsiveContainer width="100%" height="100%">
                           <BarChart data={storageData}>
                               <CartesianGrid strokeDasharray="3 3" vertical={false} />
                               <XAxis dataKey="name" tick={{fontSize: 12}} />
                               <YAxis />
                               <Tooltip />
                               <Bar dataKey="quantidade" fill="#E67E22" radius={[4, 4, 0, 0]} name="Sacas" />
                           </BarChart>
                       </ResponsiveContainer>
                   </div>
               ) : (
                   <div className="text-center py-10 text-gray-400">
                       <p>Nenhum dado de colheita registrado ainda.</p>
                   </div>
               )}
          </div>
      )}

    </div>
  );
};
