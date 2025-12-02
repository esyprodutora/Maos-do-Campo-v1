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

  const materials = crop.materials || [];
  const totalCostEstimated = crop.estimatedCost || 0;
  const totalCostReal = materials.reduce((acc, m) => acc + (m.realCost || 0), 0);
  const timeline = crop.timeline || [];
  const completedStages = timeline.filter(s => s.status === 'concluido').length;
  const totalStages = timeline.length;
  const stageProgress = totalStages > 0 ? (completedStages / totalStages) * 100 : 0;
  const logs = crop.harvestLogs || [];
  const totalHarvested = logs.reduce((acc, l) => acc + l.quantity, 0);

  const categoryData = materials.reduce((acc: any[], item) => {
    const existing = acc.find((i: any) => i.name === item.category);
    const value = item.realCost || (item.quantity || 0) * (item.unitPriceEstimate || 0);
    if (existing) existing.value += value;
    else acc.push({ name: item.category || 'Outros', value: value });
    return acc;
  }, []).map((i: any) => ({ ...i, name: (i.name.charAt(0).toUpperCase() + i.name.slice(1)) }));

  if (categoryData.length === 0) categoryData.push({ name: 'Sem dados', value: 1 });

  const costComparisonData = [
    { name: 'Estimado', valor: totalCostEstimated, color: '#94A3B8' },
    { name: 'Realizado', valor: totalCostReal, color: '#27AE60' },
  ];

  const storageData = logs.map(log => ({
      name: new Date(log.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      quantidade: log.quantity
  }));

  const COLORS = ['#27AE60', '#F2C94C', '#E67E22', '#2C3E50', '#8E44AD'];

  const generatePDF = () => {
    setIsGenerating(true);
    try {
        const doc = new jsPDF();
        doc.setFillColor(39, 174, 96);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text('MÃOS DO CAMPO', 105, 20, { align: 'center' });
        doc.setFontSize(12);
        doc.text('Relatório de Safra', 105, 32, { align: 'center' });
        
        doc.setTextColor(0);
        doc.setFontSize(12);
        doc.text(`Lavoura: ${crop.name}`, 14, 50);
        
        let currentY = 60;
        doc.text("Resumo Financeiro", 14, currentY);
        currentY += 10;
        doc.setFontSize(10);
        doc.text(`Custo Estimado: R$ ${totalCostEstimated.toLocaleString('pt-BR')}`, 14, currentY);
        currentY += 6;
        doc.text(`Custo Realizado: R$ ${totalCostReal.toLocaleString('pt-BR')}`, 14, currentY);
        
        doc.save(`relatorio_${crop.name}.pdf`);
    } catch (e) {
        console.error(e);
    } finally {
        setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 pb-24 animate-slide-up">
      <div className="bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col sm:flex-row gap-2 sticky top-0 z-10">
          <div className="flex overflow-x-auto no-scrollbar gap-1 flex-1 p-1">
             {[{ id: 'general', label: 'Geral', icon: PieIcon }, { id: 'financial', label: 'Financeiro', icon: DollarSign }, { id: 'stages', label: 'Etapas', icon: Layers }, { id: 'storage', label: 'Estoque', icon: Warehouse }].map(type => (
                 <button key={type.id} onClick={() => setReportType(type.id as any)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex-1 justify-center ${reportType === type.id ? 'bg-agro-green text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'}`}><type.icon size={18} /> {type.label}</button>
              ))}
          </div>
          <div className="flex gap-2 p-1">
            <button onClick={generatePDF} disabled={isGenerating} className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-70">{isGenerating ? <Loader2 size={18} className="animate-spin"/> : <Download size={18} />}<span className="hidden sm:inline">PDF</span></button>
          </div>
      </div>

      {reportType === 'general' && (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-green-100 relative"><p className="text-xs text-gray-500 font-bold uppercase">Custo Real</p><h3 className="text-xl font-extrabold mt-1">R$ {totalCostReal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</h3></div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-gray-100 relative"><p className="text-xs text-gray-500 font-bold uppercase">Etapas</p><h3 className="text-xl font-extrabold text-blue-600 mt-1">{stageProgress.toFixed(0)}%</h3></div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100"><h3 className="font-bold mb-6 text-lg">Visão Geral</h3><div className="h-72 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={costComparisonData} layout="vertical"><XAxis type="number" hide /><YAxis dataKey="name" type="category" width={70} /><Tooltip /><Bar dataKey="valor" radius={[0, 4, 4, 0]} barSize={30}><Cell fill="#94A3B8"/><Cell fill="#27AE60"/></Bar></BarChart></ResponsiveContainer></div></div>
        </div>
      )}
      {/* Placeholder for other tabs to keep file concise and stable */}
      {reportType === 'financial' && <div className="p-10 text-center text-gray-500">Relatório Financeiro Detalhado</div>}
      {reportType === 'stages' && <div className="p-10 text-center text-gray-500">Relatório de Etapas</div>}
      {reportType === 'storage' && <div className="p-10 text-center text-gray-500">Relatório de Estoque</div>}
    </div>
  );
};
