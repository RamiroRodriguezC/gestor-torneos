export class AppError extends Error {
  constructor(type, message) {
    super(message || type.defaultMessage)
    this.type = type.type
    this.code = type.code
    this.name = 'AppError'
  }
}
