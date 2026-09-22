import config from '../config/index.js';

/** 모든 에러를 { success:false, error:{...} } 형태의 JSON 으로 통일합니다. */
// eslint-disable-next-line no-unused-vars -- Express 는 인자 4개를 보고 에러 핸들러로 인식합니다.
export const errorHandler = (err, _req, res, _next) => {
  const status = err.status ?? 500;

  if (status >= 500) {
    console.error('[error]', err);
  }

  res.status(status).json({
    success: false,
    error: {
      message: err.message ?? '알 수 없는 오류',
      ...(err.details ? { details: err.details } : {}),
      ...(config.env === 'development' && status >= 500 ? { stack: err.stack } : {}),
    },
  });
};

export default errorHandler;
