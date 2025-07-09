import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  Typography,
  MenuItem,
  Alert
} from '@mui/material';
import type { Cliente } from '../types/cliente';

interface ClienteFormProps {
  cliente?: Cliente | null;
  onSave: (cliente: Cliente) => Promise<void>;
  onCancel: () => void;
}

interface FormErrors {
  telefone?: string;
  nome?: string;
  endereco?: string;
  cidade?: string;
  cep?: string;
  estado?: string;
  preferencia_entrega?: string;
  indicado_por?: string;
}

const estados = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const preferenciaEntregaOptions = [
  { value: 'retirada', label: 'Retirada no Local' },
  { value: 'entrega', label: 'Entrega' },
  { value: 'correios', label: 'Correios' }
];

const ClienteForm: React.FC<ClienteFormProps> = ({ 
  cliente,
  onSave, 
  onCancel
}) => {
  const [formData, setFormData] = useState<Cliente>({
    telefone: '',
    nome: '',
    endereco: '',
    cidade: '',
    cep: '',
    estado: '',
    indicado_por: '',
    preferencia_entrega: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cliente) {
      setFormData({
        telefone: cliente.telefone,
        nome: cliente.nome,
        endereco: cliente.endereco,
        cidade: cliente.cidade,
        cep: cliente.cep,
        estado: cliente.estado,
        indicado_por: cliente.indicado_por || '',
        preferencia_entrega: cliente.preferencia_entrega || '',
      });
    }
  }, [cliente]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpar erro quando o usuário começar a digitar
    if (errors[name as keyof FormErrors]) {
      setErrors((prev: FormErrors) => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const formatTelefone = (value: string) => {
    // Remove tudo que não é dígito ou +
    const cleaned = value.replace(/[^\d+]/g, '');
    
    // Se começar com +55, formatar como internacional
    if (cleaned.startsWith('+55')) {
      const numbers = cleaned.replace(/\D/g, '');
      if (numbers.length >= 12 && numbers.length <= 13) {
        // +55 (45) 99858-6091 ou +55 (45) 9858-6091
        return numbers.replace(/(\d{2})(\d{2})(\d{4,5})(\d{4})/, '+$1 ($2) $3-$4');
      }
    }
    // Se começar com 55 e tiver mais de 11 dígitos, assumir que é internacional
    else if (cleaned.startsWith('55') && cleaned.length >= 12) {
      const numbers = cleaned.replace(/\D/g, '');
      if (numbers.length >= 12 && numbers.length <= 13) {
        return numbers.replace(/(\d{2})(\d{2})(\d{4,5})(\d{4})/, '+$1 ($2) $3-$4');
      }
    }
    // Formato nacional (11) 99999-9999 ou (11) 9999-9999
    else {
      const numbers = cleaned.replace(/\D/g, '');
      if (numbers.length >= 10 && numbers.length <= 11) {
        return numbers.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3');
      }
    }
    
    return value;
  };

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 8) {
      return numbers.replace(/(\d{5})(\d{3})/, '$1-$2');
    }
    return value;
  };

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatTelefone(e.target.value);
    setFormData(prev => ({
      ...prev,
      telefone: formatted
    }));
  };

  const handleCEPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCEP(e.target.value);
    setFormData(prev => ({
      ...prev,
      cep: formatted
    }));
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!formData.telefone.trim()) {
      newErrors.telefone = 'Telefone é obrigatório';
    } else {
      const numbersOnly = formData.telefone.replace(/\D/g, '');
      // Aceita formato nacional (10-11 dígitos) ou internacional com +55 (12-13 dígitos)
      if (numbersOnly.length < 10 || (numbersOnly.length > 11 && numbersOnly.length < 12) || numbersOnly.length > 13) {
        newErrors.telefone = 'Telefone deve ter formato válido (nacional ou +55)';
      }
    }

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }

    // Validações opcionais - apenas se preenchidos
    if (formData.cep.trim() && formData.cep.replace(/\D/g, '').length !== 8) {
      newErrors.cep = 'CEP deve ter 8 dígitos';
    }

    if (formData.indicado_por && formData.indicado_por.trim()) {
      const numbersOnly = formData.indicado_por.replace(/\D/g, '');
      // Aceita formato nacional (10-11 dígitos) ou internacional com +55 (12-13 dígitos)
      if (numbersOnly.length < 10 || (numbersOnly.length > 11 && numbersOnly.length < 12) || numbersOnly.length > 13) {
        newErrors.indicado_por = 'Telefone deve ter formato válido (nacional ou +55)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (validateForm()) {
      try {
        setLoading(true);
        
        // Processar telefones mantendo formato internacional para WhatsApp
        const processarTelefone = (telefone: string) => {
          const numbersOnly = telefone.replace(/\D/g, '');
          // Se tem 12-13 dígitos e começa com 55, manter formato internacional
          if (numbersOnly.length >= 12 && numbersOnly.startsWith('55')) {
            return numbersOnly;
          }
          // Se tem 10-11 dígitos, adicionar +55 para WhatsApp
          if (numbersOnly.length >= 10 && numbersOnly.length <= 11) {
            return `55${numbersOnly}`;
          }
          return numbersOnly;
        };

        const dataToSubmit: Cliente = {
          ...formData,
          telefone: processarTelefone(formData.telefone),
          cep: formData.cep.replace(/\D/g, ''),
          indicado_por: formData.indicado_por ? processarTelefone(formData.indicado_por) : undefined
        };
        
        await onSave(dataToSubmit);
      } catch (error) {
        console.error('Erro ao salvar cliente:', error);
        setError('Erro ao salvar cliente');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Dados Principais */}
        <Grid size={{ xs: 12 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Dados Principais
          </Typography>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Telefone"
            name="telefone"
            value={formData.telefone}
            onChange={handleTelefoneChange}
            placeholder="+55 (45) 99858-6091 ou (11) 99999-9999"
            error={!!errors.telefone}
            helperText={errors.telefone}
            required
            inputProps={{ maxLength: 20 }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Nome Completo"
            name="nome"
            value={formData.nome}
            onChange={handleChange}
            error={!!errors.nome}
            helperText={errors.nome}
            required
          />
        </Grid>

        {/* Endereço */}
        <Grid size={{ xs: 12 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mt: 2 }}>
            Endereço
          </Typography>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            label="Endereço Completo"
            name="endereco"
            value={formData.endereco}
            onChange={handleChange}
            error={!!errors.endereco}
            helperText={errors.endereco}
            multiline
            rows={3}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            label="CEP"
            name="cep"
            value={formData.cep}
            onChange={handleCEPChange}
            placeholder="99999-999"
            error={!!errors.cep}
            helperText={errors.cep}
            inputProps={{ maxLength: 9 }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 5 }}>
          <TextField
            fullWidth
            label="Cidade"
            name="cidade"
            value={formData.cidade}
            onChange={handleChange}
            error={!!errors.cidade}
            helperText={errors.cidade}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 3 }}>
          <TextField
            fullWidth
            select
            label="Estado"
            name="estado"
            value={formData.estado}
            onChange={handleChange}
            error={!!errors.estado}
            helperText={errors.estado}
          >
            <MenuItem value="">
              <em>Selecione um estado</em>
            </MenuItem>
            {estados.map((estado) => (
              <MenuItem key={estado} value={estado}>
                {estado}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Preferências */}
        <Grid size={{ xs: 12 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mt: 2 }}>
            Preferências
          </Typography>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            select
            label="Preferência de Entrega"
            name="preferencia_entrega"
            value={formData.preferencia_entrega}
            onChange={handleChange}
            error={!!errors.preferencia_entrega}
            helperText={errors.preferencia_entrega}
          >
            <MenuItem value="">
              <em>Selecione uma opção</em>
            </MenuItem>
            {preferenciaEntregaOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Indicado por (Telefone)"
            name="indicado_por"
            value={formData.indicado_por}
            onChange={(e) => {
              const formatted = formatTelefone(e.target.value);
              setFormData(prev => ({
                ...prev,
                indicado_por: formatted
              }));
            }}
            placeholder="+55 (45) 99858-6091 ou (11) 99999-9999"
            error={!!errors.indicado_por}
            helperText={errors.indicado_por}
            inputProps={{ maxLength: 20 }}
          />
        </Grid>

        {/* Botões */}
        <Grid size={{ xs: 12 }}>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
            <Button
              variant="outlined"
              onClick={onCancel}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{ minWidth: 120 }}
            >
              {loading ? 'Salvando...' : cliente ? 'Atualizar' : 'Salvar'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ClienteForm; 