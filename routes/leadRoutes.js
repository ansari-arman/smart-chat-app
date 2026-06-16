import express from 'express';
import { leadPostController, leadUpdateController } from '../controllers/leadController.js';

const router = express.Router();

router.post('/',leadPostController);
router.patch('/:id',leadUpdateController)
export default router;