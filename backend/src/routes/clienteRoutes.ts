import { Router } from 'express';
import { getClientes, getCliente, createCliente, updateCliente, deleteCliente } from '../controllers/clienteController';

const router = Router();

router.get('/', getClientes);
router.get('/:telefone', getCliente);
router.post('/', createCliente);
router.put('/:telefone', updateCliente);
router.delete('/:telefone', deleteCliente);

export default router; 