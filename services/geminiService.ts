
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
    Atue como um Engenheiro Agrônomo Sênior e Gerente de Fazenda especialista em ${type}.
    
    OBJETIVO:
    Criar a "ESPINHA DORSAL" operacional de uma lavoura de ${areaHa} ha de ${type}.
    A sequência deve ser cronológica e lógica, cobrindo do ZERO até o ARMAZENAMENTO.

    ESTRUTURA DE ETAPAS (Timeline):
    Gere entre 5 a 8 etapas macro, obrigatoriamente seguindo este fluxo lógico:
    1. Preparo do Solo (Análise, correção, aragem).
    2. Plantio/Semeadura (Momento crítico).
    3. Manejo Vegetativo (Desenvolvimento).
    4. Manejo Reprodutivo/Sanitário (Florada, enchimento, pragas).
    5. Colheita (A operação de retirada).
    6. Pós-Colheita/Beneficiamento (Secagem, limpeza, transporte interno).
    7. Estoque/Armazenamento (Finalização).

    PARA CADA ETAPA, GERE RECURSOS DETALHADOS (Estimativa em BRL R$):
    - 'insumo': Sementes, Adubos, Defensivos.
    - 'maquinario': Tratores, Colheitadeiras, Secadores. (Indique se é 'alugado' ou 'proprio' no nome se relevante).
    - 'mao_de_obra': Operadores, diaristas.

    Input:
    - Área: ${areaHa} ha
    - Solo: ${soilType}
    - Meta: ${productivityGoal}

    SAÍDA JSON:
    {
      "estimatedHarvestDate": "YYYY-MM-DD",
      "aiAdvice": "Conselho gerencial curto.",
      "timeline": [
        {
          "title": "Nome da Etapa",
          "type": "preparo" | "plantio" | "manejo" | "colheita" | "pos_colheita",
          "description": "O que fazer.",
          "dateEstimate": "Mês/Ano",
          "tasks": [{ "text": "Tarefa" }],
          "resources": [
             { "name": "Recurso", "type": "insumo" | "maquinario" | "mao_de_obra", "quantity": number, "unit": "un", "unitCost": number }
          ]
        }
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
            estimatedHarvestDate: { type: Type.STRING },
            aiAdvice: { type: Type.STRING },
            timeline: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ['preparo', 'plantio', 'manejo', 'colheita', 'pos_colheita'] },
                  description: { type: Type.STRING },
                  dateEstimate: { type: Type.STRING },
                  tasks: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        text: { type: Type.STRING },
                      }
                    }
                  },
                  resources: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        type: { type: Type.STRING, enum: ['insumo', 'maquinario', 'mao_de_obra', 'outros'] },
                        quantity: { type: Type.NUMBER },
                        unit: { type: Type.STRING },
                        unitCost: { type: Type.NUMBER }
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
      
      let totalCost = 0;
      const processedTimeline = data.timeline.map((stage: any) => {
          const stageResources = (stage.resources || []).map((res: any) => {
             const cost = res.quantity * res.unitCost;
             totalCost += cost;
             return {
                 ...res,
                 id: Math.random().toString(36).substr(2, 9),
                 totalCost: cost,
                 ownership: res.type === 'maquinario' ? 'alugado' : undefined // Default assumption for AI, user can change
             };
          });

          const stageTasks = (stage.tasks || []).map((t: any) => ({
              id: Math.random().toString(36).substr(2, 9),
              text: t.text,
              done: false
          }));

          return {
              id: Math.random().toString(36).substr(2, 9),
              title: stage.title,
              type: stage.type || 'manejo',
              description: stage.description,
              status: 'pendente',
              dateEstimate: stage.dateEstimate,
              tasks: stageTasks,
              resources: stageResources
          };
      });

      return {
        estimatedHarvestDate: data.estimatedHarvestDate,
        aiAdvice: data.aiAdvice,
        timeline: processedTimeline,
        estimatedCost: totalCost,
        inventory: [],
        transactions: []
      };
    }
    throw new Error("Falha ao gerar dados");
  } catch (error) {
    console.error("Erro na IA:", error);
    return {
      estimatedCost: 0,
      estimatedHarvestDate: new Date().toISOString().split('T')[0],
      aiAdvice: "Erro na geração do plano.",
      timeline: [],
      inventory: [],
      transactions: []
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
        return "Erro de conexão com o assistente.";
    }
}
