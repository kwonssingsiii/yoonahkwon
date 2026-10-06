import { Router } from 'express';
import weatherController from '../controllers/weather.controller.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(weatherController.getCurrent));

export default router;
