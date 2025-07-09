"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CotacaoService = void 0;
class CotacaoService {
    static async obterCotacaoDolar() {
        try {
            const response = await fetch(this.API_URL);
            if (!response.ok) {
                throw new Error(`Erro na API de cotação: ${response.status}`);
            }
            const data = await response.json();
            const cotacao = parseFloat(data.USDBRL.bid);
            if (isNaN(cotacao) || cotacao <= 0) {
                throw new Error('Cotação inválida recebida da API');
            }
            console.log(`Cotação USD/BRL obtida: R$ ${cotacao.toFixed(4)}`);
            return cotacao;
        }
        catch (error) {
            console.error('Erro ao obter cotação do dólar:', error);
            // Fallback: cotação padrão caso a API falhe
            const cotacaoFallback = 5.20;
            console.warn(`Usando cotação fallback: R$ ${cotacaoFallback}`);
            return cotacaoFallback;
        }
    }
    static calcularPrecoCompraBRL(precoGondolaUSD, cotacao, impostoPercentual = 7) {
        // Calcular o preço real pago (gôndola + imposto)
        const precoRealUSD = precoGondolaUSD * (1 + impostoPercentual / 100);
        // Converter para BRL
        return precoRealUSD * cotacao;
    }
    static calcularPrecoRealUSD(precoGondolaUSD, impostoPercentual = 7) {
        return precoGondolaUSD * (1 + impostoPercentual / 100);
    }
    static calcularMargemReal(precoCompraBRL, precoVendaBRL) {
        if (precoCompraBRL <= 0)
            return 0;
        return ((precoVendaBRL - precoCompraBRL) / precoCompraBRL) * 100;
    }
}
exports.CotacaoService = CotacaoService;
CotacaoService.API_URL = 'https://economia.awesomeapi.com.br/last/USD-BRL';
