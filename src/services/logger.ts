import * as winston from 'winston';
import * as path from 'path';
import { ConfigLoader } from '../config/configLoader';

export class Logger {
  private static instance: winston.Logger;

  static getInstance(): winston.Logger {
    if (!Logger.instance) {
      const config = ConfigLoader.getInstance().loadAppConfig();
      const logsDir = path.join(process.cwd(), 'logs');

      Logger.instance = winston.createLogger({
        level: config.logging.level,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json()
        ),
        transports: [
          new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: config.logging.maxSize,
            maxFiles: config.logging.maxFiles
          }),
          new winston.transports.File({
            filename: path.join(logsDir, 'app.log'),
            maxsize: config.logging.maxSize,
            maxFiles: config.logging.maxFiles
          }),
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.colorize(),
              winston.format.simple()
            )
          })
        ]
      });
    }

    return Logger.instance;
  }
}

