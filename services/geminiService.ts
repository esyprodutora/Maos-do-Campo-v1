import { GoogleGenAI, Type } from "@google/genai";
import { CropData, CropType, SoilType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateCropPlan = async (
  name: string,
  type: CropType,
  areaHa: number,
  soilType: SoilType,
  productivityGoal: string,
  spacing: string
): Promise<Partial<CropData>> => {
  
  const prompt = `
    Atue como um engenheiro agrônomo especialista. Vou fornecer dados de uma nova lavoura e preciso de um planejamento completo.
    
    Dados:
    - Cultura: ${type}
    - Área: ${areaHa} hectares
    - Tipo de Solo: ${soilType}
    - Meta de Produtividade: ${productivityGoal}
    - Espaçamento: ${spacing}

    Gere um plano técnico contendo:
    1. Uma lista de materiais estimados (insumos) para o ciclo completo (NPK, Calcário, Sementes, Defensivos), com preços médios de mercado no Brasil (em R$).
    2. Um custo total estimado da lavoura.
    3. Uma data prevista de colheita (considerando plantio hoje).
    4. Um cronograma (timeline) com 5 a 7 etapas principais do ciclo, com checklists de tarefas.
    5. Um conselho técnico resumido (aiAdvice) sobre cuidados específicos para esse cenário.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            estimatedCost: { type: Type.NUMBER, description: "Custo total estimado em Reais" },
            estimatedHarvestDate: { type: Type.STRING, description: "Data formato YYYY-MM-DD" },
            aiAdvice: { type: Type.STRING, description: "Conselho técnico curto e prático" },
            materials: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  unit: { type: Type.STRING, description: "kg, sc, litros, ton" },
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
                  status: { type: Type.STRING, enum: ['pendente'] }, // Start all as pending
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
      return data;
    }
    throw new Error("Falha ao gerar dados");
  } catch (error) {
    console.error("Erro na IA:", error);
    // Fallback básico para não quebrar o app se a API falhar ou chave for inválida
    return {
      estimatedCost: areaHa * 5000,
      estimatedHarvestDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 120).toISOString().split('T')[0],
      aiAdvice: "Verifique a análise de solo antes de iniciar.",
      materials: [],
      timeline: []
    };
  }
};

export const getAssistantResponse = async (question: string, context: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Contexto da lavoura: ${context}. \nPergunta do produtor: ${question}. \nResponda de forma curta, prática e amigável, como um técnico agrícola.`,
        });
        return response.text || "Desculpe, não consegui processar sua pergunta no momento.";
    } catch (e) {
        return "Erro de conexão com o assistente.";
    }
}
