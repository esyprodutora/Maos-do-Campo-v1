import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { NewCropForm } from './components/NewCropForm';
import { CropDetails } from './components/CropDetails'; // Correção Aqui (Import Named)
import { Login } from './components/Login';
import { Subscription } from './components/Subscription';
import { Quotes } from './components/Quotes';
import { CropData } from './types';
import { Menu, Loader2, WifiOff, RefreshCw, Sun, Moon, CloudOff, Cloud, Leaf } from 'lucide-react';
import { supabase } from './services/supabaseClient';

// Tipos para a fila de sincronização
type SyncAction = 'INSERT' | 'UPDATE' | 'DELETE';
interface SyncItem {
  id: string;
  action: SyncAction;
  payload?: any;
  timestamp: number;
}

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
  
  // Estado de Sincronização
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingSyncs, setPendingSyncs] = useState<number>(0);

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

  // Monitoramento de Conexão e Auth
  useEffect(() => {
    // Auth Listener
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

    // Network Listeners
    const handleOnline = () => {
        setIsOffline(false);
        processSyncQueue(); // Tenta sincronizar ao voltar online
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load initial sync queue size
    const queue = JSON.parse(localStorage.getItem('sync_queue') || '[]');
    setPendingSyncs(queue.length);

    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (session) {
      fetchCrops();
    }
  }, [session]);

  // Função Mágica de Sincronização
  const processSyncQueue = async () => {
      if (!supabase || !session) return;
      
      const queue: SyncItem[] = JSON.parse(localStorage.getItem('sync_queue') || '[]');
      if (queue.length === 0) return;

      setIsSyncing(true);
      console.log(`Sincronizando ${queue.length} itens...`);

      const newQueue = [...queue];
      const processedIds: string[] = [];

      for (const item of queue) {
          try {
              if (item.action === 'INSERT') {
                  await supabase.from('crops').upsert([{ 
                      id: item.id, 
                      content: item.payload, 
                      user_id: session.user.id 
                  }]);
              } else if (item.action === 'UPDATE') {
                  await supabase.from('crops').update({ 
                      content: item.payload 
                  }).eq('id', item.id);
              } else if (item.action === 'DELETE') {
                  await supabase.from('crops').delete().eq('id', item.id);
              }
              processedIds.push(item.id);
          } catch (e) {
              console.error(`Falha ao sincronizar item ${item.id}`, e);
          }
      }

      const currentQueue = JSON.parse(localStorage.getItem('sync_queue') || '[]');
      const finalQueue = currentQueue.filter((i: SyncItem) => !processedIds.includes(i.id));
      
      localStorage.setItem('sync_queue', JSON.stringify(finalQueue));
      setPendingSyncs(finalQueue.length);
      setIsSyncing(false);
      
      fetchCrops(); 
  };

  const addToSyncQueue = (item: SyncItem) => {
      const queue = JSON.parse(localStorage.getItem('sync_queue') || '[]');
      
      const existingIndex = queue.findIndex((i: SyncItem) => i.id === item.id && i.action === item.action);
      
      if (existingIndex >= 0) {
          queue[existingIndex] = item;
      } else {
          queue.push(item);
      }
      
      localStorage.setItem('sync_queue', JSON.stringify(queue));
      setPendingSyncs(queue.length);

      if (navigator.onLine) {
          processSyncQueue();
      }
  };

  const fetchCrops = async () => {
    setIsLoading(true);
    setError(null);

    const localData = localStorage.getItem('maos-do-campo-crops');
    if (localData) {
      setCrops(JSON.parse(localData));
    }

    if (!navigator.onLine) {
        setIsLoading(false);
        return;
    }

    try {
      if (!supabase) throw new Error("Supabase não iniciado");

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Timeout")), 5000)
      );

      const dbPromise = supabase
        .from('crops')
        .select('*')
        .order('created_at', { ascending: false });

      const result: any = await Promise.race([dbPromise, timeoutPromise]);

      if (result.error) throw result.error;

      const loadedCrops = result.data.map((row: any) => ({
        ...row.content,
        id: row.id 
      }));

      if (pendingSyncs === 0) {
          setCrops(loadedCrops);
          localStorage.setItem('maos-do-campo-crops', JSON.stringify(loadedCrops));
      }
      
    } catch (e: any) {
      console.error("Erro de sincronização:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCrop = async (newCrop: CropData) => {
    const updatedList = [newCrop, ...crops];
    setCrops(updatedList);
    setActiveTab('dashboard'); 
    setSelectedCrop(newCrop); 
    localStorage.setItem('maos-do-campo-crops', JSON.stringify(updatedList));

    addToSyncQueue({
        id: newCrop.id,
        action: 'INSERT',
        payload: newCrop,
        timestamp: Date.now()
    });
  };

  const handleUpdateCrop = async (updatedCrop: CropData) => {
    const newCrops = crops.map(c => c.id === updatedCrop.id ? updatedCrop : c);
    setCrops(newCrops);
    setSelectedCrop(updatedCrop);
    localStorage.setItem('maos-do-campo-crops', JSON.stringify(newCrops));

    addToSyncQueue({
        id: updatedCrop.id,
        action: 'UPDATE',
        payload: updatedCrop,
        timestamp: Date.now()
    });
  };

  const handleDeleteCrop = async (cropId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta lavoura permanentemente?")) return;
    const newCrops = crops.filter(c => c.id !== cropId);
    setCrops(newCrops);
    setSelectedCrop(null);
    localStorage.setItem('maos-do-campo-crops', JSON.stringify(newCrops));

    addToSyncQueue({
        id: cropId,
        action: 'DELETE',
        timestamp: Date.now()
    });
  };

  const renderContent = () => {
    if (isLoading && crops.length === 0 && !error) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-400 animate-pulse">
           <Loader2 size={40} className="animate-spin mb-4 text-agro-green" />
           <p className="dark:text-gray-300">Carregando sua fazenda...</p>
        </div>
      );
    }

    if (selectedCrop) {
      return (
        <CropDetails 
          crop={selectedCrop} 
          onBack={() => setSelectedCrop(null)}
          onUpdateCrop={handleUpdateCrop}
          onDeleteCrop={() => handleDeleteCrop(selectedCrop.id)}
        />
      );
    }

    switch (activeTab) {
      case 'dashboard': return <Dashboard crops={crops} onSelectCrop={setSelectedCrop} onNewCrop={() => setActiveTab('new-crop')} theme={theme} toggleTheme={toggleTheme} />;
      case 'quotes': return <Quotes />;
      case 'new-crop': return <NewCropForm onSave={handleSaveCrop} onCancel={() => setActiveTab('dashboard')} />;
      case 'subscription': return <Subscription onSubscribe={(id) => alert(`Plano ${id} selecionado!`)} onBack={() => setActiveTab('dashboard')} />;
      case 'settings':
        return (
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 text-center animate-slide-up">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Configurações</h2>
            
            <div className="flex flex-col items-center gap-4 mb-8">
               <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${isOffline ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                   {isOffline ? <CloudOff size={18}/> : <Cloud size={18}/>}
                   <span className="font-bold text-sm">{isOffline ? 'Modo Offline' : 'Sincronizado'}</span>
               </div>
               {pendingSyncs > 0 && (
                   <p className="text-xs text-gray-500">
                       {pendingSyncs} alterações pendentes de envio.
                   </p>
               )}
            </div>
            
            <p className="text-gray-500 dark:text-gray-400 mb-6">Conta: <strong>{session?.user?.email}</strong></p>
            <button onClick={async () => { if(confirm("Deseja sair?")) { localStorage.clear(); try { if (supabase) await supabase.auth.signOut(); } catch (e) {} window.location.reload(); } }} className="text-red-500 hover:text-red-700 font-medium border border-red-200 px-6 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">Desconectar</button>
          </div>
        );
      default: return <Dashboard crops={crops} onSelectCrop={setSelectedCrop} onNewCrop={() => setActiveTab('new-crop')} theme={theme} toggleTheme={toggleTheme} />;
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
      <Sidebar activeTab={activeTab} setActiveTab={(tab) => { setActiveTab(tab); setSelectedCrop(null); }} isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />

      <main className="flex-1 p-4 md:p-8 h-screen overflow-y-auto custom-scrollbar">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between mb-6">
           <div className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-agro-green to-emerald-600 p-1.5 rounded-lg shadow-sm">
                  <Leaf className="text-white" size={20} fill="currentColor" />
              </div>
              <span className="font-bold text-agro-green text-lg leading-none">MÃOS DO<br/><span className="text-agro-yellow">CAMPO</span></span>
           </div>
           <div className="flex items-center gap-3">
               {/* Sync Indicator Mobile */}
               {isSyncing ? (
                   <Loader2 size={18} className="animate-spin text-agro-green" />
               ) : isOffline ? (
                   <CloudOff size={18} className="text-gray-400" />
               ) : null}

               <button onClick={toggleTheme} className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700 text-gray-600 dark:text-gray-300 active:scale-95 transition-transform">
                 {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
               </button>
               <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700">
                 <Menu size={24} className="text-gray-600 dark:text-gray-300" />
               </button>
           </div>
        </div>

        {/* Sync/Offline Warning Banner */}
        {isOffline && (
           <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-900/50 dark:text-yellow-200 px-4 py-3 rounded-xl flex items-center justify-between text-sm animate-fade-in">
              <div className="flex items-center gap-2">
                <CloudOff size={16} />
                <span>Você está offline. Dados salvos no dispositivo.</span>
              </div>
              {pendingSyncs > 0 && <span className="text-xs font-bold bg-yellow-200 dark:bg-yellow-800 px-2 py-0.5 rounded-full">{pendingSyncs} pendentes</span>}
           </div>
        )}
        {isSyncing && (
            <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-900/50 px-4 py-2 rounded-xl flex items-center gap-2 text-sm animate-pulse">
                <RefreshCw size={14} className="animate-spin"/> Sincronizando dados com a nuvem...
            </div>
        )}

        {renderContent()}
      </main>
    </div>
  );
};

export default App;
