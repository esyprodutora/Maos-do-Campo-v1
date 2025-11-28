export type CropType = 'cafe' | 'milho' | 'soja';

export type SoilType = 'arenoso' | 'argiloso' | 'misto';

export interface Material {
  name: string;
  quantity: number;
  unit: string;
  unitPriceEstimate: number;
  category: 'fertilizante' | 'semente' | 'defensivo' | 'corretivo' | 'outros';
}

export interface TimelineStage {
  id: string;
  title: string;
  description: string;
  status: 'pendente' | 'em_andamento' | 'concluido';
  dateEstimate: string;
  tasks: { id: string; text: string; done: boolean }[];
}

export interface CropData {
  id: string;
  name: string;
  type: CropType;
  areaHa: number;
  soilType: SoilType;
  productivityGoal: string; // e.g. "60 sc/ha"
  spacing: string;
  datePlanted: string;
  
  // Calculated/Generated Data
  estimatedCost: number;
  estimatedHarvestDate: string;
  materials: Material[];
  timeline: TimelineStage[];
  aiAdvice: string; // General advice
}

export interface WeatherData {
  temp: number;
  condition: string;
  humidity: number;
  wind: number;
}
