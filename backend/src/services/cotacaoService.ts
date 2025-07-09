interface CotacaoResponse {
  USDBRL: {
    code: string;
    codein: string;
    name: string;
    high: string;
    low: string;
    varBid: string;
    pctChange: string;
    bid: string;
    ask: string;
    timestamp: string;
    create_date: string;
  };
}

export class CotacaoService {
  private static readonly API_URL = 'https://economia.awesomeapi.com.br/last/USD-BRL';

  static async obterCotacaoDolar(): Promise<number> {
    try {
      const response = await fetch(this.API_URL);
      
      if (!response.ok) {
        throw new Error(`Erro na API de cotação: ${response.status}`);
      }

      const data: CotacaoResponse = await response.json();
      const cotacao = parseFloat(data.USDBRL.bid);
      
      if (isNaN(cotacao) || cotacao <= 0) {
        throw new Error('Cotação inválida recebida da API');
      }
      
      console.log(`Cotação USD/BRL obtida: R$ ${cotacao.toFixed(4)}`);
      return cotacao;
      
    } catch (error) {
      console.error('Erro ao obter cotação do dólar:', error);
      
      // Fallback: cotação padrão caso a API falhe
      const cotacaoFallback = 5.20;
      console.warn(`Usando cotação fallback: R$ ${cotacaoFallback}`);
      return cotacaoFallback;
    }
  }

  static calcularPrecoCompraBRL(
    precoGondolaUSD: number, 
    cotacao: number, 
    impostoPercentual: number = 7
  ): number {
    // Calcular o preço real pago (gôndola + imposto)
    const precoRealUSD = precoGondolaUSD * (1 + impostoPercentual / 100);
    // Converter para BRL
    return precoRealUSD * cotacao;
  }

  static calcularPrecoRealUSD(
    precoGondolaUSD: number, 
    impostoPercentual: number = 7
  ): number {
    return precoGondolaUSD * (1 + impostoPercentual / 100);
  }

  static calcularMargemReal(
    precoCompraBRL: number, 
    precoVendaBRL: number
  ): number {
    if (precoCompraBRL <= 0) return 0;
    return ((precoVendaBRL - precoCompraBRL) / precoCompraBRL) * 100;
  }
} 