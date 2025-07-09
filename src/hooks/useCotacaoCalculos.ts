import { useCotacao } from '../contexts/CotacaoContext';

export const useCotacaoCalculos = () => {
  const { cotacao } = useCotacao();

  // Calcula preço real em USD (gôndola + imposto)
  const calcularPrecoRealUSD = (precoGondola: number, impostoPercentual: number = 7) => {
    return precoGondola * (1 + impostoPercentual / 100);
  };

  // Calcula custo real em BRL (preço real USD × cotação)
  const calcularCustoRealBRL = (precoGondola: number, impostoPercentual: number = 7) => {
    const precoRealUSD = calcularPrecoRealUSD(precoGondola, impostoPercentual);
    return precoRealUSD * cotacao;
  };

  // Calcula margem de lucro real
  const calcularMargemReal = (precoGondola: number, precoVenda: number, impostoPercentual: number = 7) => {
    const custoRealBRL = calcularCustoRealBRL(precoGondola, impostoPercentual);
    if (custoRealBRL === 0) return 0;
    return ((precoVenda - custoRealBRL) / custoRealBRL) * 100;
  };

  // Converte USD para BRL
  const converterUSDparaBRL = (valorUSD: number) => {
    return valorUSD * cotacao;
  };

  // Converte BRL para USD
  const converterBRLparaUSD = (valorBRL: number) => {
    return valorBRL / cotacao;
  };

  return {
    cotacao,
    calcularPrecoRealUSD,
    calcularCustoRealBRL,
    calcularMargemReal,
    converterUSDparaBRL,
    converterBRLparaUSD
  };
}; 