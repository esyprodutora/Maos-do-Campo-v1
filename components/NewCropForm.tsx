
import React, { useState } from 'react';
import { CropType, SoilType, CropData, Coordinates } from '../types';
import { generateCropPlan } from '../services/geminiService';
import { Loader2, Sprout, Map, BarChart3, CheckCircle2, ChevronLeft, ChevronRight, Ruler, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { LocationPicker } from './LocationPicker';

const generateId = () => Math.random().toString(36).substr(2, 9);

interface NewCropFormProps {
  onSave: (crop: CropData) => void;
  onCancel: () => void;
}

const CROP_OPTIONS: { id: CropType; label: string; icon: string; color: string; ring: string }[] = [
  { id: 'soja', label: 'Soja', icon: '🌱', color: 'bg-yellow-500', ring: 'ring-yellow-500' },
  { id: 'milho', label: 'Milho', icon: '🌽', color: 'bg-orange-500', ring: 'ring-orange-500' },
  { id: 'cafe', label: 'Café', icon: '☕', color: 'bg-[#A67C52]', ring: 'ring-[#A67C52]' },
  { id: 'cana', label: 'Cana', icon: '🎋', color: 'bg-green-600', ring: 'ring-green-600' },
  { id: 'algodao', label: 'Algodão', icon: '☁️', color: 'bg-slate-400', ring: 'ring-slate-400' },
  { id: 'arroz', label: 'Arroz', icon: '🌾', color: 'bg-yellow-400', ring: 'ring-yellow-400' },
  { id: 'feijao', label: 'Feijão', icon: '🫘', color: 'bg-red-800', ring: 'ring-red-800' },
  { id: 'trigo', label: 'Trigo', icon: '🥖', color: 'bg-amber-300', ring: 'ring-amber-300' },
  { id: 'laranja', label: 'Laranja', icon: '🍊', color: 'bg-orange-600', ring: 'ring-orange-600' },
  { id: 'mandioca', label: 'Mandioca', icon: '🥔', color: 'bg-amber-800', ring: 'ring-amber-800' },
];

export const NewCropForm: React.FC<NewCropFormProps> = ({ onSave, onCancel }) => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isCropListOpen, setIsCropListOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    type: null as CropType | null,
    areaHa: '' as any,
    soilType: 'misto' as SoilType,
    productivityGoal: '',
    spacing: '',
    coordinates: undefined as Coordinates | undefined
  });

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      if (!formData.type) throw new Error("Selecione uma cultura");

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
        coordinates: formData.coordinates,
        datePlanted: new Date().toISOString(),
        estimatedCost: plan.estimatedCost || 0,
        estimatedHarvestDate: plan.estimatedHarvestDate || new Date().toISOString(),
        timeline: plan.timeline || [], // New detailed structure source
        aiAdvice: plan.aiAdvice || "Sucesso na safra!"
      };

      onSave(newCrop);
    } catch (error) {
      alert("Erro ao gerar planejamento. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { id: 1, title: "Cultura", icon: Sprout },
    { id: 2, title: "Local", icon: MapPin },
    { id: 3, title: "Solo", icon: BarChart3 },
    { id: 4, title: "Revisão", icon: CheckCircle2 }
  ];

  const selectedCropConfig = formData.type ? CROP_OPTIONS.find(c => c.id === formData.type) : null;

  return (
    <div className="max-w-4xl mx-auto animate-slide-up pb-20">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
        
        {/* Progress Header */}
        <div className="bg-gray-50/50 dark:bg-slate-900/50 p-6 border-b border-gray-200 dark:border-slate-700">
           <div className="flex items-center justify-between mb-6">
             <button onClick={onCancel} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 flex items-center gap-1 text-sm font-bold">
               <ChevronLeft size={16} /> Cancelar
             </button>
             <span className="text-sm font-bold text-gray-400">Passo {step} de 4</span>
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
                   ${step >= s.id ? 'bg-agro-green text-white scale-110' : 'bg-white dark:bg-slate-800 border-2 border-gray-300 text-gray-400'}
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
          {step === 1 && (
            <div className="space-y-8 animate-fade-in">
              <div className="text-center">
                 <h2 className="text-2xl font-bold text-gray-900 dark:text-white">O que vamos plantar?</h2>
                 <p className="text-gray-500 dark:text-gray-400">Selecione a cultura principal.</p>
              </div>
              
              <div className="space-y-2">
                 <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Cultura Selecionada</label>
                 
                 <div 
                   onClick={() => setIsCropListOpen(!isCropListOpen)}
                   className={`
                     relative w-full p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 flex items-center justify-between
                     bg-white dark:bg-slate-800 shadow-sm hover:shadow-md
                     ${isCropListOpen 
                        ? 'border-agro-green ring-2 ring-green-500/10' 
                        : selectedCropConfig ? 'border-gray-200 dark:border-slate-700' : 'border-gray-300 border-dashed'}
                   `}
                 >
                    <div className="flex items-center gap-4">
                        {selectedCropConfig ? (
                            <>
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-sm ${selectedCropConfig.color} text-white`}>
                                {selectedCropConfig.icon}
                                </div>
                                <div className="text-left">
                                <span className="block font-extrabold text-gray-900 dark:text-white text-lg">{selectedCropConfig.label}</span>
                                <span className="block text-xs text-gray-500 font-medium">Toque para alterar</span>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-gray-400">
                                <Sprout size={24} />
                                </div>
                                <div className="text-left">
                                <span className="block font-bold text-gray-500 text-lg">Selecione sua cultura</span>
                                <span className="block text-xs text-gray-400">Toque para abrir a lista</span>
                                </div>
                            </>
                        )}
                    </div>
                    <div className="text-gray-400 bg-gray-50 dark:bg-slate-700 p-2 rounded-lg">
                        {isCropListOpen ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                    </div>
                 </div>

                 <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isCropListOpen ? 'max-h-[600px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                        {CROP_OPTIONS.map((crop) => (
                        <div 
                            key={crop.id}
                            onClick={() => {
                                setFormData({...formData, type: crop.id});
                                setIsCropListOpen(false);
                            }}
                            className={`
                            relative p-3 rounded-xl border cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2 text-center h-32 group
                            ${formData.type === crop.id 
                                ? `border-transparent bg-gray-50 dark:bg-slate-700 shadow-inner ring-2 ${crop.ring}` 
                                : 'border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-50 hover:border-gray-300'}
                            `}
                        >
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-sm transition-transform group-hover:scale-110 ${crop.color} text-white`}>
                                {crop.icon}
                            </div>
                            <span className={`font-bold text-sm ${formData.type === crop.id ? 'text-gray-900 dark:text-white' : 'text-gray-600'}`}>
                                {crop.label}
                            </span>
                        </div>
                        ))}
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-100 dark:border-slate-700">
                <div className="animate-slide-up" style={{animationDelay: '0.1s'}}>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nome do Talhão</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="Ex: Talhão da Serra"
                    className="w-full p-4 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 focus:border-agro-green rounded-xl outline-none font-medium"
                  />
                </div>
                <div className="animate-slide-up" style={{animationDelay: '0.2s'}}>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Área (Hectares)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={formData.areaHa}
                      onChange={e => setFormData({...formData, areaHa: e.target.value})}
                      placeholder="0.0"
                      className="w-full p-4 pl-12 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 focus:border-agro-green rounded-xl outline-none font-medium"
                    />
                    <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
             <div className="space-y-6 animate-fade-in">
                <div className="text-center">
                   <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Localização</h2>
                   <p className="text-gray-500">Marque o centro da lavoura no mapa.</p>
                </div>
                <LocationPicker 
                  onLocationSelect={(lat, lng) => setFormData({...formData, coordinates: { lat, lng }})}
                  initialLat={formData.coordinates?.lat}
                  initialLng={formData.coordinates?.lng}
                />
             </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-fade-in">
              <div className="text-center">
                 <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dados Agronômicos</h2>
                 <p className="text-gray-500">Personalize para a cultura de {CROP_OPTIONS.find(c => c.id === formData.type)?.label}.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 text-center">Tipo de Solo</label>
                <div className="flex flex-wrap justify-center gap-3">
                  {['arenoso', 'argiloso', 'misto', 'humifero', 'calcario'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setFormData({...formData, soilType: type as SoilType})}
                      className={`px-6 py-3 rounded-xl border-2 transition-all capitalize font-bold text-center shadow-sm ${
                        formData.soilType === type 
                          ? 'border-agro-green bg-green-50 dark:bg-green-900/30 text-agro-green' 
                          : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600'
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
                      placeholder="Ex: 60 sc/ha"
                      className="w-full p-4 pl-12 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 focus:border-agro-green rounded-xl outline-none font-medium"
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
                      placeholder="Ex: 0.5m x 0.5m"
                      className="w-full p-4 pl-12 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 focus:border-agro-green rounded-xl outline-none font-medium"
                    />
                     <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col items-center justify-center text-center space-y-6 animate-fade-in">
               <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-2 animate-bounce shadow-lg ${formData.type ? CROP_OPTIONS.find(c => c.id === formData.type)?.color : 'bg-gray-200'}`}>
                  <span className="text-5xl">{formData.type ? CROP_OPTIONS.find(c => c.id === formData.type)?.icon : <Sprout />}</span>
               </div>
               
               <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Tudo pronto!</h2>
                  <p className="text-gray-500 max-w-md mx-auto mt-2">
                    Nossa IA vai gerar as <strong>etapas detalhadas</strong>, lista de insumos e custos para sua lavoura.
                  </p>
               </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50 flex justify-between items-center">
          {step > 1 && (
            <button 
              onClick={() => setStep(step - 1)}
              disabled={isLoading}
              className="px-6 py-3 text-gray-600 font-bold hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
            >
              Voltar
            </button>
          )}
          
          <div className="ml-auto">
            {step < 4 ? (
              <button 
                onClick={() => {
                  if(step === 1) {
                      if (!formData.type) return alert("Selecione uma cultura para continuar.");
                      if (!formData.name || !formData.areaHa) return alert("Preencha o nome e a área.");
                  }
                  if(step === 2 && !formData.coordinates && !confirm("Deseja continuar sem selecionar a localização?")) return;
                  setStep(step + 1);
                }}
                className="px-8 py-3 bg-agro-dark text-white font-bold rounded-xl shadow-lg flex items-center"
              >
                Continuar <ChevronRight size={18} className="ml-2"/>
              </button>
            ) : (
               <button 
                onClick={handleSubmit}
                disabled={isLoading}
                className="px-10 py-4 bg-agro-green text-white font-bold rounded-xl shadow-lg hover:bg-green-700 flex items-center disabled:opacity-70"
              >
                {isLoading ? <><Loader2 size={20} className="mr-2 animate-spin" /> Gerando Plano...</> : 'Gerar Planejamento'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
