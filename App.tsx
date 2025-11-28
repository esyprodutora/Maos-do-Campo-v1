import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { NewCropForm } from './components/NewCropForm';
import { CropDetails } from './components/CropDetails';
import { CropData } from './types';
import { Menu } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCrop, setSelectedCrop] = useState<CropData | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [crops, setCrops] = useState<CropData[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('maos-do-campo-crops');
    if (saved) {
      try {
        setCrops(JSON.parse(saved));
      } catch (e) {
        console.error("Erro ao carregar dados", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('maos-do-campo-crops', JSON.stringify(crops));
    }
  }, [crops, isLoaded]);

  const handleSaveCrop = (newCrop: CropData) => {
    setCrops([...crops, newCrop]);
    setActiveTab('dashboard');
  };

  const handleUpdateCrop = (updatedCrop: CropData) => {
    const newCrops = crops.map(c => c.id === updatedCrop.id ? updatedCrop : c);
    setCrops(newCrops);
    setSelectedCrop(updatedCrop); // Update current view
  };

  const renderContent = () => {
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
            <p className="text-gray-500">Versão MVP. Todos os dados são salvos no seu navegador.</p>
            <button 
              onClick={() => {
                if(confirm("Tem certeza que deseja apagar todos os dados?")) {
                  setCrops([]);
                  localStorage.removeItem('maos-do-campo-crops');
                }
              }}
              className="mt-6 text-red-500 hover:text-red-700 font-medium border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50"
            >
              Resetar Dados do App
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

        {renderContent()}
      </main>
    </div>
  );
};

export default App;
