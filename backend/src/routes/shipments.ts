import { Router } from 'express';
import * as shipmentController from '../controllers/shipmentController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.post('/', requireRole(['IMPORTER']), shipmentController.createShipment);
router.get('/', shipmentController.getShipments);
router.get('/:id', shipmentController.getShipmentById);
router.patch('/:id', requireRole(['IMPORTER']), shipmentController.updateShipment);
router.post('/:id/close', requireRole(['IMPORTER']), shipmentController.closeShipment);
router.delete('/:id', requireRole(['IMPORTER']), shipmentController.deleteShipment);

export default router;
