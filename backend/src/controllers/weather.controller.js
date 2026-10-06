import weatherService from '../services/weather.service.js';

export const weatherController = {
  getCurrent: async (req, res) => {
    res.json({ success: true, data: await weatherService.getForLocation() });
  },
};

export default weatherController;
