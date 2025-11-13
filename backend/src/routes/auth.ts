import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/register/forwarder', authController.registerForwarder);
router.post('/register/importer', authController.registerImporter);
router.post('/login', authController.login);
router.get('/me', authenticateToken, authController.getMe);

export default router;
