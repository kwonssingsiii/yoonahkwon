import { Router } from 'express';
import portfolioController from '../controllers/portfolio.controller.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(portfolioController.getAll));
router.get('/meta', asyncHandler(portfolioController.getMeta));
router.get('/profile', asyncHandler(portfolioController.getProfile));
router.get('/education', asyncHandler(portfolioController.getEducation));
router.get('/skills', asyncHandler(portfolioController.getSkills));
router.get('/contact', asyncHandler(portfolioController.getContact));
router.get('/location', asyncHandler(portfolioController.getLocation));

// 구체적인 경로(/awards)를 먼저, 파라미터 경로(/awards/:id)를 뒤에 둡니다.
router.get('/awards', asyncHandler(portfolioController.getAwards));
router.get('/awards/:id', asyncHandler(portfolioController.getAwardById));

export default router;
