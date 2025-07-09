import { useState, useEffect } from 'react';

interface UseCalculadoraPrecoProps {
  precoGondola: number;
  impostoPercentual: number;
  cotacao: number;
}

type TipoCalculo = 'margem' | 'markup';

export const useCalculadoraPreco = ({ precoGondola, impostoPercentual, cotacao }: UseCalculadoraPrecoProps) => {
  const [tipoCalculo, setTipoCalculo] = useState<TipoCalculo>('margem');
  const [valorMargem, setValorMargem] = useState<number>(30); // 30% padrão
  const [valorMarkup, setValorMarkup] = useState<number>(20); // $20 padrão
  const [sugestaoPreco, setSugestaoPreco] = useState<number>(0);

  // Calcula o custo real pago em USD (gôndola + imposto)
  const custoRealUSD = precoGondola * (1 + impostoPercentual / 100);

  useEffect(() => {
    if (!precoGondola || !cotacao) {
      setSugestaoPreco(0);
      return;
    }

    let precoFinalUSD = 0;

    if (tipoCalculo === 'margem') {
      // Margem: Custo Real USD + Margem%
      precoFinalUSD = custoRealUSD * (1 + valorMargem / 100);
    } else {
      // Markup: Custo Real USD + Markup USD
      precoFinalUSD = custoRealUSD + valorMarkup;
    }

    // Converter para BRL
    const sugestaoBRL = precoFinalUSD * cotacao;
    setSugestaoPreco(sugestaoBRL);
  }, [precoGondola, impostoPercentual, cotacao, tipoCalculo, valorMargem, valorMarkup, custoRealUSD]);

  return {
    tipoCalculo,
    setTipoCalculo,
    valorMargem,
    setValorMargem,
    valorMarkup,
    setValorMarkup,
    sugestaoPreco,
    custoRealUSD
  };
}; 