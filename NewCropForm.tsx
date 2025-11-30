import React, { useState } from 'react';
import { CropType, SoilType, CropData } from '../types';
import { generateCropPlan } from '../services/geminiService';
import { Loader2, Sprout, Map, BarChart3, CheckCircle2, ChevronLeft, ChevronRight, Ruler, MapPin } from 'lucide-react';
import { LocationPicker } from './LocationPicker';

const generateId = () => Math.random().toString(36).substr(2, 9);

interface NewCropFormProps {
  onSave: (crop: CropData) => void;
  onCancel: () => void;
}

export const NewCropForm: React.FC<NewCropFormProps> = ({ onSave, onCancel }) => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Estado do formulário
  const [formData, setFormData] = useState({
    name: '',
    type: 'soja' as CropType,
    areaHa: '' as any,
    soilType: 'misto' as SoilType,
    productivityGoal: '',
    spacing: '',
    latitude: null as number | null,
    longitude: null as number | null
  });

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const plan = await generateCropPlan(
        formData.name,
        formData.type,
        Number(formData.areaHa),
        formData.soilType,
        formData.productivityGoal,
        formData.spacing
      );

      const newCrop: CropData = {
        id: generateId(),
        name: formData.name,
        type: formData.type,
        areaHa: Number(formData.areaHa),
        soilType: formData.soilType,
        productivityGoal: formData.productivityGoal,
        spacing: formData.spacing,
        latitude: formData.latitude || 0,
        longitude: formData.longitude || 0,
        datePlanted: new Date().toISOString(),
        estimatedCost: plan.estimatedCost || 0,
        estimatedHarvestDate: plan.estimatedHarvestDate || new Date().toISOString(),
        materials: plan.materials || [],
        timeline: plan.timeline || [],
        aiAdvice: plan.aiAdvice || "Boa sorte com a lavoura!"
      };

      onSave(newCrop);
    } catch (error) {
      alert("Erro ao gerar planejamento. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { id: 1, title: "Dados Básicos", icon: Sprout },
    { id: 2, title: "Local e Solo", icon: Map },
    { id: 3, title: "Revisão", icon: CheckCircle2 }
  ];

  const SelectionCard = ({ selected, onClick, title, color, icon }: any) => (
    <div 
      onClick={onClick}
      className={`
        relative p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2 text-center h-32
        ${selected 
          ? `border-${color} bg-${color}/10 dark:bg-${color}/20 shadow-md scale-105 ring-1 ring-${color}` 
          : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-gray-300 dark:hover:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 shadow-sm'}
      `}
    >
      {selected && (
         <div className={`absolute top-2 right-2 text-${color}`}>
            <CheckCircle2 size={20} fill="currentColor" className="text-white dark:text-slate-900" />
         </div>
      )}
      <div className={`p-3 rounded-full ${selected ? `bg-${color} text-white` : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400'}`}>
        {icon}
      </div>
      <span className={`font-bold ${selected ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>{title}</span>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto animate-slide-up pb-20">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-black/50 border border-gray-200 dark:border-slate-700 overflow-hidden">
        
        {/* Cabeçalho */}
        <div className="bg-gray-50/50 dark:bg-slate-900/50 p-6 border-b border-gray-200 dark:border-slate-700">
           <div className="flex items-center justify-between mb-6">
             <button onClick={onCancel} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1 font-medium text-sm transition-colors">
               <ChevronLeft size={16} /> Cancelar
             </button>
             <span className="text-sm font-bold text-gray-400">Passo {step} de 3</span>
           </div>

           <div className="flex justify-between items-center relative px-4">
             <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 dark:bg-slate-700 -z-10 -translate-y-1/2 rounded-full" />
             <div 
               className="absolute top-1/2 left-0 h-1 bg-agro-green -z-10 transition-all duration-500 -translate-y-1/2 rounded-full" 
               style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
             />

             {steps.map((s) => (
               <div key={s.id} className="flex flex-col items-center gap-2 bg-gray-50 dark:bg-slate-900 px-2">
                 <div className={`
                   w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 shadow-sm
                   ${step >= s.id ? 'bg-agro-green text-white scale-110' : 'bg-white dark:bg-slate-800 border-2 border-gray-300 dark:border-slate-600 text-gray-400'}
                 `}>
                   <s.icon size={18} />
                 </div>
                 <span className={`text-xs font-bold hidden sm:block ${step >= s.id ? 'text-agro-green' : 'text-gray-400'}`}>
                   {s.title}
                 </span>
               </div>
             ))}
           </div>
        </div>

        <div className="p-6 md:p-10 min-h-[400px]">
          
          {/* PASSO 1 */}
          {step === 1 && (
            <div className="space-y-8 animate-fade-in">
              <div className="text-center">
                 <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Vamos começar sua lavoura</h2>
                 <p className="text-gray-500 dark:text-gray-400">Escolha a cultura e defina o nome.</p>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                 <SelectionCard 
                   selected={formData.type === 'cafe'} 
                   onClick={() => setFormData({...formData, type: 'cafe'})} 
                   title="Café" color="agro-brown" 
                   icon={<div className="font-bold text-lg">☕</div>}
                 />
                 <SelectionCard 
                   selected={formData.type === 'milho'} 
                   onClick={() => setFormData({...formData, type: 'milho'})} 
                   title="Milho" color="orange-500" 
                   icon={<div className="font-bold text-lg">🌽</div>}
                 />
                 <SelectionCard 
                   selected={formData.type === 'soja'} 
                   onClick={() => setFormData({...formData, type: 'soja'})} 
                   title="Soja" color="agro-yellow" 
                   icon={<div className="font-bold text-lg">🌱</div>}
                 />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nome do Talhão / Lavoura</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="Ex: Talhão da Baixada"
                    className="w-full p-4 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 focus:border-agro-green dark:focus:border-agro-green focus:ring-4 focus:ring-green-500/10 rounded-xl outline-none transition-all font-medium dark:text-white shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Área Total (Hectares)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={formData.areaHa}
                      onChange={e => setFormData({...formData, areaHa: e.target.value})}
                      placeholder="0.0"
                      className="w-full p-4 pl-12 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 focus:border-agro-green dark:focus:border-agro-green focus:ring-4 focus:ring-green-500/10 rounded-xl outline-none transition-all font-medium dark:text-white shadow-sm"
                    />
                    <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PASSO 2 */}
          {step === 2 && (
            <div className="space-y-8 animate-fade-in">
              <div className="text-center">
                 <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Localização e Solo</h2>
                 <p className="text-gray-500 dark:text-gray-400">Marque o talhão e defina o solo.</p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                   Onde fica a lavoura? (Arraste o mapa)
                </label>
                <LocationPicker 
                   initialLat={formData.latitude || undefined}
                   initialLng={formData.longitude || undefined}
                   onLocationSelect={(lat, lng) => setFormData({...formData, latitude: lat, longitude: lng})}
                />
                <p className="text-xs text-gray-400 text-center">
                   {formData.latitude ? `Coordenada: ${formData.latitude.toFixed(4)}, ${formData.longitude?.toFixed(4)}` : 'Arraste para definir o centro do talhão'}
                </p>
              </div>

              <div className="border-t border-gray-100 dark:border-slate-700 pt-6">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 text-center">Tipo de Solo</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {['arenoso', 'argiloso', 'misto'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setFormData({...formData, soilType: type as SoilType})}
                      className={`p-4 rounded-xl border-2 transition-all capitalize font-bold text-center shadow-sm ${
                        formData.soilType === type 
                          ? 'border-agro-green bg-green-50 dark:bg-green-900/30 text-agro-green ring-1 ring-agro-green' 
                          : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-slate-600'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Meta de Produtividade</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={formData.productivityGoal}
                      onChange={e => setFormData({...formData, productivityGoal: e.target.value})}
                      placeholder={formData.type === 'cafe' ? "Ex: 40 sc/ha" : "Ex: 70 sc/ha"}
                      className="w-full p-4 pl-12 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 focus:border-agro-green dark:focus:border-agro-green focus:ring-4 focus:ring-green-500/10 rounded-xl outline-none transition-all font-medium dark:text-white shadow-sm"
                    />
                    <BarChart3 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Espaçamento</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={formData.spacing}
                      onChange={e => setFormData({...formData, spacing: e.target.value})}
                      placeholder="Ex: 0.5m"
                      className="w-full p-4 pl-12 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 focus:border-agro-green dark:focus:border-agro-green focus:ring-4 focus:ring-green-500/10 rounded-xl outline-none transition-all font-medium dark:text-white shadow-sm"
                    />
                      <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PASSO 3 */}
          {step === 3 && (
            <div className="flex flex-col items-center justify-center text-center space-y-6 animate-fade-in">
               <div className="w-24 h-24 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-2 animate-bounce">
                  <Sprout size={48} className="text-agro-green" />
               </div>
               
               <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Tudo pronto!</h2>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mt-2">
                    Nossa IA vai gerar um plano completo de custos, insumos e cronograma para sua lavoura.
                  </p>
               </div>

               <div className="bg-gray-50 dark:bg-slate-900 rounded-2xl p-6 w-full max-w-sm border border-gray-200 dark:border-slate-700 text-left relative overflow-hidden shadow-sm">
                  <div className="absolute top-0 left-0 w-2 h-full bg-agro-green"></div>
                  <div className="space-y-3">
                      <div className="flex justify-between border-b border-gray-200 dark:border-slate-700 pb-2">
                        <span className="text-gray-500 dark:text-gray-400">Lavoura</span>
                        <span className="font-bold dark:text-white">{formData.name}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-200 dark:border-slate-700 pb-2">
                        <span className="text-gray-500 dark:text-gray-400">Cultura</span>
                        <span className="font-bold capitalize dark:text-white">{formData.type}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-200 dark:border-slate-700 pb-2">
                        <span className="text-gray-500 dark:text-gray-400">Área</span>
                        <span className="font-bold dark:text-white">{formData.areaHa} ha</span>
                      </div>
                      {formData.latitude && (
                        <div className="flex justify-between text-xs pt-1">
                           <span className="text-gray-500">Local</span>
                           <span className="text-gray-400 flex items-center gap-1">
                             <MapPin size={10} /> GPS Definido
                           </span>
                        </div>
                      )}
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="p-6 border-t border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50 flex justify-between items-center">
          {step > 1 && (
            <button 
              onClick={() => setStep(step - 1)}
              disabled={isLoading}
              className="px-6 py-3 text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-200 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50"
            >
              Voltar
            </button>
          )}
          
          <div className="ml-auto">
            {step < 3 ? (
              <button 
                onClick={() => {
                  if(step === 1 && (!formData.name || !formData.areaHa)) return alert("Preencha os campos");
                  if(step === 2 && !formData.latitude) return alert("Por favor, selecione a localização no mapa.");
                  setStep(step + 1);
                }}
                className="px-8 py-3 bg-agro-dark dark:bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-gray-800 dark:hover:bg-black transition-colors flex items-center"
              >
                Continuar <ChevronRight size={18} className="ml-2"/>
              </button>
            ) : (
               <button 
                onClick={handleSubmit}
                disabled={isLoading}
                className="px-10 py-4 bg-agro-green text-white font-bold rounded-xl shadow-lg shadow-green-600/30 hover:bg-green-700 transition-all transform hover:scale-105 flex items-center disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={20} className="mr-2 animate-spin" /> Processando...
                  </>
                ) : (
                  'Gerar Planejamento'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};