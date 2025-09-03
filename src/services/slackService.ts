import { App } from '@slack/bolt';
import { ConfigLoader } from '../config/configLoader';
import { Logger } from './logger';
import { KafkaService } from './kafkaservices';
import {SlackMessage, KafkaMessage, ChannelMapping, UnifiedMessage} from '../types';

export class SlackService {
  private app: App;
  private kafkaService: KafkaService;
  private logger = Logger.getInstance();
  private channelMappings: Map<string, ChannelMapping> = new Map();

  constructor(kafkaService: KafkaService) {
    const config = ConfigLoader.getInstance().loadAppConfig();
    this.kafkaService = kafkaService;

    this.app = new App({
      token: config.slack.botToken,
      signingSecret: config.slack.signingSecret,
      socketMode: config.slack.socketMode,
      appToken: config.slack.socketMode ? config.slack.appToken : undefined
    });

    this.loadChannelMappings();
    this.setupEventHandlers();
  }

  private loadChannelMappings(): void {
    const mappingConfig = ConfigLoader.getInstance().loadChannelMapping();
    this.channelMappings.clear();

    mappingConfig.mappings.forEach(mapping => {
      if (mapping.enabled) {
        this.channelMappings.set(mapping.channelId, mapping);
        this.logger.info(`Loaded mapping: ${mapping.channelName} -> ${mapping.kafkaTopic}`);
      }
    });
  }

  private setupEventHandlers(): void {
    // Handle all message events
    this.app.event('message', async ({ event, client }) => {
      try {
        await this.handleMessage(event as SlackMessage, client);
      } catch (error) {
        this.logger.error('Error handling message event:', error);
      }
    });

    // Handle app mentions
    this.app.event('app_mention', async ({ event, client }) => {
      try {
        await this.handleMessage(event as SlackMessage, client);
      } catch (error) {
        this.logger.error('Error handling app_mention event:', error);
      }
    });
  }

  private async handleMessage(event: SlackMessage, client: any): Promise<void> {
    const mapping = this.channelMappings.get(event.channel);
    if (!mapping) {
      this.logger.debug(`No mapping found for channel: ${event.channel}`);
      return;
    }

    // Apply filters
    if (this.shouldFilterMessage(event, mapping)) {
      this.logger.debug(`Message filtered out from channel: ${mapping.channelName}`);
      return;
    }

    try {
      // Get user info
      let userName: string | undefined;
      if (event.user && !event.bot_id) {
        try {
          const userInfo = await client.users.info({ user: event.user });
          userName = userInfo.user?.display_name || userInfo.user?.real_name || userInfo.user?.name;
        } catch (error) {
          this.logger.warn(`Failed to get user info for ${event.user}:`, error);
        }
      }

      // Transform to unified message format
      const unifiedMessage: UnifiedMessage = {
        timestamp: new Date(parseFloat(event.ts) * 1000).toISOString(),
        channel: {
          id: event.channel,
          name: mapping.channelName
        },
        user: {
          id: event.user,
          name: userName
        },
        message: {
          text: event.text,
          id: event.ts, // Using ts as message ID for Slack
          thread_id: event.thread_ts,
          subtype: event.subtype
        },
        metadata: {
          workspace_id: event.team,
          bot_id: event.bot_id,
          source: 'slack'
        }
      };

      // Send to Kafka
      await this.kafkaService.sendMessage(mapping.kafkaTopic, unifiedMessage);

    } catch (error) {
      this.logger.error(`Failed to process message from channel ${mapping.channelName}:`, error);
    }
  }

  private shouldFilterMessage(event: SlackMessage, mapping: ChannelMapping): boolean {
    // Filter out bot messages if configured
    if (mapping.filters.excludeBots && (event.bot_id || event.subtype === 'bot_message')) {
      return true;
    }

    // Filter out specific subtypes
    if (event.subtype && mapping.filters.excludeSubtypes.includes(event.subtype)) {
      return true;
    }

    return false;
  }

  async start(): Promise<void> {
    try {
      await this.app.start();
      this.logger.info('Slack service started successfully');
    } catch (error) {
      this.logger.error('Failed to start Slack service:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      await this.app.stop();
      this.logger.info('Slack service stopped');
    } catch (error) {
      this.logger.error('Error stopping Slack service:', error);
    }
  }

  reloadMappings(): void {
    ConfigLoader.getInstance().reloadConfigs();
    this.loadChannelMappings();
    this.logger.info('Channel mappings reloaded');
  }
}

