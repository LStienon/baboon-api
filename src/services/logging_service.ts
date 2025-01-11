import { createLogger, format, transports, Logger } from 'winston'
import path from 'path'
import fs from 'fs'

const logDir = 'logs'

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir)
}

const formatDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const logFileName = `${formatDate(new Date())}.log`

const logger: Logger = createLogger({
  level: 'info',
  format: format.combine(
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      format.printf(({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`)
  ),
  transports: [
    new transports.File({ filename: path.join(logDir, logFileName) }),
    new transports.Console(),
  ],
})

const formatMessage = (message: string, context?: Record<string, unknown>): string => {
  if (context) {
    return `${message} | Context: ${JSON.stringify(context)}`
  }
  return message
}

export const LoggingService = {
  info: (message: string, context?: Record<string, unknown>) => {
    logger.info(formatMessage(message, context))
  },
  error: (message: string, context?: Record<string, unknown>) => {
    logger.error(formatMessage(message, context))
  },
  warn: (message: string, context?: Record<string, unknown>) => {
    logger.warn(formatMessage(message, context));
  }
}

