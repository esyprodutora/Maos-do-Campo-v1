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

// Fallback robusto
const getFallbackData = (name: string, type: string, areaHa: number): Partial<CropData> => {
  const today = new Date();
  const harvestDate = new Date(today);
  harvestDate.setDate(today.getDate() + 120); 

  const baseCostPerHa = 3500; 
  const isSeed = ['soja', 'milho', 'arroz', 'trigo', 'feijao', 'algodao'].includes(type);
  
  return {
    estimatedCost: areaHa * baseCostPerHa,
    estimatedHarvestDate: harvestDate.toISOString().split('T')[0],
    aiAdvice: `Para ${type}, o foco inicial é a correção de solo. Garanta o calcário antes do plantio para maximizar a produtividade.`,
    materials: [
      {
        name: isSeed ? "Sementes Certificadas" : "Mudas Selecionadas",
        quantity: areaHa * (isSeed ? 60 : 3500),
        unit: isSeed ? "kg" : "und",
        unitPriceEstimate: isSeed ? 25.00 : 1.50,
        category: "semente"
      },
      {
        name: "NPK 04-14-08",
        quantity: areaHa * 4, 
        unit: "sc 50kg",
        unitPriceEstimate: 180.00,
        category: "fertilizante"
      },
      {
        name: "Defensivo Geral",
        quantity: areaHa * 2,
        unit: "litros",
        unitPriceEstimate: 85.00,
        category: "defensivo"
      }
    ],
    timeline: [
      {
        id: "1",
        title: "Preparo do Solo",
        description: "Amostragem e correção.",
        status: "pendente",
        dateEstimate: new Date().toLocaleDateString('pt-BR'),
        tasks: [{ id: "t1", text: "Análise de solo", done: false }]
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
  
  const isSeeding = ['soja', 'milho', 'algodao', 'arroz', 'feijao', 'trigo'].includes(type);
  const materialType = isSeeding ? 'Sementes' : 'Mudas';

  const prompt = `
    Atue como o Tonico, um agrônomo sênior e pragmático.
    Dados: Cultura ${type} (${materialType}), Área ${areaHa}ha, Solo ${soilType}, Meta ${productivityGoal}, Espaçamento ${spacing}.

    Gere um JSON técnico e preciso com:
    1. estimatedCost (number)
    2. estimatedHarvestDate (YYYY-MM-DD)
    3. aiAdvice (string - Curto, direto e técnico. Máximo 2 frases.)
    4. materials (array): {name, quantity, unit, unitPriceEstimate, category}
    5. timeline (array): {id, title, description, status='pendente', dateEstimate, tasks:[{id, text, done=false}]}
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
      if (!data.materials?.length || !data.timeline?.length) throw new Error("Dados incompletos");
      return data;
    }
    throw new Error("Falha ao gerar dados");
  } catch (error) {
    console.error("Erro na IA:", error);
    return getFallbackData(name, type, areaHa);
  }
};

export const getAssistantResponse = async (question: string, context: string): Promise<string> => {
    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `
              Você é o Tonico, um especialista em agronegócio com décadas de experiência prática.
              
              Sua comunicação deve ser:
              1. **Direta e Objetiva:** Vá direto ao ponto, sem rodeios ou saudações longas.
              2. **Técnica e Sábia:** Use seu conhecimento para dar a melhor solução, mas com linguagem clara.
              3. **Bem Formatada:** Use tópicos (bullets), negrito para destacar números ou produtos, e quebras de linha. Evite blocos de texto gigantes.
              4. **Sem Gírias:** Evite termos como "meu filho", "uai", "sô". Seja profissional e sênior.
              
              Contexto da lavoura: ${context}. 
              Pergunta: ${question}. 
              
              Responda de forma concisa e estruturada.
            `,
        });
        return response.text || "Houve um erro na comunicação. Tente novamente.";
    } catch (e) {
        console.error(e);
        return "Erro de conexão. Verifique sua internet.";
    }
}
