
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
  type: ResourceType; // Categorization
  quantity: number;
  unit: string;
  unitCost: number; // Estimate per unit
  totalCost: number; // calculated
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
  // Legacy support for top-level, but mainly calculated from stages now
  name: string;
  quantity: number;
  unit: string;
  unitPriceEstimate: number;
  realCost?: number;
  category: 'fertilizante' | 'semente' | 'defensivo' | 'corretivo' | 'outros';
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
  
  // Calculated/Generated Data
  estimatedCost: number;
  estimatedHarvestDate: string;
  timeline: TimelineStage[]; // This is now the source of truth for costs
  
  // Legacy/Aggregated fields (optional to keep for backward compatibility or caching)
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
