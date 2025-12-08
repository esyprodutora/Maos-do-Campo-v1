
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
  // New specific fields
  ownership?: 'proprio' | 'alugado'; // For machinery
  details?: string; // e.g., "Diesel" or "Manutenção" for owned machines
}

export interface TimelineStage {
  id: string;
  title: string;
  description: string;
  status: 'pendente' | 'em_andamento' | 'concluido';
  dateEstimate: string;
  resources: StageResource[]; 
  tasks: { id: string; text: string; done: boolean }[];
  type?: 'preparo' | 'plantio' | 'manejo' | 'colheita' | 'pos_colheita'; // Semantic type
}

export interface InventoryItem {
  id: string;
  cropType: CropType;
  quantity: number;
  unit: string; // 'sc', 'ton', 'kg'
  dateStored: string;
  location: string; // 'Silo 1', 'Tulha', 'Cooperativa'
  quality?: string; // 'Tipo 6', 'Padrão Exportação'
  estimatedUnitValue?: number; // Snapshot of value at storage time or current
}

export interface FinancialTransaction {
  id: string;
  description: string;
  amount: number;
  type: 'despesa' | 'receita';
  category: 'insumo' | 'maquinario' | 'mao_de_obra' | 'venda' | 'outros';
  date: string;
  status: 'pago' | 'pendente';
  relatedStageId?: string; // Link to a stage
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
  timeline: TimelineStage[]; // The Backbone
  
  // New Modules
  inventory: InventoryItem[];
  transactions: FinancialTransaction[];
  
  aiAdvice: string;
  
  // Legacy
  materials?: any[]; 
  harvestLogs?: any[];
}

export interface WeatherData {
  temp: number;
  condition: string;
  humidity: number;
  wind: number;
  location: string;
  isDay: boolean;
}
