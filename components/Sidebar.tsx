import React, { useEffect, useState } from 'react';
import { LayoutDashboard, PlusCircle, Settings, LogOut, Crown, TrendingUp, Leaf } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const [userEmail, setUserEmail] = useState<string>('Produtor');

  useEffect(() => {
    if (supabase) {
      supabase.auth.getUser().then(({ data }) => {
        if (data.user?.email) {
          setUserEmail(data.user.email.split('@')[0]);
        }
      });
    }
  }, []);

  const handleLogout = async () => {
    localStorage.clear();
    localStorage.removeItem('sb-hzgnvkbwytoyszfmybfq-auth-token');
    try {
        if (supabase) {
            await supabase.auth.signOut();
        }
    } catch (error) {
        console.error("Erro ao desconectar do servidor:", error);
    } finally {
        window.location.reload();
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Painel Geral', icon: LayoutDashboard },
    { id: 'quotes', label: 'Cotações', icon: TrendingUp },
    { id: 'new-crop', label: 'Nova Lavoura', icon: PlusCircle },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  const handleNav = (id: string) => {
    setActiveTab(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-agro-dark dark:bg-slate-950 text-white transform transition-transform duration-300 ease-out shadow-2xl
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:h-screen md:shadow-none flex flex-col justify-between
      `}>
        <div>
          {/* Logo Section - PADRONIZADA */}
          <div className="p-8 flex items-center gap-3">
            <div className="bg-gradient-to-br from-agro-green to-emerald-600 p-2.5 rounded-xl shadow-lg shadow-green-900/20">
              <Leaf className="text-white" size={28} fill="currentColor" />
            </div>
            <div>
              <h1 className="font-bold text-xl leading-none tracking-tight text-white">MÃOS DO<br/><span className="text-agro-yellow">CAMPO</span></h1>
            </div>
          </div>

          {/* Navigation */}
          <nav className="px-4 space-y-2 mt-4">
            {menuItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`
                    relative flex items-center w-full p-4 rounded-xl transition-all duration-300 group
                    ${isActive 
                      ? 'bg-gradient-to-r from-agro-green to-agro-greenDark text-white shadow-lg shadow-green-900/20' 
                      : 'text-gray-400 hover:bg-white/10 hover:text-white'}
                  `}
                >
                  <item.icon size={22} className={`mr-3 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-white transition-colors'}`} />
                  <span className="font-semibold tracking-wide">{item.label}</span>
                  
                  {isActive && (
                    <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Premium CTA & User Profile */}
        <div className="p-4 m-4 space-y-4">
          <button 
            onClick={() => handleNav('subscription')}
            className="w-full relative overflow-hidden group p-4 rounded-2xl bg-gradient-to-r from-gray-900 to-black border border-yellow-500/30 shadow-lg transition-all hover:scale-[1.02]"
          >
            <div className="absolute inset-0 bg-yellow-500/10 group-hover:bg-yellow-500/20 transition-colors"></div>
            <div className="relative flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg text-yellow-400">
                <Crown size={20} fill="currentColor" />
              </div>
              <div className="text-left">
                <p className="text-white font-bold text-sm leading-tight">Seja Premium</p>
                <p className="text-yellow-500/80 text-[10px] uppercase font-bold tracking-wider">Desbloqueie Tudo</p>
              </div>
            </div>
          </button>

          <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-agro-yellow flex items-center justify-center text-agro-brown font-bold text-lg capitalize">
                {userEmail.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate capitalize">{userEmail}</p>
                <p className="text-xs text-gray-400 truncate">Produtor Ativo</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center justify-center w-full py-2.5 rounded-lg border border-white/20 text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              <LogOut size={16} className="mr-2" />
              Sair do App
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
