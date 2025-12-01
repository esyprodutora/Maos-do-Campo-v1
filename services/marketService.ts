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

    // 2. Simular Commodities (Baseadas em médias de mercado + variação aleatória para demo)
    // Em produção, isso viria de uma API paga como Bloomberg ou CEPEA
    
    // Café Arábica (Saca 60kg) - Média ~ R$ 1000 a R$ 1300
    const coffeeBase = 1250.00;
    const coffeeVar = (Math.random() * 2) - 1; // -1% a +1%
    
    // Soja (Saca 60kg) - Média ~ R$ 120 a R$ 140
    const soyBase = 128.50;
    const soyVar = (Math.random() * 1.5) - 0.5;

    // Milho (Saca 60kg) - Média ~ R$ 55 a R$ 65
    const cornBase = 58.90;
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
        price: coffeeBase + (coffeeBase * (coffeeVar / 100)),
        variation: coffeeVar,
        trend: coffeeVar >= 0 ? 'up' : 'down',
        unit: 'sc 60kg',
        color: '#A67C52', // Coffee Brown
        history: generateHistory(coffeeBase)
      },
      {
        id: 'soja',
        name: 'Soja',
        price: soyBase + (soyBase * (soyVar / 100)),
        variation: soyVar,
        trend: soyVar >= 0 ? 'up' : 'down',
        unit: 'sc 60kg',
        color: '#F2C94C', // Soy Yellow
        history: generateHistory(soyBase)
      },
      {
        id: 'milho',
        name: 'Milho',
        price: cornBase + (cornBase * (cornVar / 100)),
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

// Nova função auxiliar para buscar preço específico por tipo de cultura
export const getCurrentPrice = async (cropType: string): Promise<number> => {
    const quotes = await getMarketQuotes();
    // @ts-ignore
    const quote = quotes.find(q => q.id === cropType.toLowerCase());
    return quote ? quote.price : 0;
};
