import React from 'react';
import { Check, Star, Zap, Crown, ShieldCheck } from 'lucide-react';

interface SubscriptionProps {
  onSubscribe: (planId: string) => void;
  onBack: () => void;
}

export const Subscription: React.FC<SubscriptionProps> = ({ onSubscribe, onBack }) => {
  
  const plans = [
    {
      id: 'monthly',
      name: 'Mensal',
      price: '29,90',
      period: '/mês',
      description: 'Para quem quer testar e ver resultados rápidos.',
      features: ['Até 5 Lavouras', 'Assistente IA Básico', 'Relatórios PDF Simples', 'Suporte por Email'],
      highlight: false,
      color: 'gray'
    },
    {
      id: 'semiannual',
      name: 'Semestral',
      price: '97,00',
      period: '/semestre',
      description: 'Ideal para acompanhar uma safra completa.',
      features: ['Lavouras Ilimitadas', 'IA Avançada (GPT-4)', 'Relatórios Detalhados', 'Prioridade no Suporte', 'Acesso Offline Completo'],
      highlight: true,
      tag: 'MAIS POPULAR • ECONOMIZE 46%',
      color: 'green'
    },
    {
      id: 'lifetime',
      name: 'Vitalício',
      price: '247,00',
      period: 'pagamento único',
      description: 'Acesso eterno. Pague uma vez, use para sempre.',
      features: ['Tudo do plano Semestral', 'Acesso Vitalício', 'Mentoria Mensal (Grupo)', 'Badge de Membro Fundador', 'Sem mensalidades nunca'],
      highlight: false,
      premium: true,
      color: 'gold'
    }
  ];

  return (
    <div className="animate-fade-in pb-20">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-12 pt-4">
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
          Invista na sua <span className="text-agro-green">Produtividade</span>
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-lg">
          Desbloqueie todo o potencial do Mãos do Campo. Escolha o plano ideal para o tamanho da sua produção.
        </p>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto px-4 align-stretch">
        {plans.map((plan) => (
          <div 
            key={plan.id}
            className={`
              relative flex flex-col p-8 rounded-3xl transition-all duration-300
              ${plan.highlight 
                ? 'bg-white dark:bg-slate-800 border-2 border-agro-green shadow-xl shadow-green-900/10 scale-100 lg:scale-110 z-10' 
                : plan.premium 
                  ? 'bg-slate-900 text-white border border-yellow-500/30 shadow-2xl shadow-yellow-900/20' 
                  : 'bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md'}
            `}
          >
            {/* Badges */}
            {plan.highlight && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-agro-green text-white px-4 py-1 rounded-full text-xs font-bold tracking-widest shadow-lg">
                {plan.tag}
              </div>
            )}
            {plan.premium && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-600 to-yellow-400 text-black px-4 py-1 rounded-full text-xs font-bold tracking-widest shadow-lg flex items-center gap-1">
                <Crown size={12} fill="currentColor" /> CLUBE VIP
              </div>
            )}

            {/* Plan Header */}
            <div className="mb-6">
              <h3 className={`text-xl font-bold mb-2 ${plan.premium ? 'text-yellow-400' : 'text-gray-900 dark:text-white'}`}>
                {plan.name}
              </h3>
              <p className={`text-sm ${plan.premium ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                {plan.description}
              </p>
            </div>

            {/* Price */}
            <div className="mb-8 flex items-end gap-1">
              <span className={`text-sm font-bold mb-1 ${plan.premium ? 'text-gray-400' : 'text-gray-400'}`}>R$</span>
              <span className={`text-5xl font-extrabold ${plan.premium ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                {plan.price}
              </span>
              <span className={`text-sm font-medium mb-1 ${plan.premium ? 'text-gray-500' : 'text-gray-400'}`}>
                {plan.period}
              </span>
            </div>

            {/* Features */}
            <ul className="space-y-4 mb-8 flex-1">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className={`mt-0.5 p-0.5 rounded-full ${plan.premium ? 'bg-yellow-500/20 text-yellow-500' : 'bg-green-100 dark:bg-green-900/30 text-agro-green'}`}>
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <span className={`text-sm font-medium ${plan.premium ? 'text-gray-300' : 'text-gray-600 dark:text-gray-300'}`}>
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            {/* CTA Button */}
            <button
              onClick={() => onSubscribe(plan.id)}
              className={`
                w-full py-4 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2
                ${plan.highlight 
                  ? 'bg-agro-green text-white hover:bg-green-700 shadow-lg shadow-green-600/30' 
                  : plan.premium
                    ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black hover:brightness-110 shadow-lg shadow-yellow-600/20'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-slate-600'}
              `}
            >
              {plan.premium ? <Crown size={18} /> : null}
              {plan.highlight ? 'Assinar Agora' : 'Selecionar Plano'}
            </button>
            
            {plan.id === 'semiannual' && (
              <p className="text-xs text-center text-agro-green mt-3 font-medium">
                Equivale a R$ 16,16 / mês
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Trust Badges */}
      <div className="mt-16 flex flex-wrap justify-center gap-8 text-gray-400 dark:text-gray-500 opacity-70">
        <div className="flex items-center gap-2">
          <ShieldCheck size={20} /> Pagamento 100% Seguro
        </div>
        <div className="flex items-center gap-2">
          <Zap size={20} /> Acesso Imediato
        </div>
        <div className="flex items-center gap-2">
          <Star size={20} /> Garantia de 7 dias
        </div>
      </div>
    </div>
  );
};