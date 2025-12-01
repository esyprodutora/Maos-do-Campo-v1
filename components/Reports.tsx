import React, { useState } from 'react';
import { CropData } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, LineChart, Line, CartesianGrid } from 'recharts';
import { Download, Calendar, TrendingUp, DollarSign, PieChart as PieIcon, FileText, Filter, ChevronDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportsProps {
  crop: CropData;
}

export const Reports: React.FC<ReportsProps> = ({ crop }) => {
  const [period, setPeriod] = useState<'safra' | '30d' | '90d'>('safra');

  // Processamento de dados reais da lavoura
  const materials = crop.materials || [];
  const totalCost = crop.estimatedCost || 0;
  
  // Simulação de "Executado" vs "Planejado" baseado no progresso da timeline
  const completedStages = (crop.timeline || []).filter(s => s.status === 'concluido').length;
  const totalStages = (crop.timeline || []).length;
  const progress = totalStages > 0 ? completedStages / totalStages : 0;
  const executedCost = totalCost * progress; 

  // Dados para o Gráfico de Pizza (Categorias)
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

  // Dados para Gráfico de Barras (Previsto vs Realizado)
  const comparisonData = [
    { name: 'Planejado', valor: totalCost, color: '#94A3B8' },
    { name: 'Executado', valor: executedCost, color: '#27AE60' },
  ];

  const COLORS = ['#27AE60', '#F2C94C', '#E67E22', '#2C3E50', '#8E44AD'];

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Header Elegante
    doc.setFillColor(39, 174, 96);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('MÃOS DO CAMPO', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Relatório de Desempenho da Lavoura', 105, 30, { align: 'center' });

    // Info da Lavoura
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Lavoura: ${crop.name}`, 14, 55);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Cultura: ${crop.type.toUpperCase()}`, 14, 62);
    doc.text(`Área: ${crop.areaHa} ha`, 60, 62);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 150, 62);

    // Resumo Financeiro
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(14, 70, 182, 25, 2, 2, 'F');
    
    doc.setFontSize(10);
    doc.text('Custo Total Planejado', 20, 80);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(39, 174, 96);
    doc.text(`R$ ${totalCost.toLocaleString('pt-BR')}`, 20, 88);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text('Executado (Estimado)', 100, 80);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`R$ ${executedCost.toLocaleString('pt-BR')}`, 100, 88);

    // Tabela de Materiais
    doc.setFontSize(12);
    doc.setTextColor(39, 174, 96);
    doc.text('Detalhamento de Insumos', 14, 110);

    const tableBody = materials.map(m => [
        m.name,
        m.category,
        `${m.quantity} ${m.unit}`,
        `R$ ${m.unitPriceEstimate.toFixed(2)}`,
        `R$ ${(m.quantity * m.unitPriceEstimate).toFixed(2)}`
    ]);

    autoTable(doc, {
        startY: 115,
        head: [['Item', 'Categoria', 'Qtd', 'Unit.', 'Total']],
        body: tableBody,
        theme: 'striped',
        headStyles: { fillColor: [39, 174, 96] },
        styles: { fontSize: 9 },
        foot: [['', '', '', 'TOTAL:', `R$ ${totalCost.toLocaleString('pt-BR')}`]]
    });

    doc.save(`relatorio_${crop.name}.pdf`);
  };

  return (
    <div className="space-y-6 pb-24 animate-slide-up">
      
      {/* Controls Header */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4">
          
          <div className="flex bg-gray-100 dark:bg-slate-700 p-1 rounded-xl w-full sm:w-auto">
              <button 
                onClick={() => setPeriod('safra')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all ${period === 'safra' ? 'bg-white dark:bg-slate-600 text-agro-green shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
              >
                Safra Atual
              </button>
              <button 
                onClick={() => setPeriod('90d')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all ${period === '90d' ? 'bg-white dark:bg-slate-600 text-agro-green shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
              >
                90 Dias
              </button>
              <button 
                onClick={() => setPeriod('30d')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all ${period === '30d' ? 'bg-white dark:bg-slate-600 text-agro-green shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
              >
                30 Dias
              </button>
          </div>

          <button 
            onClick={generatePDF}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-agro-green text-white rounded-xl font-bold hover:bg-green-700 transition-all active:scale-95 shadow-lg shadow-green-600/20"
          >
            <Download size={18} /> Exportar PDF
          </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5"><DollarSign size={48}/></div>
             <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Custo Total</p>
             <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">
                {totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
             </h3>
             <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-bold inline-block mt-2">Planejado</span>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5"><TrendingUp size={48}/></div>
             <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Executado</p>
             <h3 className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
                {executedCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
             </h3>
             <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-bold inline-block mt-2">{(progress * 100).toFixed(0)}% do Total</span>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5"><PieIcon size={48}/></div>
             <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Maior Gasto</p>
             <h3 className="text-lg font-extrabold text-gray-900 dark:text-white mt-2 truncate">
                {categoryData.sort((a,b) => b.value - a.value)[0]?.name || '-'}
             </h3>
             <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-orange-500 w-3/4 rounded-full"></div>
             </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5"><Calendar size={48}/></div>
             <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Colheita</p>
             <h3 className="text-xl font-extrabold text-gray-900 dark:text-white mt-2">
                {new Date(crop.estimatedHarvestDate).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
             </h3>
             <p className="text-xs text-gray-400 mt-1">Estimativa IA</p>
          </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Cost Distribution */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
             <h3 className="font-bold text-gray-800 dark:text-white mb-6 text-lg">Para onde vai o dinheiro?</h3>
             <div className="h-64 w-full">
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
                   <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`}
                   />
                 </PieChart>
               </ResponsiveContainer>
             </div>
             <div className="flex flex-wrap justify-center gap-3 mt-4">
                {categoryData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                        {entry.name}
                    </div>
                ))}
             </div>
          </div>

          {/* Plan vs Actual */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
             <h3 className="font-bold text-gray-800 dark:text-white mb-6 text-lg">Planejado vs Executado</h3>
             <div className="h-64 w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={comparisonData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                   <XAxis type="number" hide />
                   <YAxis dataKey="name" type="category" tick={{fontSize: 12}} width={70} />
                   <Tooltip 
                      cursor={{fill: 'transparent'}}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`}
                   />
                   <Bar dataKey="valor" radius={[0, 4, 4, 0]} barSize={30}>
                      {comparisonData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                   </Bar>
                 </BarChart>
               </ResponsiveContainer>
             </div>
             <div className="mt-4 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                <p>
                    Você executou cerca de <strong>{(progress * 100).toFixed(0)}%</strong> do orçamento previsto. 
                    Mantenha o controle dos lançamentos para não estourar o caixa na reta final da safra.
                </p>
             </div>
          </div>

      </div>
    </div>
  );
};
