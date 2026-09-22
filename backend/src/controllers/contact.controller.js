import contactService from '../services/contact.service.js';

export const contactController = {
  create: async (req, res) => {
    const created = await contactService.create(req.body);
    res.status(201).json({ success: true, data: created });
  },

  list: async (req, res) => {
    res.json({ success: true, data: await contactService.list() });
  },
};

export default contactController;
