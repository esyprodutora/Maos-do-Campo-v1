export interface MarketData {
  currency: string;
  price: number;
  variation: number; // Porcentagem
  trend: 'up' | 'down' | 'neutral';
  lastUpdate: string;
  history: { day: string; value: number }[];
}

const generateHistory = (basePrice: number, days: number = 7) => {
  return Array.from({ length: days }).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    const randomVar = (Math.random() - 0.5) * (basePrice * 0.03); 
    return {
      day: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      value: basePrice + randomVar
    };
  });
};

export const getMarketQuotes = async () => {
  try {
    // 1. Dólar PTAX (Real Time via AwesomeAPI)
    const dollarRes = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL');
    const dollarJson = await dollarRes.json();
    const usd = dollarJson.USDBRL;
    const usdPrice = parseFloat(usd.bid);
    const usdVar = parseFloat(usd.pctChange);

    // 2. Commodities Agrícolas (Valores Baseados no CEPEA/B3 - Atualizados)
    // Como APIs oficiais de commodities (B3) são pagas e complexas, usamos valores base realistas do mercado físico
    // com variações diárias simuladas para a experiência do MVP.

    const commodities = [
      {
        id: 'cafe',
        name: 'Café Arábica (Tipo 6)',
        price: 1320.00, // Base CEPEA
        unit: 'sc 60kg',
        color: '#A67C52',
      },
      {
        id: 'soja',
        name: 'Soja (Paranaguá)',
        price: 126.50, // Base Paranaguá
        unit: 'sc 60kg',
        color: '#F2C94C',
      },
      {
        id: 'milho',
        name: 'Milho (B3)',
        price: 59.80, // Base B3
        unit: 'sc 60kg',
        color: '#E67E22',
      },
      {
        id: 'boi',
        name: 'Boi Gordo (B3)',
        price: 235.00, // Base B3
        unit: '@',
        color: '#C0392B',
      },
      {
        id: 'trigo',
        name: 'Trigo (PR)',
        price: 1450.00, // Tonelada
        unit: 'ton',
        color: '#F39C12',
      },
      {
        id: 'cana',
        name: 'Cana (ATR)',
        price: 1.21, // Kg ATR
        unit: 'kg ATR',
        color: '#27AE60',
      },
      {
        id: 'algodao',
        name: 'Algodão (Pluma)',
        price: 4.15, // Libra-peso
        unit: 'lp',
        color: '#95A5A6',
      }
    ];

    const formattedCommodities = commodities.map(c => {
        const variation = (Math.random() * 2.5) - 1.2; // Variação diária simulada (-1.2% a +1.3%)
        const currentPrice = c.price + (c.price * (variation / 100));
        return {
            id: c.id,
            name: c.name,
            price: currentPrice,
            variation: variation,
            trend: variation >= 0 ? 'up' : 'down',
            unit: c.unit,
            color: c.color,
            history: generateHistory(c.price)
        };
    });

    // Adiciona Dólar no início
    return [
      {
        id: 'usd',
        name: 'Dólar Comercial',
        price: usdPrice,
        variation: usdVar,
        trend: usdVar >= 0 ? 'up' : 'down',
        unit: 'BRL',
        color: '#27AE60',
        history: generateHistory(usdPrice)
      },
      ...formattedCommodities
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
