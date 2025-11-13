import { Router } from 'express';
import * as userController from '../controllers/userController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// All routes require authentication and IMPORTER role
router.use(authenticateToken);
router.use(requireRole(['IMPORTER']));

router.get('/forwarders/pending', userController.getPendingForwarders);
router.get('/forwarders', userController.getAllForwarders);
router.patch('/forwarders/:id/status', userController.updateForwarderStatus);

export default router;
