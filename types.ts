
export type CropType = 
  | 'soja' 
  | 'milho' 
  | 'cafe' 
  | 'cana' 
  | 'algodao' 
  | 'arroz' 
  | 'feijao' 
  | 'trigo' 
  | 'laranja' 
  | 'mandioca';

export type SoilType = 'arenoso' | 'argiloso' | 'misto' | 'humifero' | 'calcario';

export interface Coordinates {
  lat: number;
  lng: number;
}

export type ResourceType = 'insumo' | 'maquinario' | 'mao_de_obra' | 'outros';

export interface StageResource {
  id: string;
  name: string;
  type: ResourceType;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
}

export interface TimelineStage {
  id: string;
  title: string;
  description: string;
  status: 'pendente' | 'em_andamento' | 'concluido';
  dateEstimate: string;
  resources: StageResource[]; // Detailed resources for this stage
  tasks: { id: string; text: string; done: boolean }[]; // Checklist items
}

export interface HarvestLog {
  id: string;
  date: string;
  quantity: number;
  unit: string;
  location: string;
  qualityNote?: string;
}

export interface Material {
  // Legacy/Derived interface for backward compatibility
  name: string;
  quantity: number;
  unit: string;
  unitPriceEstimate: number;
  realCost?: number;
  category: string;
}

export interface CropData {
  id: string;
  name: string;
  type: CropType;
  areaHa: number;
  soilType: SoilType;
  coordinates?: Coordinates;
  productivityGoal: string; 
  spacing: string;
  datePlanted: string;
  
  // Core Data
  estimatedCost: number;
  estimatedHarvestDate: string;
  timeline: TimelineStage[]; // Source of truth for all operations and costs
  
  // Legacy/Aggregated fields
  materials?: Material[]; 
  harvestLogs?: HarvestLog[];
  
  aiAdvice: string;
}

export interface WeatherData {
  temp: number;
  condition: string;
  humidity: number;
  wind: number;
  location: string;
  isDay: boolean;
}
