import React, { useState } from 'react';
import { CropData } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, 
  PieChart, Pie, Legend, CartesianGrid 
} from 'recharts';
import { 
  Download, DollarSign, Layers, Warehouse, PieChart as PieIcon, 
  Filter, ChevronDown, AlertCircle, TrendingUp, Loader2 
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportsProps {
  crop: CropData;
}

export const Reports: React.FC<ReportsProps> = ({ crop }) => {
  const [reportType, setReportType] = useState<'general' | 'financial' | 'stages' | 'storage'>('general');
  const [isGenerating, setIsGenerating] = useState(false);
  const [period, setPeriod] = useState('safra'); // Simplificado

  // --- Data Processing (Safe Checks) ---
  const materials = crop.materials || [];
  const totalCostEstimated = crop.estimatedCost || 0;
  const totalCostReal = materials.reduce((acc, m) => acc + (m.realCost || 0), 0);
  
  const timeline = crop.timeline || [];
  const completedStages = timeline.filter(s => s.status === 'concluido').length;
  const totalStages = timeline.length;
  const stageProgress = totalStages > 0 ? (completedStages / totalStages) * 100 : 0;

  const logs = crop.harvestLogs || [];
  const totalHarvested = logs.reduce((acc, l) => acc + l.quantity, 0);
  const goalValue = parseFloat((crop.productivityGoal || '0').replace(/[^0-9.]/g, '')) || 0;
  const totalExpected = goalValue * crop.areaHa;
  const harvestProgress = totalExpected > 0 ? (totalHarvested / totalExpected) * 100 : 0;

  // Mock Revenue
  const mockPrice = 120; 
  const revenue = totalHarvested * mockPrice;
  const profit = revenue - totalCostReal;

  const categoryData = materials.reduce((acc: any[], item) => {
    const existing = acc.find((i: any) => i.name === item.category);
    const value = item.realCost || (item.quantity || 0) * (item.unitPriceEstimate || 0);
    if (existing) {
      existing.value += value;
    } else {
      acc.push({ name: item.category || 'Outros', value: value });
    }
    return acc;
  }, []).map((i: any) => ({ 
      ...i, 
      name: (i.name.charAt(0).toUpperCase() + i.name.slice(1)) 
  }));

  // Fallback if empty
  if (categoryData.length === 0) {
      categoryData.push({ name: 'Sem dados', value: 1 });
  }

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
    try {
        const doc = new jsPDF();

        // Header
        doc.setFillColor(39, 174, 96);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text('MÃOS DO CAMPO', 105, 20, { align: 'center' });
        
        doc.setFontSize(12);
        doc.text('Relatório de Safra', 105, 32, { align: 'center' });

        // Info
        doc.setTextColor(60, 60, 60);
        doc.setFontSize(12);
        doc.text(`Lavoura: ${crop.name}`, 14, 50);
        doc.text(`Emissão: ${new Date().toLocaleDateString()}`, 14, 56);

        let currentY = 70;

        // Table based on current view
        if (reportType === 'general' || reportType === 'financial') {
            doc.text("Resumo Financeiro", 14, currentY);
            currentY += 10;
            
            autoTable(doc, {
                startY: currentY,
                head: [['Item', 'Valor']],
                body: [
                    ['Estimado', `R$ ${totalCostEstimated.toLocaleString('pt-BR')}`],
                    ['Realizado', `R$ ${totalCostReal.toLocaleString('pt-BR')}`]
                ]
            });
             // @ts-ignore
            currentY = doc.lastAutoTable.finalY + 20;
        }

        doc.save(`relatorio_${crop.name}.pdf`);
    } catch (e) {
        console.error("Erro ao gerar PDF", e);
        alert("Erro ao gerar PDF. Tente novamente.");
    } finally {
        setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 pb-24 animate-slide-up">
      
      {/* Controls */}
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
                            ? 'bg-agro-green text-white shadow-md' 
                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'}
                    `}
                  >
                    <type.icon size={18} /> {type.label}
                  </button>
              ))}
          </div>
          
          <div className="flex gap-2 p-1">
            <button 
                onClick={generatePDF}
                disabled={isGenerating}
                className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-70"
            >
                {isGenerating ? <Loader2 size={18} className="animate-spin"/> : <Download size={18} />}
                <span className="hidden sm:inline">PDF</span>
            </button>
          </div>
      </div>

      {/* --- DASHBOARD --- */}
      
      {/* GENERAL */}
      {reportType === 'general' && (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* KPI 1 */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-green-100 dark:border-slate-700 relative overflow-hidden">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">Custo Real</p>
                    <h3 className="text-xl font-extrabold text-gray-900 dark:text-white mt-1">
                        R$ {totalCostReal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                    </h3>
                </div>
                {/* KPI 2 */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 relative overflow-hidden">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">Etapas</p>
                    <h3 className="text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
                        {stageProgress.toFixed(0)}%
                    </h3>
                </div>
                 {/* KPI 3 */}
                 <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 relative overflow-hidden">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">Colheita</p>
                    <h3 className="text-xl font-extrabold text-orange-600 dark:text-orange-400 mt-1">
                        {totalHarvested} sc
                    </h3>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
                <h3 className="font-bold text-gray-800 dark:text-white mb-6 text-lg">Visão Geral de Custos</h3>
                <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={costComparisonData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" tick={{fontSize: 12}} width={70} />
                            <Tooltip />
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

      {/* FINANCIAL */}
      {reportType === 'financial' && (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
                <h3 className="font-bold text-gray-800 dark:text-white mb-6 text-lg">Distribuição</h3>
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
                            >
                                {categoryData.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
      )}

      {/* STAGES */}
      {reportType === 'stages' && (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 animate-fade-in">
              <h3 className="font-bold text-gray-800 dark:text-white mb-6 text-lg">Cronograma</h3>
              <div className="space-y-4">
                  {timeline.map((stage, i) => (
                      <div key={i} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                          <span className="font-medium text-sm text-gray-700 dark:text-gray-200">{stage.title}</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${stage.status === 'concluido' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                              {stage.status.toUpperCase()}
                          </span>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* STORAGE */}
      {reportType === 'storage' && (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 animate-fade-in">
               <h3 className="font-bold text-gray-800 dark:text-white mb-6 text-lg">Colheita</h3>
               {storageData.length > 0 ? (
                   <div className="h-64 w-full">
                       <ResponsiveContainer width="100%" height="100%">
                           <BarChart data={storageData}>
                               <CartesianGrid strokeDasharray="3 3" vertical={false} />
                               <XAxis dataKey="name" tick={{fontSize: 10}} />
                               <YAxis />
                               <Tooltip />
                               <Bar dataKey="quantidade" fill="#E67E22" radius={[4, 4, 0, 0]} />
                           </BarChart>
                       </ResponsiveContainer>
                   </div>
               ) : (
                   <div className="text-center py-10 text-gray-400">Nenhum dado.</div>
               )}
          </div>
      )}

    </div>
  );
};
