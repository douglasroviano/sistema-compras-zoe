import React from 'react';

interface SugestaoPrecoProps {
  precoGondola: number;
  impostoPercentual: number;
  cotacao: number;
  sugestaoCalculadora?: number; // Valor da calculadora principal quando disponível
}

const SugestaoPreco: React.FC<SugestaoPrecoProps> = ({
  precoGondola,
  impostoPercentual,
  cotacao,
  sugestaoCalculadora
}) => {
  if (!precoGondola || !cotacao) {
    return null;
  }

  // Se tem sugestão da calculadora, usar ela (dinâmica)
  // Senão usar cálculo padrão (margem 30%)
  const sugestaoPreco = sugestaoCalculadora || (() => {
    const custoRealUSD = precoGondola * (1 + impostoPercentual / 100);
    const precoFinalUSD = custoRealUSD * 1.3; // 30% margem padrão
    return precoFinalUSD * cotacao;
  })();

  const precoUSD = sugestaoPreco / cotacao;

  return (
    <span style={{ fontSize: '0.875rem', color: '#1976d2', fontWeight: 600 }}>
      Sugestão: ${precoUSD.toFixed(2)} / R$ {sugestaoPreco.toFixed(2)}
    </span>
  );
};

export default SugestaoPreco; 