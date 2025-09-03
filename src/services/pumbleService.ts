// src/services/pumbleService.ts
import * as crypto from 'crypto';
import { Request, Response } from 'express';
import { ConfigLoader } from '../config/configLoader';
import { Logger } from './logger';
import { KafkaService } from './kafkaservices';
import { PumbleWebhookPayload, PumbleMessage, PumbleChannelMapping } from '../types/pumble';
import { UnifiedMessage } from '../types';

export class PumbleService {
  private kafkaService: KafkaService;
  private logger = Logger.getInstance();
  private channelMappings: Map<string, PumbleChannelMapping> = new Map();
  private config: any;

  constructor(kafkaService: KafkaService) {
    this.kafkaService = kafkaService;
    this.config = ConfigLoader.getInstance().loadAppConfig();
    this.loadChannelMappings();
  }

  private loadChannelMappings(): void {
    try {
      const mappingConfig = ConfigLoader.getInstance().loadPumbleChannelMapping();
      this.channelMappings.clear();

      mappingConfig.mappings.forEach(mapping => {
        if (mapping.enabled) {
          this.channelMappings.set(mapping.channelId, mapping);
          this.logger.info(`Loaded Pumble mapping: ${mapping.channelName} -> ${mapping.kafkaTopic}`);
        }
      });
    } catch (error) {
      this.logger.error('Failed to load Pumble channel mappings:', error);
    }
  }

  private verifyWebhookSignature(payload: string, signature: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', this.config.pumble.webhookSecret)
      .update(payload)
      .digest('hex');

    const receivedSignature = signature.replace('sha256=', '');

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(receivedSignature, 'hex')
    );
  }

  async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const signature = req.headers['x-pumble-signature'] as string;
      const payload = JSON.stringify(req.body);

      // Verify webhook signature
      if (!signature || !this.verifyWebhookSignature(payload, signature)) {
        this.logger.warn('Invalid Pumble webhook signature');
        res.status(401).json({ error: 'Invalid signature' });
        return;
      }

      const webhookData: PumbleWebhookPayload = req.body;

      // Handle different event types
      if (webhookData.event.type === 'message') {
        await this.handleMessage(webhookData);
      } else {
        this.logger.debug(`Ignoring Pumble event type: ${webhookData.event.type}`);
      }

      res.status(200).json({ status: 'ok' });

    } catch (error) {
      this.logger.error('Error handling Pumble webhook:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  private async handleMessage(webhookData: PumbleWebhookPayload): Promise<void> {
    const { event } = webhookData;
    const message = event.message;
    const channel = event.channel;
    const user = event.user;

    if (!message || !channel) {
      this.logger.debug('Incomplete Pumble message data');
      return;
    }

    const mapping = this.channelMappings.get(channel.id);
    if (!mapping) {
      this.logger.debug(`No mapping found for Pumble channel: ${channel.id}`);
      return;
    }

    // Apply filters
    if (this.shouldFilterMessage(message, mapping)) {
      this.logger.debug(`Message filtered out from Pumble channel: ${mapping.channelName}`);
      return;
    }

    try {
      // Transform to unified message format
      const unifiedMessage: UnifiedMessage = {
        timestamp: new Date(message.timestamp * 1000).toISOString(),
        channel: {
          id: channel.id,
          name: mapping.channelName
        },
        user: {
          id: message.user_id,
          name: user?.display_name || user?.name
        },
        message: {
          text: message.text,
          id: message.id,
          thread_id: message.thread_id,
          message_type: message.message_type
        },
        metadata: {
          workspace_id: message.workspace_id,
          bot_id: message.bot_id,
          source: 'pumble'
        }
      };

      // Send to Kafka
      await this.kafkaService.sendMessage(mapping.kafkaTopic, unifiedMessage);

      this.logger.info(`Pumble message sent to Kafka topic ${mapping.kafkaTopic}`, {
        channel: mapping.channelName,
        user: message.user_id,
        messageId: message.id
      });

    } catch (error) {
      this.logger.error(`Failed to process Pumble message from channel ${mapping.channelName}:`, error);
    }
  }

  private shouldFilterMessage(message: PumbleMessage, mapping: PumbleChannelMapping): boolean {
    // Filter out bot messages if configured
    if (mapping.filters.excludeBots && (message.is_bot || message.bot_id)) {
      return true;
    }

    // Filter out specific message types
    if (message.message_type && mapping.filters.excludeMessageTypes.includes(message.message_type)) {
      return true;
    }

    return false;
  }

  reloadMappings(): void {
    this.loadChannelMappings();
    this.logger.info('Pumble channel mappings reloaded');
  }

  getWebhookPath(): string {
    return this.config.pumble.webhookPath;
  }
}
