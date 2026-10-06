import ApiError from '../utils/ApiError.js';

export const notFound = (req, _res, next) => {
  next(ApiError.notFound(`경로를 찾을 수 없습니다: ${req.method} ${req.originalUrl}`));
};

export default notFound;
