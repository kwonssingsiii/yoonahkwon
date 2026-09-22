/** HTTP 요청/응답만 담당합니다. 로직은 서비스에 있습니다. */
import portfolioService from '../services/portfolio.service.js';

const ok = (res, data) => res.json({ success: true, data });

export const portfolioController = {
  getAll: async (req, res) => ok(res, await portfolioService.getAll()),
  getProfile: async (req, res) => ok(res, await portfolioService.getProfile()),
  getEducation: async (req, res) => ok(res, await portfolioService.getEducation()),
  getSkills: async (req, res) => ok(res, await portfolioService.getSkills()),
  getContact: async (req, res) => ok(res, await portfolioService.getContact()),
  getMeta: async (req, res) => ok(res, await portfolioService.getMeta()),

  getAwards: async (req, res) => ok(res, await portfolioService.getAwards({ tag: req.query.tag })),
  getAwardById: async (req, res) => ok(res, await portfolioService.getAwardById(req.params.id)),
};

export default portfolioController;
