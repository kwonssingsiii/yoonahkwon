/** 모든 라우트를 한곳에 모읍니다. 새 도메인이 생기면 여기에 한 줄 추가하면 됩니다. */
import { Router } from 'express';
import portfolioRoutes from './portfolio.routes.js';
import contactRoutes from './contact.routes.js';
import reservationRoutes from './reservation.routes.js';
import weatherRoutes from './weather.routes.js';
import holidayRoutes from './holiday.routes.js';
import { activeDataSource, activeReservationStore } from '../repositories/index.js';
import config from '../config/index.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: { status: 'ok', env: config.env, dataSource: activeDataSource, reservationStore: activeReservationStore, time: new Date().toISOString() },
  });
});

router.use('/portfolio', portfolioRoutes);
router.use('/contact', contactRoutes);
router.use('/reservations', reservationRoutes);
router.use('/weather', weatherRoutes);
router.use('/holidays', holidayRoutes);

export default router;
