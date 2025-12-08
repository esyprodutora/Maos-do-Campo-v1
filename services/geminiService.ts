
// @ts-ignore
import { GoogleGenAI, Type } from "@google/genai";
import { CropData, CropType, SoilType } from "../types";

// Lazy initialization
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API Key não encontrada.");
    throw new Error("Chave de API não configurada");
  }
  return new GoogleGenAI({ apiKey });
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
    Atue como um Engenheiro Agrônomo Sênior especialista em gestão de fazendas no Brasil.
    Preciso de um PLANO OPERACIONAL COMPLETO para uma lavoura de ${type}.
    
    DADOS DA LAVOURA:
    - Área: ${areaHa} hectares
    - Solo: ${soilType}
    - Meta: ${productivityGoal}
    - Espaçamento: ${spacing}

    OBJETIVO:
    Gere um cronograma detalhado de ponta a ponta. 
    Exemplo de profundidade para Café: Análise de Solo -> Preparo (Calagem/Gessagem) -> Plantio -> Tratos Culturais (Adubação/Fitossanitário) -> Colheita (Mecanizada/Manual) -> Pós-Colheita (Secagem/Terreiro/Secador) -> Beneficiamento -> Transporte/Silo.
    
    ESTRUTURA OBRIGATÓRIA PARA CADA ETAPA:
    Para CADA etapa do ciclo, você DEVE listar os recursos necessários divididos em 3 categorias:
    1. 'insumo': Fertilizantes, sementes, defensivos, corretivos.
    2. 'maquinario': Horas-máquina de Tratores, Colheitadeiras, Pulverizadores, Implementos, Combustível.
    3. 'mao_de_obra': Diárias de trabalhadores, operadores, técnicos.

    Preço Unitário: Estime preços reais de mercado brasileiro (BRL) atualizados.
    Quantidade: Calcule a quantidade necessária para ${areaHa} hectares.

    SAÍDA ESPERADA (JSON):
    Um objeto contendo:
    - estimatedHarvestDate (YYYY-MM-DD)
    - aiAdvice (Conselho técnico curto)
    - timeline: Array de etapas. Cada etapa tem:
        - title, description, dateEstimate
        - tasks: Lista de tarefas (checklist simples)
        - resources: Array de recursos { name, type, quantity, unit, unitCost, totalCost }
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
            estimatedHarvestDate: { type: Type.STRING },
            aiAdvice: { type: Type.STRING },
            timeline: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING }, // AI can generate or we fill
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
                  },
                  resources: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        name: { type: Type.STRING },
                        type: { type: Type.STRING, enum: ['insumo', 'maquinario', 'mao_de_obra', 'outros'] },
                        quantity: { type: Type.NUMBER },
                        unit: { type: Type.STRING },
                        unitCost: { type: Type.NUMBER },
                        totalCost: { type: Type.NUMBER }
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
      
      // Calculate total estimated cost based on all resources in timeline
      let totalCost = 0;
      data.timeline.forEach((stage: any) => {
          stage.id = Math.random().toString(36).substr(2, 9);
          if (stage.resources) {
              stage.resources.forEach((res: any) => {
                  res.id = Math.random().toString(36).substr(2, 9);
                  // Ensure total cost is accurate
                  res.totalCost = res.quantity * res.unitCost;
                  totalCost += res.totalCost;
              });
          } else {
              stage.resources = [];
          }
          if (stage.tasks) {
              stage.tasks.forEach((t: any) => t.id = Math.random().toString(36).substr(2, 9));
          }
      });

      return {
        ...data,
        estimatedCost: totalCost
      };
    }
    throw new Error("Falha ao gerar dados");
  } catch (error) {
    console.error("Erro na IA:", error);
    return {
      estimatedCost: 0,
      estimatedHarvestDate: new Date().toISOString().split('T')[0],
      aiAdvice: "Erro ao gerar plano. Tente novamente.",
      timeline: []
    };
  }
};

export const getAssistantResponse = async (question: string, context: string): Promise<string> => {
    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Contexto da lavoura: ${context}. \nPergunta do produtor: ${question}. \nResponda de forma curta, prática e técnica.`,
        });
        return response.text || "Desculpe, não entendi.";
    } catch (e) {
        return "Erro de conexão.";
    }
}
