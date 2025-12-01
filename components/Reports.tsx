import React, { useState } from 'react';
import { CropData } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { Download, DollarSign, Layers, Warehouse, FileText, Filter } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportsProps {
  crop: CropData;
}

export const Reports: React.FC<ReportsProps> = ({ crop }) => {
  const [reportType, setReportType] = useState<'general' | 'financial' | 'stages' | 'storage'>('general');
  const [isGenerating, setIsGenerating] = useState(false);

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

  const COLORS = ['#27AE60', '#F2C94C', '#E67E22', '#2C3E50', '#8E44AD'];

  // --- Export PDF Logic ---
  const generatePDF = () => {
    setIsGenerating(true);
    const doc = new jsPDF();

    // Header Styles
    doc.setFillColor(39, 174, 96);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('MÃOS DO CAMPO', 105, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    let title = "Relatório Geral";
    if(reportType === 'financial') title = "Relatório Financeiro Detalhado";
    if(reportType === 'stages') title = "Relatório de Etapas e Cronograma";
    if(reportType === 'storage') title = "Relatório de Colheita e Armazenagem";
    doc.text(title, 105, 32, { align: 'center' });

    // Metadata
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(12);
    doc.text(`Lavoura: ${crop.name} (${crop.type})`, 14, 50);
    doc.text(`Área: ${crop.areaHa} ha`, 14, 56);
    doc.text(`Emissão: ${new Date().toLocaleDateString('pt-BR')}`, 150, 50);

    let finalY = 65;

    // Content based on Type
    if (reportType === 'general' || reportType === 'financial') {
        doc.setFontSize(14);
        doc.setTextColor(39, 174, 96);
        doc.text("Resumo Financeiro", 14, finalY);
        finalY += 5;
        
        const financeData = [
            ['Custo Estimado (IA)', `R$ ${totalCostEstimated.toLocaleString('pt-BR')}`],
            ['Custo Realizado', `R$ ${totalCostReal.toLocaleString('pt-BR')}`],
            ['Saldo', `R$ ${(totalCostEstimated - totalCostReal).toLocaleString('pt-BR')}`]
        ];
        
        autoTable(doc, {
            startY: finalY,
            head: [['Indicador', 'Valor']],
            body: financeData,
            theme: 'striped',
            headStyles: { fillColor: [39, 174, 96] }
        });
        finalY = (doc as any).lastAutoTable.finalY + 15;

        doc.text("Detalhamento de Materiais", 14, finalY);
        finalY += 5;
        const matData = materials.map(m => [
            m.name, 
            m.category, 
            `${m.quantity} ${m.unit}`, 
            `R$ ${m.unitPriceEstimate.toFixed(2)}`,
            `R$ ${m.realCost ? m.realCost.toFixed(2) : '-'}`
        ]);
        autoTable(doc, {
            startY: finalY,
            head: [['Item', 'Categoria', 'Qtd', 'Est. Unit', 'Pago Real']],
            body: matData,
            theme: 'grid'
        });
        finalY = (doc as any).lastAutoTable.finalY + 15;
    }

    if (reportType === 'general' || reportType === 'stages') {
        if (finalY > 250) { doc.addPage(); finalY = 20; }
        
        doc.setFontSize(14);
        doc.setTextColor(39, 174, 96);
        doc.text("Cronograma de Etapas", 14, finalY);
        finalY += 5;

        const stageData = timeline.map(s => [
            s.title,
            s.dateEstimate,
            s.endDate || '-',
            s.status.toUpperCase()
        ]);

        autoTable(doc, {
            startY: finalY,
            head: [['Etapa', 'Início Est.', 'Fim Real', 'Status']],
            body: stageData,
            theme: 'striped',
            headStyles: { fillColor: [242, 201, 76] }, // Yellow
            styles: { textColor: 50 }
        });
        finalY = (doc as any).lastAutoTable.finalY + 15;
    }

    if (reportType === 'general' || reportType === 'storage') {
        if (finalY > 250) { doc.addPage(); finalY = 20; }
        
        doc.setFontSize(14);
        doc.setTextColor(39, 174, 96);
        doc.text("Registro de Colheita", 14, finalY);
        finalY += 5;

        const logData = logs.map(l => [
            new Date(l.date).toLocaleDateString('pt-BR'),
            l.location,
            `${l.quantity} ${l.unit}`,
            l.qualityNote || '-'
        ]);

        autoTable(doc, {
            startY: finalY,
            head: [['Data', 'Local', 'Quantidade', 'Obs.']],
            body: logData,
            theme: 'striped',
            headStyles: { fillColor: [230, 126, 34] } // Orange
        });
        
        finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Total Colhido: ${totalHarvested.toLocaleString('pt-BR')} sc`, 14, finalY);
        doc.text(`Meta: ${totalExpected.toLocaleString('pt-BR')} sc`, 100, finalY);
    }

    doc.save(`relatorio_${reportType}_${crop.name}.pdf`);
    setIsGenerating(false);
  };

  return (
    <div className="space-y-6 pb-24 animate-slide-up">
      
      {/* --- HEADER DE CONTROLE --- */}
      <div className="bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col sm:flex-row gap-2">
          <div className="flex overflow-x-auto no-scrollbar gap-1 flex-1 p-1">
             {[
                 { id: 'general', label: 'Geral', icon: PieIcon },
                 { id: 'financial', label: 'Financeiro', icon: DollarSign },
                 { id: 'stages', label: 'Etapas', icon: Layers },
                 { id: 'storage', label: 'Armazenagem', icon: Warehouse },
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
                    <type.icon size={16} /> {type.label}
                 </button>
             ))}
          </div>
          <button 
            onClick={generatePDF}
            disabled={isGenerating}
            className="mx-2 mb-2 sm:mb-0 sm:mx-0 px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
             <Download size={18} /> {isGenerating ? 'Gerando...' : 'PDF'}
          </button>
      </div>

      {/* --- CONTEÚDO DINÂMICO --- */}
      <div className="space-y-6">
        
        {/* --- FINANCIAL VIEW --- */}
        {(reportType === 'general' || reportType === 'financial') && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-6 text-lg flex items-center gap-2">
                        <DollarSign className="text-agro-green"/> Fluxo Financeiro
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={costComparisonData} layout="vertical" margin={{ left: 20 }}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" tick={{fontSize: 12}} width={80} />
                                <Tooltip cursor={{fill: 'transparent'}} formatter={(val: number) => `R$ ${val.toLocaleString('pt-BR')}`} />
                                <Bar dataKey="valor" radius={[0, 4, 4, 0]} barSize={40}>
                                    {costComparisonData.map((entry, index) => (
                                        <Cell key={index} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-6 text-lg">Breakdown de Custos</h3>
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
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(val: number) => `R$ ${val.toLocaleString('pt-BR')}`} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        )}

        {/* --- STAGES VIEW --- */}
        {(reportType === 'general' || reportType === 'stages') && (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
                <h3 className="font-bold text-gray-800 dark:text-white mb-6 text-lg flex items-center gap-2">
                    <Layers className="text-agro-yellow"/> Progresso da Safra
                </h3>
                <div className="space-y-4">
                    <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-4 overflow-hidden">
                        <div className="h-full bg-agro-green transition-all duration-1000" style={{ width: `${stageProgress}%` }}></div>
                    </div>
                    <div className="grid gap-3">
                        {timeline.map((stage, i) => (
                            <div key={i} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${stage.status === 'concluido' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                    <span className="font-medium text-sm text-gray-700 dark:text-gray-200">{stage.title}</span>
                                </div>
                                <span className="text-xs font-mono text-gray-500">{stage.dateEstimate}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* --- STORAGE VIEW --- */}
        {(reportType === 'general' || reportType === 'storage') && (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
                <h3 className="font-bold text-gray-800 dark:text-white mb-6 text-lg flex items-center gap-2">
                    <Warehouse className="text-orange-500"/> Colheita Acumulada
                </h3>
                {storageData.length > 0 ? (
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={storageData}>
                                <XAxis dataKey="name" tick={{fontSize: 10}} />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="quantidade" fill="#E67E22" radius={[4, 4, 0, 0]} name="Sacas" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="text-center py-10 text-gray-400">
                        <p>Nenhum dado de colheita para exibir.</p>
                    </div>
                )}
            </div>
        )}

      </div>
    </div>
  );
};
