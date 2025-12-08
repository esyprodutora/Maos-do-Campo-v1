
// @ts-ignore
import { GoogleGenAI, Type } from "@google/genai";
import { CropData, CropType, SoilType } from "../types";

// --- FALLBACK TEMPLATES (The Safety Net) ---
const FALLBACK_PLANS: Record<string, any> = {
  'soja': {
    estimatedHarvestDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(), // +120 days
    aiAdvice: "Foco total no monitoramento da Ferrugem Asiática entre o estágio R1 e R5.",
    timeline: [
      {
        title: "1. Dessecação Pré-Plantio",
        type: "preparo",
        description: "Eliminação da cobertura verde para garantir plantio no limpo.",
        dateEstimate: "Dia -20",
        tasks: [{text: "Vistoria de plantas daninhas resistentes"}, {text: "Aplicação de herbicidas sistêmicos"}],
        resources: [
            {name: "Glifosato", type: "insumo", quantity: 3, unit: "lt/ha", unitCost: 45},
            {name: "Pulverizador", type: "maquinario", quantity: 0.5, unit: "h/ha", unitCost: 150},
            {name: "Operador", type: "mao_de_obra", quantity: 0.1, unit: "dia/ha", unitCost: 120}
        ]
      },
      {
        title: "2. Plantio e Adubação Base",
        type: "plantio",
        description: "Semeadura com adubação no sulco.",
        dateEstimate: "Dia 0",
        tasks: [{text: "Regulagem da semeadora"}, {text: "Abastecimento de sementes e adubo"}, {text: "Plantio efetivo"}],
        resources: [
            {name: "Semente Soja Intacta", type: "insumo", quantity: 60, unit: "kg/ha", unitCost: 12},
            {name: "NPK 04-14-08", type: "insumo", quantity: 400, unit: "kg/ha", unitCost: 3.5},
            {name: "Trator + Plantadeira", type: "maquinario", quantity: 0.8, unit: "h/ha", unitCost: 250},
            {name: "Tratorista", type: "mao_de_obra", quantity: 0.15, unit: "dia/ha", unitCost: 150}
        ]
      },
      {
        title: "3. Manejo Vegetativo (V3-V4)",
        type: "manejo",
        description: "Controle de lagartas e aplicação de glifosato pós-emergente.",
        dateEstimate: "Dia 25",
        tasks: [{text: "Monitoramento de lagartas"}, {text: "Aplicação de defensivos"}],
        resources: [
            {name: "Inseticida Fisiológico", type: "insumo", quantity: 0.2, unit: "lt/ha", unitCost: 180},
            {name: "Pulverizador", type: "maquinario", quantity: 0.4, unit: "h/ha", unitCost: 150}
        ]
      },
      {
        title: "4. Fungicida Preventivo (R1)",
        type: "manejo",
        description: "Entrada preventiva para controle de doenças de final de ciclo.",
        dateEstimate: "Dia 55",
        tasks: [{text: "Aplicação aérea ou terrestre de fungicida"}],
        resources: [
            {name: "Fungicida Sistêmico", type: "insumo", quantity: 0.5, unit: "lt/ha", unitCost: 220},
            {name: "Adjuvante", type: "insumo", quantity: 0.1, unit: "lt/ha", unitCost: 40}
        ]
      },
      {
        title: "5. Colheita Mecanizada",
        type: "colheita",
        description: "Colheita e transporte para silo.",
        dateEstimate: "Dia 120",
        tasks: [{text: "Regulagem plataforma de corte"}, {text: "Colheita"}, {text: "Transporte"}],
        resources: [
            {name: "Colheitadeira", type: "maquinario", quantity: 1, unit: "h/ha", unitCost: 600},
            {name: "Caminhão Transporte", type: "maquinario", quantity: 1, unit: "viagem", unitCost: 400},
            {name: "Operador Colheita", type: "mao_de_obra", quantity: 0.2, unit: "dia/ha", unitCost: 200}
        ]
      }
    ]
  },
  'milho': {
    estimatedHarvestDate: new Date(Date.now() + 140 * 24 * 60 * 60 * 1000).toISOString(),
    aiAdvice: "Atenção crítica à Cigarrinha do Milho nos estágios iniciais.",
    timeline: [
        {
            title: "1. Preparo e Dessecação",
            type: "preparo",
            description: "Limpeza da área.",
            dateEstimate: "Dia -15",
            tasks: [{text: "Aplicação de herbicida"}],
            resources: [{name: "Herbicida", type: "insumo", quantity: 2.5, unit: "lt/ha", unitCost: 50}]
        },
        {
            title: "2. Plantio",
            type: "plantio",
            description: "Semeadura.",
            dateEstimate: "Dia 0",
            tasks: [{text: "Plantio"}],
            resources: [
                {name: "Semente Híbrida", type: "insumo", quantity: 20, unit: "kg/ha", unitCost: 40},
                {name: "Adubo NPK", type: "insumo", quantity: 350, unit: "kg/ha", unitCost: 3.8}
            ]
        },
        {
            title: "3. Adubação de Cobertura (V4)",
            type: "manejo",
            description: "Aplicação de Nitrogênio.",
            dateEstimate: "Dia 30",
            tasks: [{text: "Aplicação de Ureia"}],
            resources: [
                {name: "Ureia Agrícola", type: "insumo", quantity: 200, unit: "kg/ha", unitCost: 2.9},
                {name: "Trator + Esparramador", type: "maquinario", quantity: 0.5, unit: "h/ha", unitCost: 200}
            ]
        },
        {
            title: "4. Colheita",
            type: "colheita",
            description: "Retirada dos grãos.",
            dateEstimate: "Dia 140",
            tasks: [{text: "Colheita"}],
            resources: [
                {name: "Colheitadeira", type: "maquinario", quantity: 1.2, unit: "h/ha", unitCost: 650}
            ]
        }
    ]
  },
  'cafe': {
    estimatedHarvestDate: new Date(Date.now() + 200 * 24 * 60 * 60 * 1000).toISOString(),
    aiAdvice: "Monitore a Broca-do-café 90 dias após a florada principal.",
    timeline: [
        {
            title: "1. Pós-Colheita / Arruação",
            type: "preparo",
            description: "Limpeza sob a saia do cafeeiro.",
            dateEstimate: "Julho/Agosto",
            tasks: [{text: "Arruação mecânica ou manual"}],
            resources: [{name: "Trator + Arruador", type: "maquinario", quantity: 2, unit: "h/ha", unitCost: 180}]
        },
        {
            title: "2. Adubação de Solo 1ª Parc.",
            type: "manejo",
            description: "Início das chuvas.",
            dateEstimate: "Outubro",
            tasks: [{text: "Aplicação NPK"}],
            resources: [{name: "Adubo 20-00-20", type: "insumo", quantity: 400, unit: "kg/ha", unitCost: 3.2}]
        },
        {
            title: "3. Controle de Ferrugem/Broca",
            type: "manejo",
            description: "Aplicação foliar.",
            dateEstimate: "Dezembro/Janeiro",
            tasks: [{text: "Pulverização"}],
            resources: [
                {name: "Fungicida Ciproconazol", type: "insumo", quantity: 0.7, unit: "lt/ha", unitCost: 150},
                {name: "Trator + Turbo", type: "maquinario", quantity: 1.5, unit: "h/ha", unitCost: 200}
            ]
        },
        {
            title: "4. Colheita",
            type: "colheita",
            description: "Derriça do café.",
            dateEstimate: "Maio/Junho",
            tasks: [{text: "Derriça mecânica"}, {text: "Recolhimento"}],
            resources: [
                {name: "Colhedora Automotriz", type: "maquinario", quantity: 3, unit: "h/ha", unitCost: 500},
                {name: "Trator recolhedor", type: "maquinario", quantity: 3, unit: "h/ha", unitCost: 200}
            ]
        },
        {
            title: "5. Secagem e Beneficiamento",
            type: "pos_colheita",
            description: "Terreiro e secador.",
            dateEstimate: "Junho/Julho",
            tasks: [{text: "Secagem"}, {text: "Beneficiamento"}],
            resources: [
                {name: "Lenha/Combustível", type: "insumo", quantity: 1, unit: "m3", unitCost: 150},
                {name: "Mão de obra Terreiro", type: "mao_de_obra", quantity: 2, unit: "dia", unitCost: 100}
            ]
        }
    ]
  }
};

