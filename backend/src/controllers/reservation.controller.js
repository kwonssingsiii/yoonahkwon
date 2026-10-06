import reservationService from '../services/reservation.service.js';

export const reservationController = {
  getAvailability: async (req, res) => {
    res.json({ success: true, data: await reservationService.getAvailability(String(req.query.date ?? '')) });
  },

  getFullDates: async (req, res) => {
    res.json({ success: true, data: await reservationService.getFullDates() });
  },

  create: async (req, res) => {
    const created = await reservationService.create(req.body);
    res.status(201).json({ success: true, data: created });
  },
};

export default reservationController;
