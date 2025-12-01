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
  endDate?: string;
  tasks: { id: string; text: string; done: boolean }[];
}

export interface HarvestLog {
  id: string;
  date: string;
  quantity: number;
  unit: string; // sc, ton, kg
  location: string; // Silo 1, Armazém, Cooperativa
  qualityNote?: string; // Umidade 13%, Ardidos 2%, etc
}

export interface CropData {
  id: string;
  name: string;
  type: CropType;
  areaHa: number;
  soilType: SoilType;
  coordinates?: Coordinates;
  productivityGoal: string; // e.g. "60 sc/ha"
  spacing: string;
  datePlanted: string;
  
  // Calculated/Generated Data
  estimatedCost: number;
  estimatedHarvestDate: string;
  materials: Material[];
  timeline: TimelineStage[];
  harvestLogs?: HarvestLog[]; // New field for Post-Harvest
  aiAdvice: string;
}

export interface WeatherData {
  temp: number;
  condition: string;
  humidity: number;
  wind: number;
}