const getFallbackPlan = (type: CropType, areaHa: number) => {
    // Clone the template to avoid mutation
    const template = FALLBACK_PLANS[type] || FALLBACK_PLANS['soja']; // Default to soy if unknown
    
    // Scale quantities by area
    const scaledTimeline = template.timeline.map((stage: any) => {
        const scaledResources = stage.resources.map((res: any) => ({
            ...res,
            id: Math.random().toString(36).substr(2, 9),
            quantity: parseFloat((res.quantity * areaHa).toFixed(2)), // Scale per hectare
            totalCost: parseFloat((res.quantity * areaHa * res.unitCost).toFixed(2)),
            ownership: 'alugado' // Default
        }));
        
        return {
            ...stage,
            id: Math.random().toString(36).substr(2, 9),
            status: 'pendente',
            tasks: stage.tasks.map((t: any) => ({...t, id: Math.random().toString(36).substr(2, 9), done: false})),
            resources: scaledResources
        };
    });

    let totalEstCost = 0;
    scaledTimeline.forEach((s: any) => s.resources.forEach((r: any) => totalEstCost += r.totalCost));

    return {
        estimatedHarvestDate: template.estimatedHarvestDate,
        aiAdvice: template.aiAdvice + " (Plano Gerado Automaticamente)",
        timeline: scaledTimeline,
        estimatedCost: totalEstCost,
        inventory: [],
        transactions: []
    };
};

