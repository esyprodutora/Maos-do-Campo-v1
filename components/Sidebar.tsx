
import React, { useEffect, useState } from 'react';
import { LayoutDashboard, PlusCircle, Settings, LogOut, User, ChevronRight } from 'lucide-react';
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
    // 1. Tenta avisar o Supabase (sem travar se falhar)
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error("Erro ao sair do Supabase", e);
      }
    }
    
    // 2. Limpeza Nuclear (Garante que dados antigos sumam)
    localStorage.clear(); 
    sessionStorage.clear();

    // 3. Recarrega a página ATUAL (Evita erro de redirecionamento "Sad Face")
    window.location.reload();
  };

  const menuItems = [
    { id: 'dashboard', label: 'Painel Geral', icon: LayoutDashboard },
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
        fixed inset-y-0 left-0 z-50 w-72 bg-agro-dark text-white transform transition-transform duration-300 ease-out shadow-2xl
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:h-screen md:shadow-none flex flex-col justify-between
      `}>
        <div>
          {/* Logo Section */}
          <div className="p-8 flex items-center gap-3">
            <div className="bg-gradient-to-br from-agro-green to-emerald-600 p-2.5 rounded-xl shadow-lg shadow-green-900/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <path d="M7 20h10" />
                <path d="M10 20c5.5-2.5.8-6.4 3-10" />
                <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z" />
                <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z" />
              </svg>
            </div>
            <div>
              <h1 className="font-bold text-xl leading-none tracking-tight">MÃOS DO<br/><span className="text-agro-yellow">CAMPO</span></h1>
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

        {/* Footer / User Profile */}
        <div className="p-4 m-4 bg-white/5 rounded-2xl border border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-agro-yellow flex items-center justify-center text-agro-brown font-bold text-lg capitalize">
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate capitalize">{userEmail}</p>
              <p className="text-xs text-gray-400 truncate">Produtor Ativo</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center w-full py-2.5 rounded-lg border border-white/20 text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white hover:border-white/40 transition-all cursor-pointer"
          >
            <LogOut size={16} className="mr-2" />
            Sair do App
          </button>
        </div>
      </aside>
    </>
  );
};
