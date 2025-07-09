import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment
} from '@mui/material';


interface CalculadoraPrecoProps {
  precoGondola: number;
  impostoPercentual: number;
  cotacao: number;
  onSugestaoChange?: (sugestao: number) => void;
}

interface CalculadoraReturn {
  sugestaoPreco: number;
  calculadora: JSX.Element;
}

type TipoCalculo = 'margem' | 'markup';

const CalculadoraPreco: React.FC<CalculadoraPrecoProps> = ({
  precoGondola,
  impostoPercentual,
  cotacao,
  onSugestaoChange
}) => {
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
    
    if (onSugestaoChange) {
      onSugestaoChange(sugestaoBRL);
    }
  }, [precoGondola, impostoPercentual, cotacao, tipoCalculo, valorMargem, valorMarkup, custoRealUSD, onSugestaoChange]);

  if (!precoGondola || precoGondola === 0) {
    return null;
  }

  return (
    <Box sx={{ mt: 2 }}>
      {/* Calculadora simplificada */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mb: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1976d2' }}>
          💡 Calculadora:
        </Typography>
        
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Tipo</InputLabel>
          <Select
            value={tipoCalculo}
            label="Tipo"
            onChange={(e) => setTipoCalculo(e.target.value as TipoCalculo)}
          >
            <MenuItem value="margem">Margem %</MenuItem>
            <MenuItem value="markup">Markup USD</MenuItem>
          </Select>
        </FormControl>

        {tipoCalculo === 'margem' ? (
          <TextField
            size="small"
            label="Margem"
            type="number"
            value={valorMargem}
            onChange={(e) => setValorMargem(parseFloat(e.target.value) || 0)}
            InputProps={{
              endAdornment: <InputAdornment position="end">%</InputAdornment>,
            }}
            inputProps={{ step: 1, min: 0, max: 1000 }}
            sx={{ width: 100 }}
          />
        ) : (
          <TextField
            size="small"
            label="Markup"
            type="number"
            value={valorMarkup}
            onChange={(e) => setValorMarkup(parseFloat(e.target.value) || 0)}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            inputProps={{ step: 1, min: 0 }}
            sx={{ width: 100 }}
          />
        )}
      </Box>

      {/* Informações como texto */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          Custo Real: ${custoRealUSD.toFixed(2)} USD (${precoGondola.toFixed(2)} + {impostoPercentual}%)
        </Typography>
        
        {tipoCalculo === 'margem' ? (
          <Typography variant="caption" color="text.secondary">
            Com Margem: ${custoRealUSD.toFixed(2)} + {valorMargem}% = ${(custoRealUSD * (1 + valorMargem / 100)).toFixed(2)} USD
          </Typography>
        ) : (
          <Typography variant="caption" color="text.secondary">
            Com Markup: ${custoRealUSD.toFixed(2)} + ${valorMarkup.toFixed(2)} = ${(custoRealUSD + valorMarkup).toFixed(2)} USD
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default CalculadoraPreco; 