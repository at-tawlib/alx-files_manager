import { Router } from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UserController';

const router = Router();

router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);
router.post('/users', UsersController.postNew);

module.exports = router;
