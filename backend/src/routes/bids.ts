import { Router } from 'express';
import * as bidController from '../controllers/bidController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.post('/', requireRole(['FORWARDER']), bidController.createBid);
router.get('/my', requireRole(['FORWARDER']), bidController.getMyBids);
router.get('/:id', bidController.getBidById);
router.patch('/:id', requireRole(['FORWARDER']), bidController.updateBid);
router.delete('/:id', requireRole(['FORWARDER']), bidController.deleteBid);

export default router;
