import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { NewCropForm } from './components/NewCropForm';
import { CropDetails } from './components/CropDetails';
import { CropData } from './types';
import { Menu, Loader2, WifiOff } from 'lucide-react';
import { supabase } from './services/supabaseClient';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCrop, setSelectedCrop] = useState<CropData | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [crops, setCrops] = useState<CropData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load from Supabase
  useEffect(() => {
    fetchCrops();
  }, []);

  const fetchCrops = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!supabase) {
        // Fallback to local storage if supabase isn't configured yet
        const saved = localStorage.getItem('maos-do-campo-crops');
        if (saved) setCrops(JSON.parse(saved));
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('crops')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map Supabase rows back to CropData structure
      // We stored the whole object in the 'content' column
      const loadedCrops = data.map(row => ({
        ...row.content,
        // Ensure ID matches the row ID if needed, though we store ID inside content too
      }));

      setCrops(loadedCrops);
    } catch (e: any) {
      console.error("Erro ao carregar dados:", e);
      setError("Não foi possível conectar ao banco de dados.");
      // Fallback local em caso de erro
      const saved = localStorage.getItem('maos-do-campo-crops');
      if (saved) setCrops(JSON.parse(saved));
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
    if (supabase) {
      try {
        const { error } = await supabase
          .from('crops')
          .insert([
            { id: newCrop.id, content: newCrop }
          ]);
        
        if (error) throw error;
      } catch (e) {
        console.error("Erro ao salvar no Supabase:", e);
        alert("Aviso: Salvo apenas localmente. Verifique sua conexão.");
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
    if (supabase) {
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
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-400">
           <Loader2 size={40} className="animate-spin mb-4 text-agro-green" />
           <p>Carregando sua fazenda...</p>
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
          />
        );
      case 'new-crop':
        return (
          <NewCropForm 
            onSave={handleSaveCrop}
            onCancel={() => setActiveTab('dashboard')}
          />
        );
      case 'settings':
        return (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Configurações</h2>
            
            <div className="flex items-center justify-center gap-2 mb-6 text-sm">
               <div className={`w-3 h-3 rounded-full ${supabase ? 'bg-green-500' : 'bg-red-500'}`}></div>
               <span className="text-gray-600">
                  {supabase ? 'Conectado à Nuvem (Supabase)' : 'Modo Offline (Local)'}
               </span>
            </div>

            <p className="text-gray-500 mb-6">Seus dados estão sendo sincronizados com o banco de dados seguro.</p>
            
            <button 
              onClick={async () => {
                if(confirm("Tem certeza que deseja apagar todos os dados? Isso apagará do banco de dados também.")) {
                  setCrops([]);
                  localStorage.removeItem('maos-do-campo-crops');
                  if (supabase) {
                    await supabase.from('crops').delete().neq('id', '0'); // Delete all
                  }
                  window.location.reload();
                }
              }}
              className="mt-2 text-red-500 hover:text-red-700 font-medium border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50"
            >
              Resetar Todos os Dados
            </button>
          </div>
        );
      default:
        return <Dashboard crops={crops} onSelectCrop={setSelectedCrop} onNewCrop={() => setActiveTab('new-crop')} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8F9FA] text-gray-800 font-sans">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => { setActiveTab(tab); setSelectedCrop(null); }}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      <main className="flex-1 p-4 md:p-8 h-screen overflow-y-auto">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between mb-6">
           <div className="flex items-center gap-2">
              <span className="font-bold text-agro-green text-lg">MÃOS DO CAMPO</span>
           </div>
           <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-white rounded-lg shadow-sm">
             <Menu size={24} className="text-gray-600" />
           </button>
        </div>

        {error && !isLoading && (
           <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-xl flex items-center gap-3">
              <WifiOff size={20} />
              <span>{error} - Usando dados locais temporariamente.</span>
           </div>
        )}

        {renderContent()}
      </main>
    </div>
  );
};

export default App;