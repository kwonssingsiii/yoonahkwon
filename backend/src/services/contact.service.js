/**
 * 문의 메시지 로직 — 검증은 서비스에서, 저장은 저장소에서.
 * 메일 발송이나 슬랙 알림을 붙인다면 create() 안에서 호출하면 됩니다.
 */
import { messageRepository } from '../repositories/index.js';
import ApiError from '../utils/ApiError.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validate = ({ name, email, message }) => {
  const errors = {};
  if (!name?.trim()) errors.name = '이름을 입력해 주세요.';
  if (!email?.trim()) errors.email = '이메일을 입력해 주세요.';
  else if (!EMAIL_PATTERN.test(email)) errors.email = '이메일 형식이 올바르지 않습니다.';
  if (!message?.trim()) errors.message = '내용을 입력해 주세요.';
  else if (message.trim().length < 5) errors.message = '내용은 5자 이상 입력해 주세요.';
  return errors;
};

export const contactService = {
  async create(payload) {
    const errors = validate(payload ?? {});
    if (Object.keys(errors).length > 0) {
      throw ApiError.badRequest('입력값을 확인해 주세요.', errors);
    }

    return messageRepository.create({
      name: payload.name.trim(),
      email: payload.email.trim(),
      message: payload.message.trim(),
    });
  },

  list: () => messageRepository.findAll(),
};

export default contactService;
