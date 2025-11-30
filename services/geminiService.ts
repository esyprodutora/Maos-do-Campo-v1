// @ts-ignore
import { GoogleGenAI, Type } from "@google/genai";
import { CropData, CropType, SoilType } from "../types";
import { GEMINI_API_KEY } from "../config/env";

// Lazy initialization
const getAiClient = () => {
  if (!GEMINI_API_KEY) {
    console.warn("API Key não encontrada. Verifique as variáveis de ambiente.");
    throw new Error("Chave de API não configurada");
  }
  return new GoogleGenAI({ apiKey: GEMINI_API_KEY });
};

// Fallback robusto para garantir que o app NUNCA mostre dados vazios
const getFallbackData = (name: string, type: string, areaHa: number): Partial<CropData> => {
  const today = new Date();
  const harvestDate = new Date(today);
  harvestDate.setDate(today.getDate() + 120); // +4 meses padrão

  // Estimativa básica de custos (R$ 3500 por ha padrão)
  const baseCostPerHa = 3500; 
  
  return {
    estimatedCost: areaHa * baseCostPerHa,
    estimatedHarvestDate: harvestDate.toISOString().split('T')[0],
    aiAdvice: `Para ${type} em uma área de ${areaHa}ha, foque na análise de solo inicial e monitoramento de pragas. Mantenha a adubação de cobertura em dia.`,
    materials: [
      {
        name: "Sementes Certificadas",
        quantity: areaHa * 60, // ex: 60kg/ha
        unit: "kg",
        unitPriceEstimate: 25.00,
        category: "semente"
      },
      {
        name: "NPK 04-14-08",
        quantity: areaHa * 4, // ex: 4 sacos/ha
        unit: "sc 50kg",
        unitPriceEstimate: 180.00,
        category: "fertilizante"
      },
      {
        name: "Ureia Agrícola",
        quantity: areaHa * 2,
        unit: "sc 50kg",
        unitPriceEstimate: 150.00,
        category: "fertilizante"
      },
      {
        name: "Herbicida Pré-emergente",
        quantity: areaHa * 2,
        unit: "litros",
        unitPriceEstimate: 85.00,
        category: "defensivo"
      },
      {
        name: "Calcário Dolomítico",
        quantity: areaHa * 1, 
        unit: "ton",
        unitPriceEstimate: 200.00,
        category: "corretivo"
      }
    ],
    timeline: [
      {
        id: "1",
        title: "Preparo do Solo",
        description: "Amostragem de solo, calagem e gessagem conforme análise.",
        status: "pendente",
        dateEstimate: new Date(today.setDate(today.getDate() + 5)).toLocaleDateString('pt-BR'),
        tasks: [
          { id: "t1", text: "Coletar amostras de solo", done: false },
          { id: "t2", text: "Aplicar calcário", done: false }
        ]
      },
      {
        id: "2",
        title: "Plantio",
        description: "Semeadura observando espaçamento e profundidade ideais.",
        status: "pendente",
        dateEstimate: new Date(today.setDate(today.getDate() + 15)).toLocaleDateString('pt-BR'),
        tasks: [
          { id: "t3", text: "Regular semeadora", done: false },
          { id: "t4", text: "Executar plantio", done: false }
        ]
      },
      {
        id: "3",
        title: "Manejo e Tratos",
        description: "Aplicação de fungicidas, inseticidas e adubação de cobertura.",
        status: "pendente",
        dateEstimate: new Date(today.setDate(today.getDate() + 45)).toLocaleDateString('pt-BR'),
        tasks: [
          { id: "t5", text: "Aplicação foliar", done: false },
          { id: "t6", text: "Monitorar pragas", done: false }
        ]
      },
      {
        id: "4",
        title: "Colheita",
        description: "Monitoramento da umidade do grão e colheita.",
        status: "pendente",
        dateEstimate: new Date(today.setDate(today.getDate() + 60)).toLocaleDateString('pt-BR'),
        tasks: [
          { id: "t7", text: "Regular colheitadeira", done: false },
          { id: "t8", text: "Transporte", done: false }
        ]
      }
    ]
  };
};

export const generateCropPlan = async (
  name: string,
  type: CropType,
  areaHa: number,
  soilType: SoilType,
  productivityGoal: string,
  spacing: string
): Promise<Partial<CropData>> => {
  
  const prompt = `
    Atue como um engenheiro agrônomo. Gere um JSON estrito para uma lavoura de ${type}.
    Dados: Área ${areaHa}ha, Solo ${soilType}, Meta ${productivityGoal}, Espaçamento ${spacing}.

    Output JSON esperado:
    {
      "estimatedCost": number (custo total em BRL),
      "estimatedHarvestDate": "YYYY-MM-DD",
      "aiAdvice": "string",
      "materials": [
        { "name": "string", "quantity": number, "unit": "string", "unitPriceEstimate": number, "category": "fertilizante" | "semente" | "defensivo" | "corretivo" | "outros" }
      ],
      "timeline": [
        { "id": "string", "title": "string", "description": "string", "status": "pendente", "dateEstimate": "DD/MM/YYYY", "tasks": [{ "id": "string", "text": "string", "done": boolean }] }
      ]
    }
  `;

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            estimatedCost: { type: Type.NUMBER },
            estimatedHarvestDate: { type: Type.STRING },
            aiAdvice: { type: Type.STRING },
            materials: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  unit: { type: Type.STRING },
                  unitPriceEstimate: { type: Type.NUMBER },
                  category: { type: Type.STRING, enum: ['fertilizante', 'semente', 'defensivo', 'corretivo', 'outros'] }
                }
              }
            },
            timeline: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  status: { type: Type.STRING, enum: ['pendente'] },
                  dateEstimate: { type: Type.STRING },
                  tasks: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        text: { type: Type.STRING },
                        done: { type: Type.BOOLEAN }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      // Validação básica para garantir que arrays não venham vazios da IA
      if (!data.materials || data.materials.length === 0 || !data.timeline || data.timeline.length === 0) {
        throw new Error("IA retornou dados vazios");
      }
      return data;
    }
    throw new Error("Falha ao gerar dados");
  } catch (error) {
    console.error("Erro na IA, usando dados de fallback:", error);
    return getFallbackData(name, type, areaHa);
  }
};

export const getAssistantResponse = async (question: string, context: string): Promise<string> => {
    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Contexto da lavoura: ${context}. \nPergunta do produtor: ${question}. \nResponda de forma curta, prática e amigável, como um técnico agrícola.`,
        });
        return response.text || "Desculpe, não consegui processar sua pergunta no momento.";
    } catch (e) {
        console.error(e);
        return "Erro de conexão com o assistente ou chave de API inválida.";
    }
}
