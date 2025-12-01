import React, { useState, useEffect } from 'react';
import {
  Home,
  DollarSign,
  ListTodo,
  MessageSquare,
  Send,
  CheckCircle,
  Circle,
  AlertCircle,
  Droplets,
  Ruler,
  ShoppingBag,
  Loader2,
  Trash2,
  Warehouse,
  FileText,
} from 'lucide-react';
import { Reports } from './Reports';
import { CropData, TimelineStage, Material, HarvestLog } from '../types';
import { getAssistantResponse } from '../services/geminiService';
import { getCurrentPrice } from '../services/marketService';

// -------------------------------------------------------
// Componente Principal
// -------------------------------------------------------

const CropDetails = ({
  crop,
  onDeleteCrop,
  onUpdateCrop,
  generatePDF,
  isGeneratingPdf,
}: {
  crop: CropData;
  onDeleteCrop: () => void;
  onUpdateCrop: (data: CropData) => void;
  generatePDF: () => void;
  isGeneratingPdf: boolean;
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'finance' | 'timeline' | 'storage' | 'assistant' | 'reports'>('overview');
  const [assistantMessages, setAssistantMessages] = useState<any[]>([]);
  const [assistantInput, setAssistantInput] = useState('');
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);

  // -------------------------------------------------------
  // HANDLER DO ASSISTENTE IA
  // -------------------------------------------------------
  const handleAssistantSend = async () => {
    if (!assistantInput.trim()) return;

    const userMessage = { role: 'user', content: assistantInput };
    setAssistantMessages((prev) => [...prev, userMessage]);
    setAssistantInput('');
    setIsAssistantLoading(true);

    try {
      const response = await getAssistantResponse(crop, assistantInput);
      const aiMessage = { role: 'assistant', content: response };
      setAssistantMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      setAssistantMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Ocorreu um erro ao processar sua solicitação.' },
      ]);
    }

    setIsAssistantLoading(false);
  };

  // -------------------------------------------------------
  // RENDER: OVERVIEW
  // -------------------------------------------------------
  const renderOverview = () => (
    <div className="animate-fade-in px-2 py-6">
      <h2 className="text-xl font-bold mb-4">Visão Geral</h2>
      <p className="text-gray-700">
        Aqui você pode ver um resumo da lavoura, custos, produção e andamento geral.
      </p>
    </div>
  );

  // -------------------------------------------------------
  // RENDER: FINANCE
  // -------------------------------------------------------
  const renderFinance = () => (
    <div className="px-2 py-6 animate-fade-in">
      <h2 className="text-xl font-bold mb-4">Finanças</h2>

      <div className="flex gap-6 mb-6">
        <div className="bg-white rounded-xl shadow p-5 w-full">
          <h3 className="text-sm text-gray-500 font-medium">Custo Total</h3>
          <p className="text-4xl font-bold text-agro-green">
            R$ {crop.totalCost?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-5 w-full">
          <h3 className="text-sm text-gray-500 font-medium">Lucro Previsto</h3>
          <p className="text-4xl font-bold text-agro-green">
            R$ {crop.expectedProfit?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>
    </div>
  );

  // -------------------------------------------------------
  // RENDER: TIMELINE
  // -------------------------------------------------------
  const renderTimeline = () => (
    <div className="px-2 py-6 animate-fade-in">
      <h2 className="text-xl font-bold mb-6">Etapas da Lavoura</h2>

      <div className="space-y-4">
        {crop.timeline?.map((stage: TimelineStage, index: number) => (
          <div key={index} className="p-4 bg-white rounded-xl shadow border border-gray-200/70">
            <div className="flex items-center gap-3 mb-2">
              {stage.completed ? (
                <CheckCircle className="text-agro-green" size={20} />
              ) : (
                <Circle className="text-gray-400" size={20} />
              )}
              <h3 className="font-semibold text-lg">{stage.title}</h3>
            </div>
            <p className="text-gray-600">{stage.description}</p>
          </div>
        ))}
      </div>
    </div>
  );

  // -------------------------------------------------------
  // RENDER: STORAGE / ARMAZENAGEM
  // -------------------------------------------------------
  const renderStorage = () => {
    const totalHarvested =
      crop.harvestLogs?.reduce((sum: number, log: HarvestLog) => sum + log.amount, 0) || 0;

    return (
      <div className="px-2 py-6 animate-fade-in">
        <h2 className="text-xl font-bold mb-4">Armazenagem</h2>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200/70">
          <h3 className="text-sm font-medium text-gray-500">Total Armazenado</h3>
          <span className="text-5xl font-extrabold">
            {totalHarvested.toLocaleString('pt-BR', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })}
          </span>
          <span className="text-gray-600 ml-1 text-xl font-semibold">kg</span>
        </div>
      </div>
    );
  };

  // -------------------------------------------------------
  // RENDER: ASSISTENTE IA
  // -------------------------------------------------------
  const renderAssistant = () => (
    <div className="px-2 py-6 animate-fade-in">
      <h2 className="text-xl font-bold mb-4">Assistente IA</h2>

      <div className="bg-white rounded-xl p-4 shadow max-h-[500px] overflow-y-auto mb-4">
        {assistantMessages.map((msg, i) => (
          <div
            key={i}
            className={`mb-3 p-3 rounded-xl ${
              msg.role === 'user' ? 'bg-agro-green text-white ml-auto w-fit' : 'bg-gray-100 w-fit'
            }`}
          >
            {msg.content}
          </div>
        ))}

        {isAssistantLoading && (
          <div className="p-3 bg-gray-100 rounded-xl w-fit">
            <Loader2 size={18} className="animate-spin inline-block mr-2" />
            Processando…
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <input
          type="text"
          value={assistantInput}
          onChange={(e) => setAssistantInput(e.target.value)}
          className="flex-1 border rounded-xl p-3 outline-none"
          placeholder="Pergunte algo ao assistente…"
        />

        <button
          onClick={handleAssistantSend}
          className="p-3 bg-agro-green text-white rounded-xl active:scale-95"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );

  // -------------------------------------------------------
  // COMPONENTE FINAL — TELAS, TABS E NAVEGAÇÃO
  // -------------------------------------------------------

  return (
    <div className="relative p-4">

      {/* HEADER */}
      <div className="bg-agro-green text-white rounded-3xl p-8 shadow relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">

          <div>
            <h1 className="text-3xl font-bold">{crop.name}</h1>
            <p className="text-white/80">Detalhes da produção e acompanhamento.</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Botão IA */}
            <button
              onClick={() => setActiveTab('assistant')}
              className="flex items-center gap-2 px-4 py-2 bg-white text-agro-green rounded-full shadow-lg active:scale-95 hover:scale-105 border border-white/20 font-bold text-xs"
            >
              <MessageSquare size={18} />
              Assistente IA
            </button>

            {/* Botão excluir */}
            <button
              onClick={onDeleteCrop}
              className="p-2 bg-white/10 hover:bg-red-500/80 text-white rounded-xl transition-all border border-white/10"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>

        <div className="hidden md:flex gap-2 mt-6 pb-2 overflow-x-auto">
          {[
            { id: 'overview', label: 'Home', icon: Home },
            { id: 'finance', label: 'Finanças', icon: DollarSign },
            { id: 'timeline', label: 'Etapas', icon: ListTodo },
            { id: 'storage', label: 'Armazenagem', icon: Warehouse },
            {
              id: 'reports',
              label: 'Relatório',
              icon: FileText,
              action: generatePDF,
              loading: isGeneratingPdf,
            },
          ].map((tab) => {
            if (tab.id === 'reports') {
              return (
                <button
                  key={tab.id}
                  onClick={tab.action}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm bg-white/10 text-white hover:bg-white/20"
                >
                  {tab.loading ? <Loader2 size={16} className="animate-spin" /> : <tab.icon size={16} />}{' '}
                  {tab.label}
                </button>
              );
            }

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm ${
                  activeTab === tab.id ? 'bg-white text-gray-900' : 'bg-white/10 text-white'
                }`}
              >
                <tab.icon size={16} /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* CONTEÚDO */}
      <div className="min-h-[500px] animate-slide-up px-1 pb-24">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'finance' && renderFinance()}
        {activeTab === 'timeline' && renderTimeline()}
        {activeTab === 'storage' && renderStorage()}
        {activeTab === 'assistant' && renderAssistant()}
        {activeTab === 'reports' && <Reports crop={crop} />}
      </div>

      {/* NAV BOTTOM MOBILE */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl flex justify-around items-center py-3 px-1">
        {[
          { id: 'overview', label: 'Home', icon: Home },
          { id: 'finance', label: 'Finanças', icon: DollarSign },
          { id: 'timeline', label: 'Etapas', icon: ListTodo },
          { id: 'storage', label: 'Silo', icon: Warehouse },
          { id: 'reports', label: 'Relatório', icon: FileText },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl min-w-[60px] transition-all ${
                isActive ? 'text-agro-green scale-105' : 'text-gray-400'
              }`}
            >
              <tab.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[9px] font-bold">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CropDetails;
