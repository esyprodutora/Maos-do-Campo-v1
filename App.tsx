import { useState } from 'react';
import { NewCropForm } from './components/NewCropForm';
import { CropData } from './types';
import { Sprout, Plus, Calendar, DollarSign, MapPin, Leaf } from 'lucide-react';

function App() {
  const [showForm, setShowForm] = useState(false);
  const [crops, setCrops] = useState<CropData[]>([]);

  const handleSave = (newCrop: CropData) => {
    setCrops([newCrop, ...crops]);
    setShowForm(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white font-sans">
      
      {/* Cabeçalho */}
      <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-agro-green/10 p-2 rounded-lg">
               <Sprout className="text-agro-green" size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Mãos do Campo</h1>
          </div>
          <div className="flex items-center gap-4">
             <span className="text-sm text-gray-500 hidden sm:block">Olá, Produtor</span>
             <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 md:p-8">
        
        {showForm ? (
          /* MODO FORMULÁRIO: Mostra o componente que criámos */
          <div>
            <NewCropForm 
              onSave={handleSave} 
              onCancel={() => setShowForm(false)} 
            />
          </div>
        ) : (
          /* MODO LISTA: Mostra as lavouras cadastradas */
          <div className="space-y-8 animate-fade-in">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold">Minhas Lavouras</h2>
                <p className="text-gray-500 dark:text-gray-400">Gerencie a sua produção e veja o planeamento.</p>
              </div>
              <button 
                onClick={() => setShowForm(true)}
                className="bg-agro-green hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-green-600/20 flex items-center gap-2 transition-all active:scale-95"
              >
                <Plus size={20} /> Nova Lavoura
              </button>
            </div>

            {/* Lista de Lavouras */}
            {crops.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-gray-200 dark:border-slate-700">
                <div className="w-20 h-20 bg-gray-50 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Leaf className="text-gray-300 dark:text-gray-500" size={40} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Nenhuma lavoura registada</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto mt-2">
                  Comece por adicionar o seu primeiro talhão para receber o planeamento da IA.
                </p>
                <button 
                  onClick={() => setShowForm(true)}
                  className="mt-6 text-agro-green font-bold hover:underline"
                >
                  Registar agora
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {crops.map((crop) => (
                  <div key={crop.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold">{crop.name}</h3>
                          <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-bold rounded-full uppercase">
                            {crop.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-500 text-sm">
                           <MapPin size={14} /> {crop.areaHa} hectares • {crop.soilType}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-slate-700">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 flex items-center gap-2">
                          <Calendar size={16} /> Colheita Prevista
                        </span>
                        <span className="font-medium">
                          {new Date(crop.estimatedHarvestDate).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 flex items-center gap-2">
                          <DollarSign size={16} /> Custo Estimado
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          R$ {crop.estimatedCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;