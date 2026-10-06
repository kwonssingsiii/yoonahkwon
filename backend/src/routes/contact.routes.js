import { Router } from 'express';
import contactController from '../controllers/contact.controller.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

router.post('/messages', asyncHandler(contactController.create));
router.get('/messages', asyncHandler(contactController.list));

export default router;
