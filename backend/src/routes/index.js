/** 모든 라우트를 한곳에 모읍니다. 새 도메인이 생기면 여기에 한 줄 추가하면 됩니다. */
import { Router } from 'express';
import portfolioRoutes from './portfolio.routes.js';
import contactRoutes from './contact.routes.js';
import { activeDataSource } from '../repositories/index.js';
import config from '../config/index.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: { status: 'ok', env: config.env, dataSource: activeDataSource, time: new Date().toISOString() },
  });
});

router.use('/portfolio', portfolioRoutes);
router.use('/contact', contactRoutes);

export default router;
