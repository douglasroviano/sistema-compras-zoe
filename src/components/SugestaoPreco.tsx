import React from 'react';
import { useCalculadoraPreco } from '../hooks/useCalculadoraPreco';

interface SugestaoPrecoProps {
  precoGondola: number;
  impostoPercentual: number;
  cotacao: number;
}

const SugestaoPreco: React.FC<SugestaoPrecoProps> = ({
  precoGondola,
  impostoPercentual,
  cotacao
}) => {
  const { sugestaoPreco } = useCalculadoraPreco({ 
    precoGondola, 
    impostoPercentual, 
    cotacao 
  });

  if (!precoGondola || !cotacao) {
    return null;
  }

  return <span>Sugestão: R$ {sugestaoPreco.toFixed(2)}</span>;
};

export default SugestaoPreco; 