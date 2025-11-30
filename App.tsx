
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { NewCropForm } from './components/NewCropForm';
import { CropDetails } from './components/CropDetails';
import { Login } from './components/Login';
import { Subscription } from './components/Subscription';
import { Quotes } from './components/Quotes';
import { CropData } from './types';
import { Menu, Loader2, WifiOff, RefreshCw, Sun, Moon } from 'lucide-react';
import { supabase } from './services/supabaseClient';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Theme State
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'light';
    }
    return 'light';
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCrop, setSelectedCrop] = useState<CropData | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [crops, setCrops] = useState<CropData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Apply Theme
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Check Auth
  useEffect(() => {
    if(supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setAuthLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
      });

      return () => subscription.unsubscribe();
    } else {
        setAuthLoading(false); 
    }
  }, []);

  // Load Data when session exists
  useEffect(() => {
    if (session) {
      fetchCrops();
    }
  }, [session]);

  const fetchCrops = async () => {
    setIsLoading(true);
    setError(null);

    // 1. Load from LocalStorage IMMEDIATELY (Stale-while-revalidate)
    const localData = localStorage.getItem('maos-do-campo-crops');
    if (localData) {
      try {
        setCrops(JSON.parse(localData));
      } catch (e) {
        console.error("Erro ao ler cache local", e);
      }
    }

    // 2. Try to fetch from Supabase with a Timeout
    try {
      if (!supabase) throw new Error("Supabase não iniciado");

      // Timeout promise to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Timeout")), 5000)
      );

      const dbPromise = supabase
        .from('crops')
        .select('*')
        .order('created_at', { ascending: false });

      // Race: Database vs 5s Timer
      const result: any = await Promise.race([dbPromise, timeoutPromise]);

      if (result.error) throw result.error;

      // Map Supabase rows back to CropData structure
      const loadedCrops = result.data.map((row: any) => ({
        ...row.content,
        id: row.id 
      }));

      setCrops(loadedCrops);
      // Update local cache
      localStorage.setItem('maos-do-campo-crops', JSON.stringify(loadedCrops));
      
    } catch (e: any) {
      console.error("Erro de sincronização:", e);
      // Only set error state if we have NO data to show
      if (!localData && crops.length === 0) {
        setError("Não foi possível carregar seus dados. Verifique a conexão.");
      } else {
        // Silent fail (toast could go here) - User still sees local data
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCrop = async (newCrop: CropData) => {
    // Optimistic UI update
    const updatedList = [newCrop, ...crops];
    setCrops(updatedList);
    setActiveTab('dashboard');

    // Save to LocalStorage (backup)
    localStorage.setItem('maos-do-campo-crops', JSON.stringify(updatedList));

    // Save to Supabase
    if (supabase && session) {
      try {
        const { error } = await supabase
          .from('crops')
          .insert([
            { 
              id: newCrop.id, 
              content: newCrop,
              user_id: session.user.id 
            }
          ]);
        
        if (error) throw error;
      } catch (e) {
        console.error("Erro ao salvar no Supabase:", e);
        // We could add a "pending sync" flag here in future
      }
    }
  };

  const handleUpdateCrop = async (updatedCrop: CropData) => {
    // Optimistic UI update
    const newCrops = crops.map(c => c.id === updatedCrop.id ? updatedCrop : c);
    setCrops(newCrops);
    setSelectedCrop(updatedCrop);
    
    // Save to LocalStorage (backup)
    localStorage.setItem('maos-do-campo-crops', JSON.stringify(newCrops));

    // Update in Supabase
    if (supabase && session) {
       try {
        const { error } = await supabase
          .from('crops')
          .update({ content: updatedCrop })
          .eq('id', updatedCrop.id);
        
        if (error) throw error;
      } catch (e) {
        console.error("Erro ao atualizar no Supabase:", e);
      }
    }
  };

  const renderContent = () => {
    // Show loading only if we have NO data and are fetching
    if (isLoading && crops.length === 0 && !error) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-400 animate-pulse">
           <Loader2 size={40} className="animate-spin mb-4 text-agro-green" />
           <p className="dark:text-gray-300">Sincronizando sua fazenda...</p>
        </div>
      );
    }

    if (error && crops.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
           <WifiOff size={48} className="mb-4 text-gray-300 dark:text-gray-600" />
           <p className="mb-4 text-center max-w-xs">{error}</p>
           <button 
             onClick={fetchCrops}
             className="flex items-center gap-2 px-6 py-3 bg-agro-green text-white rounded-xl font-bold hover:bg-green-700 transition-colors"
           >
             <RefreshCw size={20} /> Tentar Novamente
           </button>
        </div>
      );
    }

    if (selectedCrop) {
      return (
        <CropDetails 
          crop={selectedCrop} 
          onBack={() => setSelectedCrop(null)}
          onUpdateCrop={handleUpdateCrop}
        />
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            crops={crops} 
            onSelectCrop={setSelectedCrop} 
            onNewCrop={() => setActiveTab('new-crop')}
            theme={theme}
            toggleTheme={toggleTheme}
          />
        );
      case 'quotes':
        return <Quotes />;
      case 'new-crop':
        return (
          <NewCropForm 
            onSave={handleSaveCrop}
            onCancel={() => setActiveTab('dashboard')}
          />
        );
      case 'subscription':
        return (
          <Subscription 
            onSubscribe={(id) => alert(`Plano ${id} selecionado! Integração de pagamento em breve.`)}
            onBack={() => setActiveTab('dashboard')}
          />
        );
      case 'settings':
        return (
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 text-center animate-slide-up">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Configurações</h2>
            
            <div className="flex items-center justify-center gap-2 mb-6 text-sm">
               <div className={`w-3 h-3 rounded-full ${supabase ? 'bg-green-500' : 'bg-red-500'}`}></div>
               <span className="text-gray-600 dark:text-gray-300">
                  {supabase ? 'Conectado à Nuvem (Supabase)' : 'Modo Offline (Local)'}
               </span>
            </div>
            
            <p className="text-gray-500 dark:text-gray-400 mb-6">Conta: <strong>{session?.user?.email}</strong></p>

            <button 
              onClick={async () => {
                if(confirm("Deseja mesmo sair?")) {
                    localStorage.clear();
                    try {
                      if (supabase) await supabase.auth.signOut();
                    } catch (e) { console.error(e) }
                    window.location.reload();
                }
              }}
              className="text-red-500 hover:text-red-700 font-medium border border-red-200 px-6 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              Desconectar Conta
            </button>
          </div>
        );
      default:
        return <Dashboard crops={crops} onSelectCrop={setSelectedCrop} onNewCrop={() => setActiveTab('new-crop')} theme={theme} toggleTheme={toggleTheme} />;
    }
  };

  if (authLoading) {
     return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
             <Loader2 size={40} className="animate-spin text-agro-green" />
        </div>
     )
  }

  if (!session && supabase) {
    return <Login />;
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FA] dark:bg-slate-900 text-gray-800 dark:text-gray-100 font-sans transition-colors duration-300">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => { setActiveTab(tab); setSelectedCrop(null); }}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      <main className="flex-1 p-4 md:p-8 h-screen overflow-y-auto custom-scrollbar">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between mb-6">
           <div className="flex items-center gap-2">
              <span className="font-bold text-agro-green text-lg">MÃOS DO CAMPO</span>
           </div>
           <div className="flex items-center gap-3">
               <button 
                 onClick={toggleTheme}
                 className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700 text-gray-600 dark:text-gray-300 active:scale-95 transition-transform"
               >
                 {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
               </button>
               
               <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700">
                 <Menu size={24} className="text-gray-600 dark:text-gray-300" />
               </button>
           </div>
        </div>

        {/* Offline Warning Banner */}
        {!navigator.onLine && (
           <div className="mb-4 bg-gray-800 dark:bg-black border border-gray-700 text-white px-4 py-3 rounded-xl flex items-center gap-3 text-sm">
              <WifiOff size={16} />
              <span>Você está offline. Alterações serão salvas localmente.</span>
           </div>
        )}

        {renderContent()}
      </main>
    </div>
  );
};

export default App;
