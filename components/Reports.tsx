
import React, { useState } from 'react';
import { CropData } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, CartesianGrid } from 'recharts';
import { Download, DollarSign, Layers, Warehouse, PieChart as PieIcon, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';

interface ReportsProps {
  crop: CropData;
}

export const Reports: React.FC<ReportsProps> = ({ crop }) => {
  const [reportType, setReportType] = useState<'general' | 'financial' | 'stages' | 'storage'>('general');
  const [isGenerating, setIsGenerating] = useState(false);

  // --- Data Processing (Calculated from Timeline) ---
  const totalCostEstimated = crop.estimatedCost || 0;
  
  // Calculate total Real Cost by aggregating all timeline resources
  let totalCostReal = 0;
  const categoryBreakdown: any = {};
  
  crop.timeline?.forEach(stage => {
      stage.resources?.forEach(res => {
          totalCostReal += res.totalCost;
          const type = res.type;
          if(!categoryBreakdown[type]) categoryBreakdown[type] = 0;
          categoryBreakdown[type] += res.totalCost;
      });
  });
  
  const categoryData = Object.keys(categoryBreakdown).map(key => ({
      name: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
      value: categoryBreakdown[key]
  }));

  if (categoryData.length === 0) {
      categoryData.push({ name: 'Sem dados', value: 1 });
  }

  const timeline = crop.timeline || [];
  const completedStages = timeline.filter(s => s.status === 'concluido').length;
  const totalStages = timeline.length;
  const stageProgress = totalStages > 0 ? (completedStages / totalStages) * 100 : 0;

  const logs = crop.harvestLogs || [];
  const totalHarvested = logs.reduce((acc, l) => acc + l.quantity, 0);

  const costComparisonData = [
    { name: 'Previsto', valor: totalCostEstimated, color: '#94A3B8' },
    { name: 'Calculado', valor: totalCostReal, color: '#27AE60' },
  ];

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
        doc.text('Relatório Operacional', 105, 32, { align: 'center' });

        // Info
        doc.setTextColor(60, 60, 60);
        doc.text(`Lavoura: ${crop.name} (${crop.type})`, 14, 50);
        doc.text(`Área: ${crop.areaHa} ha`, 14, 56);
        doc.text(`Emissão: ${new Date().toLocaleDateString()}`, 14, 62);

        // Financial
        doc.setFontSize(14);
        doc.setTextColor(39, 174, 96);
        doc.text(`Resumo Financeiro`, 14, 75);
        
        doc.setTextColor(0);
        doc.setFontSize(10);
        doc.text(`Custo Total Calculado: R$ ${totalCostReal.toLocaleString('pt-BR')}`, 14, 85);
        
        // Stages
        let y = 100;
        doc.setFontSize(14);
        doc.setTextColor(39, 174, 96);
        doc.text(`Etapas e Custos`, 14, y);
        y += 10;

        doc.setFontSize(10);
        doc.setTextColor(0);
        
        crop.timeline?.forEach((stage, index) => {
            if (y > 270) { doc.addPage(); y = 20; }
            const stageCost = stage.resources?.reduce((a,b) => a + b.totalCost, 0) || 0;
            doc.setFont(undefined, 'bold');
            doc.text(`${index + 1}. ${stage.title} - R$ ${stageCost.toLocaleString('pt-BR')}`, 14, y);
            y += 6;
            doc.setFont(undefined, 'normal');
            doc.text(`${stage.description.substring(0, 90)}...`, 14, y);
            y += 10;
        });

        doc.save(`relatorio_${crop.name}.pdf`);
    } catch (e) {
        console.error("Erro ao gerar PDF", e);
        alert("Erro ao gerar PDF.");
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
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">Custo Total</p>
                    <h3 className="text-xl font-extrabold text-gray-900 dark:text-white mt-1">
                        R$ {totalCostReal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                    </h3>
                </div>
                {/* KPI 2 */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 relative overflow-hidden">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">Progresso</p>
                    <h3 className="text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
                        {stageProgress.toFixed(0)}%
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

      {/* FINANCIAL */}
      {reportType === 'financial' && (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
                <h3 className="font-bold text-gray-800 dark:text-white mb-6 text-lg">Distribuição por Tipo</h3>
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
                            <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
