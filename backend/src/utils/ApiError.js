/** HTTP 상태코드를 가진 에러. 컨트롤러/서비스에서 던지면 errorHandler 가 응답으로 변환합니다. */
export class ApiError extends Error {
  constructor(status, message, details = undefined) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }

  static badRequest(message, details) {
    return new ApiError(400, message, details);
  }

  static notFound(message = '요청한 리소스를 찾을 수 없습니다.') {
    return new ApiError(404, message);
  }

  static internal(message = '서버 내부 오류가 발생했습니다.') {
    return new ApiError(500, message);
  }
}

export default ApiError;
