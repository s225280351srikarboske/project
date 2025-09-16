import { Router } from 'express';
import {listAddTenants, getAddTenant, createAddTenant, updateAddTenant, deleteAddTenant} from '../controllers/addTenantController.js';


const router = Router();

const requireAuth = (req, _res, next) => next();
const requireAdmin = (req, _res, next) => next();

router.get('/',requireAuth, listAddTenants); 
router.get('/:id', getAddTenant);
router.post('/', createAddTenant);
router.put('/:id', updateAddTenant);
router.delete('/:id', deleteAddTenant);

export default router;