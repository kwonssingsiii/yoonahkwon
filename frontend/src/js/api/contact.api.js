/** 문의 메시지 전송. 폼을 붙일 때 이 함수를 쓰면 됩니다. */
import api from './client.js';

export const contactApi = {
  sendMessage: ({ name, email, message }) => api.post('/contact/messages', { name, email, message }),
  listMessages: () => api.get('/contact/messages'),
};

export default contactApi;
