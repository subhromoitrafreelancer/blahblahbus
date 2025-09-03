export interface PumbleConfig {
  webhookSecret: string;
  apiToken?: string;
  webhookPath: string;
}

export interface PumbleMessage {
  id: string;
  type: string;
  channel_id: string;
  user_id: string;
  text: string;
  timestamp: number;
  thread_id?: string;
  is_bot?: boolean;
  bot_id?: string;
  workspace_id: string;
  message_type?: string;
}

export interface PumbleWebhookPayload {
  event: {
    type: string;
    message?: PumbleMessage;
    channel?: {
      id: string;
      name: string;
    };
    user?: {
      id: string;
      name: string;
      display_name?: string;
    };
  };
  workspace_id: string;
  api_app_id: string;
  event_id: string;
  event_time: number;
}

export interface PumbleChannelMapping {
  channelId: string;
  channelName: string;
  kafkaTopic: string;
  enabled: boolean;
  filters: {
    excludeBots: boolean;
    excludeMessageTypes: string[];
  };
}

export interface PumbleChannelMappingConfig {
  mappings: PumbleChannelMapping[];
}
