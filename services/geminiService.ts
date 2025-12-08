
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
    Atue como um Engenheiro Agrônomo Sênior e Gerente de Fazenda com 30 anos de experiência em ${type}.
    
    OBJETIVO:
    Criar um PLANO OPERACIONAL E ORÇAMENTÁRIO DETALHADO (PONTA A PONTA) para uma lavoura de ${areaHa} hectares de ${type}.
    
    CRITÉRIO CRÍTICO:
    Você NÃO PODE parar na adubação. Você DEVE cobrir o ciclo inteiro até o produto estar ensacado/armazenado.
    
    ESTRUTURA DE ETAPAS OBRIGATÓRIA (Adaptar para a cultura, mas manter a profundidade):
    1. Preparo & Correção (Análise, Calagem, Gessagem, Aragem).
    2. Plantio/Instalação (Mudas, Sulcos, Adubação de base).
    3. Tratos Culturais - Vegetativo (Controle de mato, Adubações de cobertura).
    4. Tratos Culturais - Reprodutivo/Fitossanitário (Preventivos, Foliar, Enchimento de grão).
    5. COLHEITA (Detalhamento máx: Maquinário, Combustível, Mão de obra temporária, Varrição).
    6. PÓS-COLHEITA (CRUCIAL PARA CAFÉ/GRÃOS): Transporte interno, Lavador, Terreiro/Secador (Lenha/Gás), Beneficiamento, Ensacamento.
    
    PARA CADA ETAPA, GERE UMA LISTA DE RECURSOS (BRL R$):
    - 'insumo': Ex: NPK 20-00-20, Herbicida Glifosato, Calcário, Mudas.
    - 'maquinario': Ex: Trator 75cv (horas), Colheitadeira (horas), Secador Rotativo (horas), Caminhão.
    - 'mao_de_obra': Ex: Tratorista (dias), Apanhador de café (dias), Operador de secador (dias).

    Input:
    - Área: ${areaHa} ha
    - Solo: ${soilType}
    - Meta: ${productivityGoal}
    - Espaçamento: ${spacing}

    SAÍDA JSON:
    {
      "estimatedHarvestDate": "YYYY-MM-DD",
      "aiAdvice": "Dica estratégica focada em lucro e eficiência.",
      "timeline": [
        {
          "title": "Nome Técnico da Etapa",
          "description": "Explicação agronômica do que fazer.",
          "dateEstimate": "Mês/Ano",
          "tasks": [{ "text": "Ação prática 1" }, { "text": "Ação prática 2" }],
          "resources": [
             { "name": "Nome do Recurso", "type": "insumo" | "maquinario" | "mao_de_obra", "quantity": number, "unit": "kg/l/h/dia", "unitCost": number (BRL) }
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
    return {
      estimatedCost: 0,
      estimatedHarvestDate: new Date().toISOString().split('T')[0],
      aiAdvice: "Erro na geração do plano. Verifique a API Key.",
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
