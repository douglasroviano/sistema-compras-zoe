import React, { useState } from 'react';
import { Box, Button, TextField, MenuItem, Typography, Grid, Paper } from '@mui/material';
import FotoUpload from './FotoUpload';
import type { ProdutoVenda } from '../types/produtoVenda';

interface ProdutoVendaFormProps {
  initialData?: Partial<ProdutoVenda>;
  onSubmit: (produto: ProdutoVenda) => void;
  loading?: boolean;
}

const tamanhos = ['PP', 'P', 'M', 'G', 'GG', '8', '10', '12', '14', '16', 'U'];
const cores = ['Preto', 'Branco', 'Azul', 'Vermelho', 'Verde', 'Amarelo', 'Rosa', 'Cinza', 'Bege', 'Outro'];

const ProdutoVendaForm: React.FC<ProdutoVendaFormProps> = ({ initialData = {}, onSubmit, loading }) => {
  const [produto, setProduto] = useState<ProdutoVenda>({
    id: initialData.id || '',
    venda_id: initialData.venda_id || '',
    nome_produto: initialData.nome_produto || '',
    cor: initialData.cor || '',
    tamanho: initialData.tamanho || '',
    descricao: initialData.descricao || '',
    preco_compra: initialData.preco_compra || 0,
    preco_venda: initialData.preco_venda || 0,
    foto_url: initialData.foto_url || '',
    observacoes: initialData.observacoes || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProduto({ ...produto, [e.target.name]: e.target.value });
  };

  const handleFotoUpload = (url: string) => {
    setProduto({ ...produto, foto_url: url });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(produto);
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 600, margin: '0 auto' }}>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <TextField label="Nome do Produto" name="nome_produto" value={produto.nome_produto} onChange={handleChange} fullWidth required />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField select label="Cor" name="cor" value={produto.cor} onChange={handleChange} fullWidth>
              {cores.map(cor => <MenuItem key={cor} value={cor}>{cor}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField select label="Tamanho" name="tamanho" value={produto.tamanho} onChange={handleChange} fullWidth>
              {tamanhos.map(tam => <MenuItem key={tam} value={tam}>{tam}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField label="Descrição" name="descricao" value={produto.descricao} onChange={handleChange} fullWidth multiline rows={2} />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField label="Preço de Compra" name="preco_compra" type="number" value={produto.preco_compra} onChange={handleChange} fullWidth />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField label="Preço de Venda" name="preco_venda" type="number" value={produto.preco_venda} onChange={handleChange} fullWidth />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <FotoUpload onUpload={handleFotoUpload} />
            {produto.foto_url && (
              <Box mt={2}>
                <Typography variant="subtitle2">Pré-visualização:</Typography>
                <img src={produto.foto_url} alt="Foto do produto" style={{ maxWidth: 200, borderRadius: 8 }} />
              </Box>
            )}
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField label="Observações" name="observacoes" value={produto.observacoes} onChange={handleChange} fullWidth multiline rows={2} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Button type="submit" variant="contained" color="primary" fullWidth disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Produto'}
            </Button>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

export default ProdutoVendaForm; 