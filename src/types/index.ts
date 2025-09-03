export interface AppConfig {
  server: {
    port: number;
    host: string;
  };
  kafka: {
    brokers: string[];
    clientId: string;
    connectionTimeout: number;
    requestTimeout: number;
    retry: {
      retries: number;
      initialRetryTime: number;
    };
  };
  slack: {
    signingSecret: string;
    botToken: string;
    appToken: string;
    socketMode: boolean;
  };
  logging: {
    level: string;
    maxFiles: number;
    maxSize: number;
    datePattern: string;
  };
}

export interface ChannelMapping {
  channelId: string;
  channelName: string;
  kafkaTopic: string;
  enabled: boolean;
  filters: {
    excludeBots: boolean;
    excludeSubtypes: string[];
  };
}

export interface ChannelMappingConfig {
  mappings: ChannelMapping[];
}

export interface SlackMessage {
  type: string;
  channel: string;
  user: string;
  text: string;
  ts: string;
  team: string;
  subtype?: string;
  bot_id?: string;
  thread_ts?: string;
}

export interface KafkaMessage {
  timestamp: string;
  channel: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    name?: string;
  };
  message: {
    text: string;
    ts: string;
    thread_ts?: string;
    subtype?: string;
  };
  metadata: {
    team: string;
    bot_id?: string;
    source: 'slack';
  };
}


