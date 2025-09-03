import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { ConfigLoader } from './config/configLoader';
import { Logger } from './services/logger';
import { KafkaService } from './services/kafkaservices';
import { SlackService } from './services/slackService';

export class Server {
  private app: express.Application;
  private kafkaService: KafkaService;
  private slackService: SlackService;
  private logger = Logger.getInstance();

  constructor() {
    this.app = express();
    this.kafkaService = new KafkaService();
    this.slackService = new SlackService(this.kafkaService);

    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(express.json());
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        kafka: {
          connected: this.kafkaService.getConnectionStatus()
        },
        uptime: process.uptime()
      };

      res.json(health);
    });

    // Reload configuration endpoint
    this.app.post('/reload-config', (req, res) => {
      try {
        this.slackService.reloadMappings();
        res.json({ message: 'Configuration reloaded successfully' });
      } catch (error) {
        this.logger.error('Failed to reload configuration:', error);
        res.status(500).json({ error: 'Failed to reload configuration' });
      }
    });

    // Metrics endpoint
    this.app.get('/metrics', (req, res) => {
      const metrics = {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        kafka: {
          connected: this.kafkaService.getConnectionStatus()
        },
        timestamp: new Date().toISOString()
      };

      res.json(metrics);
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({ error: 'Endpoint not found' });
    });

    // Error handler
    this.app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      this.logger.error('Express error:', err);
      res.status(500).json({ error: 'Internal server error' });
    });
  }

  async start(): Promise<void> {
    const config = ConfigLoader.getInstance().loadAppConfig();

    try {
      // Connect to Kafka
      await this.kafkaService.connect();

      // Start Slack service
      await this.slackService.start();

      // Start HTTP server
      this.app.listen(config.server.port, config.server.host, () => {
        this.logger.info(`Server started on ${config.server.host}:${config.server.port}`);
      });

    } catch (error) {
      this.logger.error('Failed to start server:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      await this.slackService.stop();
      await this.kafkaService.disconnect();
      this.logger.info('Server stopped gracefully');
    } catch (error) {
      this.logger.error('Error during server shutdown:', error);
    }
  }
}

