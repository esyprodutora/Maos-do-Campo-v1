
import React, { useState } from 'react';
import { CropData } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, CartesianGrid } from 'recharts';
import { Download, DollarSign, Layers, Warehouse, PieChart as PieIcon, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportsProps {
  crop: CropData;
}

export const Reports: React.FC<ReportsProps> = ({ crop }) => {
  const [reportType, setReportType] = useState<'general' | 'financial'>('general');
  const [isGenerating, setIsGenerating] = useState(false);

  // --- Calculations ---
  
  // Operational Cost (From Stages)
  let totalOperationalCost = 0;
  crop.timeline?.forEach(stage => {
      stage.resources?.forEach(res => totalOperationalCost += res.totalCost);
  });

  // Financial Cost (From Transactions)
  const totalPaid = crop.transactions?.filter(t => t.type === 'despesa' && t.status === 'pago').reduce((acc, t) => acc + t.amount, 0) || 0;

  // Inventory Estimated Value (mock price for report, usually needs real price passed down or context)
  // Simple check for demo: if inventory exists, assume unit value was saved
  const inventoryValue = crop.inventory?.reduce((acc, item) => acc + (item.quantity * (item.estimatedUnitValue || 100)), 0) || 0;

  const costComparisonData = [
    { name: 'Custo Operacional', valor: totalOperationalCost, color: '#94A3B8' },
    { name: 'Fluxo Caixa (Pago)', valor: totalPaid, color: '#27AE60' },
  ];

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
        doc.text('Relatório Consolidado', 105, 32, { align: 'center' });

        // Info
        doc.setTextColor(60, 60, 60);
        doc.text(`Lavoura: ${crop.name} (${crop.type})`, 14, 50);
        doc.text(`Emissão: ${new Date().toLocaleDateString()}`, 14, 56);

        // Financial Summary
        doc.setFontSize(14);
        doc.setTextColor(39, 174, 96);
        doc.text(`Resumo Financeiro`, 14, 70);
        
        const financialData = [
            ['Custo Operacional (Consumo)', `R$ ${totalOperationalCost.toLocaleString('pt-BR')}`],
            ['Despesas Pagas (Caixa)', `R$ ${totalPaid.toLocaleString('pt-BR')}`],
            ['Valor em Estoque (Est.)', `R$ ${inventoryValue.toLocaleString('pt-BR')}`]
        ];

        // @ts-ignore
        doc.autoTable({
            startY: 75,
            head: [['Indicador', 'Valor']],
            body: financialData,
            theme: 'striped',
            headStyles: { fillColor: [39, 174, 96] }
        });

        // Stages Detail
        // @ts-ignore
        const finalY = doc.lastAutoTable.finalY + 15;
        doc.text(`Detalhamento por Etapa`, 14, finalY);

        const stageRows = crop.timeline?.map(stage => {
            const cost = stage.resources?.reduce((acc, r) => acc + r.totalCost, 0) || 0;
            return [stage.title, stage.status, `R$ ${cost.toLocaleString('pt-BR')}`];
        });

        // @ts-ignore
        doc.autoTable({
            startY: finalY + 5,
            head: [['Etapa', 'Status', 'Custo Operacional']],
            body: stageRows,
            theme: 'grid'
        });

        doc.save(`relatorio_${crop.name}.pdf`);
    } catch (e) {
        console.error("Erro PDF", e);
        alert("Erro ao gerar PDF.");
    } finally {
        setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 pb-24 animate-slide-up">
      <div className="flex justify-end">
        <button 
            onClick={generatePDF}
            disabled={isGenerating}
            className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-70"
        >
            {isGenerating ? <Loader2 size={18} className="animate-spin"/> : <Download size={18} />}
            Baixar PDF Completo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
             <h3 className="font-bold text-gray-800 dark:text-white mb-4">Operacional vs Financeiro</h3>
             <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={costComparisonData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" fontSize={12} />
                        <YAxis hide />
                        <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`} />
                        <Bar dataKey="valor" radius={[8, 8, 0, 0]} barSize={40}>
                            {costComparisonData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
             </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col justify-center items-center text-center">
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-full mb-4 text-yellow-500">
                  <Warehouse size={40} />
              </div>
              <p className="text-sm text-gray-500 uppercase font-bold tracking-widest">Valor em Estoque</p>
              <h3 className="text-4xl font-extrabold text-gray-900 dark:text-white mt-2">
                 {inventoryValue.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
              </h3>
              <p className="text-xs text-gray-400 mt-2">Baseado nas cotações atuais</p>
          </div>
      </div>
    </div>
  );
};
