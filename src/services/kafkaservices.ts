import { Kafka, Producer, Message } from 'kafkajs';
import { ConfigLoader } from '../config/configLoader';
import { Logger } from './logger';
import {UnifiedMessage} from '../types';

export class KafkaService {
  private kafka: Kafka;
  private producer: Producer;
  private logger = Logger.getInstance();
  private isConnected = false;

  constructor() {
    const config = ConfigLoader.getInstance().loadAppConfig();

    this.kafka = new Kafka({
      clientId: config.kafka.clientId,
      brokers: config.kafka.brokers,
      connectionTimeout: config.kafka.connectionTimeout,
      requestTimeout: config.kafka.requestTimeout,
      retry: config.kafka.retry
    });

    this.producer = this.kafka.producer();
  }

  async connect(): Promise<void> {
    try {
      await this.producer.connect();
      this.isConnected = true;
      this.logger.info('Kafka producer connected successfully');
    } catch (error) {
      this.logger.error('Failed to connect to Kafka:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.producer.disconnect();
      this.isConnected = false;
      this.logger.info('Kafka producer disconnected');
    } catch (error) {
      this.logger.error('Error disconnecting from Kafka:', error);
    }
  }

  async sendMessage(topic: string, message: UnifiedMessage): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Kafka producer is not connected');
    }

    try {
      const kafkaMessage: Message = {
        key: `${message.channel.id}-${message.message.id}`,
        value: JSON.stringify(message),
        timestamp: message.timestamp,
        headers: {
          'content-type': 'application/json',
          'source': `${message.metadata.source}-kafka-middleware`
        }
      };

      await this.producer.send({
        topic,
        messages: [kafkaMessage]
      });

      this.logger.info(`Message sent to Kafka topic ${topic}`, {
        source: message.metadata.source,
        channel: message.channel.name,
        user: message.user.id,
        messageId: message.message.id
      });
    } catch (error) {
      this.logger.error(`Failed to send message to Kafka topic ${topic}:`, error);
      throw error;
    }
  }


  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

