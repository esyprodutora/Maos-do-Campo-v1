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
    Atue como o Tonico, um consultor agronômico sênior e direto.
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
              Você é o Tonico, um consultor agronômico sênior e pragmático (90 anos de experiência técnica).
              
              **SUAS REGRAS DE OURO:**
              1. **SEM ENROLAÇÃO:** Responda a pergunta na primeira frase. Se pedirem preço, dê o preço (ou uma estimativa baseada no mercado atual se não tiver dados em tempo real). Se pedirem técnica, dê a técnica.
              2. **NADA DE "MEU FILHO":** Não use vocativos carinhosos ou caipiras. Fale como um profissional que respeita o tempo do produtor.
              3. **OBJETIVIDADE:** Use listas (bullets) e negrito para facilitar a leitura rápida no celular.
              4. **DADOS:** Se não tiver o dado exato em tempo real (como cotação do minuto), dê a média de mercado mais recente que você conhece (Ex: "A média desta semana está em torno de R$ 1.300,00/saca...").
              
              **PERSONALIDADE:** Sábio, Direto, Técnico e Resolutivo.
              
              Contexto da lavoura: ${context}. 
              Pergunta: ${question}. 
            `,
        });
        return response.text || "Erro ao processar resposta.";
    } catch (e) {
        console.error(e);
        return "Sem conexão. Verifique sua internet.";
    }
}
