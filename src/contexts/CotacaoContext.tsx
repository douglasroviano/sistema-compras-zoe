import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';

interface CotacaoContextData {
  cotacao: number;
  ultimaAtualizacao: string;
  loading: boolean;
  atualizarCotacao: () => Promise<void>;
}

interface CotacaoProviderProps {
  children: ReactNode;
}

const CotacaoContext = createContext<CotacaoContextData>({} as CotacaoContextData);

export const CotacaoProvider: React.FC<CotacaoProviderProps> = ({ children }) => {
  const [cotacao, setCotacao] = useState<number>(5.20); // Fallback padrão
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const atualizarCotacao = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
      const response = await axios.get(`${API_URL}/produtos-venda/cotacao-dolar`);
      
      const novaCotacao = response.data.cotacao;
      
      // Só atualiza se a cotação mudou ou é a primeira vez
      if (cotacao === 5.20 || cotacao !== novaCotacao) {
        setCotacao(novaCotacao);
        
        // Registra o momento da atualização da cotação
        const agora = new Date();
        const timestampBrasil = agora.toLocaleString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        setUltimaAtualizacao(timestampBrasil);
        console.log(`Cotação global atualizada: R$ ${novaCotacao} em ${timestampBrasil}`);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Erro ao buscar cotação:', error);
      
      // Só define fallback se não tiver cotação ainda
      if (cotacao === 5.20 && ultimaAtualizacao === '') {
        const agora = new Date();
        const timestampBrasil = agora.toLocaleString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        setUltimaAtualizacao(`${timestampBrasil} (Fallback)`);
      }
      
      setLoading(false);
    }
  };

  useEffect(() => {
    atualizarCotacao();
    // Verificar cotação a cada 5 minutos
    const interval = setInterval(atualizarCotacao, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <CotacaoContext.Provider value={{
      cotacao,
      ultimaAtualizacao,
      loading,
      atualizarCotacao
    }}>
      {children}
    </CotacaoContext.Provider>
  );
};

export const useCotacao = (): CotacaoContextData => {
  const context = useContext(CotacaoContext);
  if (!context) {
    throw new Error('useCotacao deve ser usado dentro de CotacaoProvider');
  }
  return context;
}; 