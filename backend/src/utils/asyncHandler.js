/**
 * async 라우트 핸들러의 예외를 Express 에러 미들웨어로 넘겨줍니다.
 * (DB 를 붙이면 핸들러가 전부 async 가 되므로 미리 깔아둡니다.)
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
