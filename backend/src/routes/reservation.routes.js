import { Router } from 'express';
import reservationController from '../controllers/reservation.controller.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

// 예약 목록 조회(GET /)는 예약자 개인정보가 담기므로 관리자 인증을 붙이기 전까지 열지 않습니다.
router.get('/availability', asyncHandler(reservationController.getAvailability));
router.post('/', asyncHandler(reservationController.create));

export default router;
