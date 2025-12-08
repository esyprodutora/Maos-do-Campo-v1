
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
  
  // Prompt de Engenharia Agronômica Avançada
  const prompt = `
    Atue como um Engenheiro Agrônomo Sênior especializado em ${type} no Brasil.
    
    TAREFA CRÍTICA:
    Gerar um CRONOGRAMA OPERACIONAL COMPLETO E DETALHADO (Passo a Passo) para ${areaHa} hectares.
    Não resuma. Eu preciso de GRANULARIDADE.
    
    O cronograma DEVE conter entre 12 a 20 etapas distintas, cobrindo explicitamente:
    1. PREPARO: Análise de solo, Calagem, Gessagem, Subsolagem/Gradagem.
    2. PRÉ-PLANTIO: Dessecação, Tratamento de sementes.
    3. PLANTIO: A operação de semeadura/plantio em si.
    4. VEGETATIVO: Adubação de Cobertura 1, Controle de Ervas Daninhas.
    5. REPRODUTIVO: Fungicida 1, Inseticida 1, Adubação Foliar.
    6. MATURAÇÃO: Aplicação final ou Dessecação pré-colheita (se aplicável).
    7. COLHEITA: Operação mecanizada ou manual.
    8. PÓS-COLHEITA: Transporte interno, Secagem/Beneficiamento, Armazenamento.

    PARA CADA ETAPA, GERE A LISTA DE CUSTOS (RECURSOS) NECESSÁRIOS:
    Você deve estimar quantidades realistas para ${areaHa} hectares e custos médios em Reais (BRL).
    Classifique ESTRITAMENTE em:
    - 'insumo': Sementes, Calcário, Gesso, NPK, Ureia, Herbicidas, Fungicidas.
    - 'maquinario': Trator (horas), Pulverizador (horas), Colheitadeira (horas), Caminhão (diárias).
    - 'mao_de_obra': Operador de máquinas (dias), Trabalhador rural (dias), Agrônomo (visitas).

    Input:
    - Cultura: ${type}
    - Área: ${areaHa} ha
    - Solo: ${soilType}
    - Meta: ${productivityGoal}

    FORMATO JSON OBRIGATÓRIO:
    {
      "estimatedHarvestDate": "YYYY-MM-DD",
      "aiAdvice": "Dica técnica curta e direta.",
      "timeline": [
        {
          "title": "Nome da Etapa (Ex: 1. Calagem)",
          "type": "preparo" | "plantio" | "manejo" | "colheita" | "pos_colheita",
          "description": "Descrição técnica breve.",
          "dateEstimate": "Mês/Ano",
          "tasks": [{ "text": "Ação operacional 1" }],
          "resources": [
             { 
               "name": "Nome do Item (Ex: Calcário Dolomítico)", 
               "type": "insumo" | "maquinario" | "mao_de_obra", 
               "quantity": number, 
               "unit": "ton" | "kg" | "lt" | "h" | "dia", 
               "unitCost": number 
             }
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
        // Aumentando tokens para garantir resposta longa e detalhada
        maxOutputTokens: 8192, 
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
                 ownership: res.type === 'maquinario' ? 'alugado' : undefined // Default para IA, editável na UI
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
      aiAdvice: "Erro na geração. Verifique a chave API ou tente novamente.",
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
