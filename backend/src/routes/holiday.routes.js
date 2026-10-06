import { Router } from 'express';
import holidayService from '../services/holiday.service.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json({ success: true, data: await holidayService.getByYear(req.query.year) });
  }),
);

export default router;
