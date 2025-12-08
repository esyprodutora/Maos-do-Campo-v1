
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
    1. 'insumo': Fertilizantes (NPK, Ureia), sementes, defensivos (Herbicidas, Fungicidas).
    2. 'maquinario': Horas-máquina de Tratores, Colheitadeiras, Pulverizadores, Implementos, Combustível (Diesel).
    3. 'mao_de_obra': Diárias de trabalhadores, operadores, técnicos.

    Preço Unitário: Estime preços reais de mercado brasileiro (BRL) atualizados.
    Quantidade: Calcule a quantidade necessária para ${areaHa} hectares.

    SAÍDA ESPERADA (JSON):
    Um objeto contendo:
    - estimatedHarvestDate (YYYY-MM-DD)
    - aiAdvice (Conselho técnico curto sobre o manejo)
    - timeline: Array de etapas. Cada etapa tem:
        - title (Nome da etapa)
        - description (Descrição técnica breve)
        - dateEstimate (Mês/Ano estimado)
        - tasks: Lista de tarefas operacionais (checklist simples)
        - resources: Array de recursos { name, type, quantity, unit, unitCost }
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
      
      // Post-processing to add IDs and Defaults
      let totalCost = 0;
      const processedTimeline = data.timeline.map((stage: any) => {
          const stageResources = (stage.resources || []).map((res: any) => {
             const cost = res.quantity * res.unitCost;
             totalCost += cost;
             return {
                 ...res,
                 id: Math.random().toString(36).substr(2, 9),
                 totalCost: cost
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
        estimatedCost: totalCost
      };
    }
    throw new Error("Falha ao gerar dados");
  } catch (error) {
    console.error("Erro na IA:", error);
    // Return empty safe object to avoid crash
    return {
      estimatedCost: 0,
      estimatedHarvestDate: new Date().toISOString().split('T')[0],
      aiAdvice: "Não foi possível gerar o plano. Verifique sua chave de API.",
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
        return "Erro de conexão com o assistente.";
    }
}
