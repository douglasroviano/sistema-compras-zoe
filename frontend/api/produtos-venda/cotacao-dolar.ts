import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const response = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL');
    if (!response.ok) {
      throw new Error('Erro ao buscar cotação na AwesomeAPI');
    }
    const data = await response.json();
    const cotacao = parseFloat(data.USDBRL.bid);
    res.status(200).json({
      cotacao,
      fonte: 'AwesomeAPI',
      atualizado_em: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar cotação do dólar', details: (error as Error).message });
  }
} 