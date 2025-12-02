export interface MarketData {
  currency: string;
  price: number;
  variation: number; // Porcentagem
  trend: 'up' | 'down' | 'neutral';
  lastUpdate: string;
  history: { day: string; value: number }[]; // Para o gráfico
}

// Simula variação histórica para gráficos
const generateHistory = (basePrice: number, days: number = 7) => {
  return Array.from({ length: days }).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    // Variação aleatória suave para parecer um gráfico real
    const randomVar = (Math.random() - 0.5) * (basePrice * 0.05); 
    return {
      day: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      value: basePrice + randomVar
    };
  });
};

export const getMarketQuotes = async () => {
  try {
    // 1. Buscar Dólar Real (API Pública Confiável)
    const dollarRes = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL');
    const dollarJson = await dollarRes.json();
    const usd = dollarJson.USDBRL;
    
    const usdPrice = parseFloat(usd.bid);
    const usdVar = parseFloat(usd.pctChange);

    // 2. Simular Commodities (Baseadas em médias de mercado reais - Atualizado Dez/2025)
    
    // Café Arábica (Saca 60kg) - Base CEPEA/ESALQ
    const coffeeBase = 2233.34; 
    const coffeeVar = -0.87; // Variação real
    
    // Soja (Saca 60kg) - Base Paranaguá (~R$ 135 - R$ 145)
    const soyBase = 138.50;
    const soyVar = (Math.random() * 1.5) - 0.5;

    // Milho (Saca 60kg) - Base B3 (~R$ 60 - R$ 70)
    const cornBase = 68.90;
    const cornVar = (Math.random() * 2) - 1.2;

    return [
      {
        id: 'usd',
        name: 'Dólar (USD)',
        price: usdPrice,
        variation: usdVar,
        trend: usdVar >= 0 ? 'up' : 'down',
        unit: 'BRL',
        color: '#27AE60', // Green
        history: generateHistory(usdPrice)
      },
      {
        id: 'cafe',
        name: 'Café Arábica',
        price: coffeeBase,
        variation: coffeeVar,
        trend: coffeeVar >= 0 ? 'up' : 'down',
        unit: 'sc 60kg',
        color: '#A67C52', // Coffee Brown
        history: generateHistory(coffeeBase)
      },
      {
        id: 'soja',
        name: 'Soja',
        price: soyBase,
        variation: soyVar,
        trend: soyVar >= 0 ? 'up' : 'down',
        unit: 'sc 60kg',
        color: '#F2C94C', // Soy Yellow
        history: generateHistory(soyBase)
      },
      {
        id: 'milho',
        name: 'Milho',
        price: cornBase,
        variation: cornVar,
        trend: cornVar >= 0 ? 'up' : 'down',
        unit: 'sc 60kg',
        color: '#E67E22', // Corn Orange
        history: generateHistory(cornBase)
      }
    ];

  } catch (error) {
    console.error("Erro ao buscar cotações", error);
    return [];
  }
};

export const getCurrentPrice = async (cropType: string): Promise<number> => {
    const quotes = await getMarketQuotes();
    // @ts-ignore
    const quote = quotes.find(q => q.id === cropType.toLowerCase() || q.name.toLowerCase().includes(cropType.toLowerCase()));
    return quote ? quote.price : 0;
};