// Lazy initialization
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null; // Allow null to trigger fallback
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
  
  const ai = getAiClient();

  // If no API key or client, immediately return fallback
  if (!ai) {
      console.warn("Sem chave de API. Usando plano de contingência.");
      return getFallbackPlan(type, areaHa);
  }

  // Prompt de Engenharia Agronômica Avançada
  const prompt = `
    Atue como um Engenheiro Agrônomo Sênior especializado em ${type} no Brasil.
    
    TAREFA CRÍTICA:
    Gerar um CRONOGRAMA OPERACIONAL COMPLETO para ${areaHa} hectares.
    
    REGRA DE OURO (IMPORTANTE):
    Você NÃO PODE devolver a lista de recursos vazia. TODAS AS ETAPAS devem ter insumos, máquinas ou mão de obra associados.
    Se a etapa é "Monitoramento", a mão de obra é o "Técnico". Se é "Plantio", precisa de Semente, Adubo, Trator, Operador.
    PREENCHA OS CUSTOS. NÃO DEIXE NADA ZERADO.

    O cronograma DEVE cobrir explicitamente:
    1. PREPARO: Análise de solo, Calagem, Gessagem, Subsolagem/Gradagem.
    2. PRÉ-PLANTIO: Dessecação, Tratamento de sementes.
    3. PLANTIO: A operação de semeadura/plantio em si.
    4. VEGETATIVO: Adubação de Cobertura 1, Controle de Ervas Daninhas.
    5. REPRODUTIVO: Fungicida 1, Inseticida 1, Adubação Foliar.
    6. MATURAÇÃO: Aplicação final ou Dessecação pré-colheita (se aplicável).
    7. COLHEITA: Operação mecanizada ou manual.
    8. PÓS-COLHEITA: Transporte interno, Secagem/Beneficiamento, Armazenamento.

    PARA CADA ETAPA, GERE A LISTA DE CUSTOS (RECURSOS) NECESSÁRIOS:
    Estime quantidades realistas para ${areaHa} hectares e custos médios em Reais (BRL).
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
          "title": "Nome da Etapa",
          "type": "preparo" | "plantio" | "manejo" | "colheita" | "pos_colheita",
          "description": "Descrição técnica breve.",
          "dateEstimate": "Mês/Ano",
          "tasks": [{ "text": "Ação operacional 1" }],
          "resources": [
             { 
               "name": "Nome do Item", 
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
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
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

      // Basic validation: if timeline is empty, throw to trigger fallback
      if (processedTimeline.length === 0) throw new Error("Empty timeline from AI");

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
    console.error("Erro na IA (Usando Fallback):", error);
    // Return hardcoded fallback if AI fails
    return getFallbackPlan(type, areaHa);
  }
};

export const getAssistantResponse = async (question: string, context: string): Promise<string> => {
    try {
        const ai = getAiClient();
        if(!ai) return "Estou em modo offline. Verifique sua chave de API.";
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Contexto da lavoura: ${context}. \nPergunta do produtor: ${question}. \nResponda de forma curta, prática e técnica.`,
        });
        return response.text || "Desculpe, não entendi.";
    } catch (e) {
        return "Erro de conexão com o assistente.";
    }
}
