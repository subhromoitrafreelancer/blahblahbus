import * as fs from 'fs';
import * as path from 'path';
import * as Joi from 'joi';
import { AppConfig, ChannelMappingConfig } from '../types';

const appConfigSchema = Joi.object({
  server: Joi.object({
    port: Joi.number().port().required(),
    host: Joi.string().required()
  }).required(),
  kafka: Joi.object({
    brokers: Joi.array().items(Joi.string()).min(1).required(),
    clientId: Joi.string().required(),
    connectionTimeout: Joi.number().positive().required(),
    requestTimeout: Joi.number().positive().required(),
    retry: Joi.object({
      retries: Joi.number().min(0).required(),
      initialRetryTime: Joi.number().positive().required()
    }).required()
  }).required(),
  slack: Joi.object({
    signingSecret: Joi.string().required(),
    botToken: Joi.string().required(),
    appToken: Joi.string().required(),
    socketMode: Joi.boolean().required()
  }).required(),
  logging: Joi.object({
    level: Joi.string().valid('error', 'warn', 'info', 'debug').required(),
    maxFiles: Joi.number().positive().required(),
    maxSize: Joi.string().required(),
    datePattern: Joi.string().required()
  }).required()
});

const channelMappingSchema = Joi.object({
  mappings: Joi.array().items(
    Joi.object({
      channelId: Joi.string().required(),
      channelName: Joi.string().required(),
      kafkaTopic: Joi.string().required(),
      enabled: Joi.boolean().required(),
      filters: Joi.object({
        excludeBots: Joi.boolean().required(),
        excludeSubtypes: Joi.array().items(Joi.string()).required()
      }).required()
    })
  ).required()
});

export class ConfigLoader {
  private static instance: ConfigLoader;
  private appConfig: AppConfig | null = null;
  private channelMappingConfig: ChannelMappingConfig | null = null;

  private constructor() {}

  static getInstance(): ConfigLoader {
    if (!ConfigLoader.instance) {
      ConfigLoader.instance = new ConfigLoader();
    }
    return ConfigLoader.instance;
  }

  private substituteEnvVars(obj: any): any {
    const envVarRegex = /\$\{([^}]+)\}/g;

    if (typeof obj === 'string') {
      return obj.replace(envVarRegex, (match, envVar) => {
        return process.env[envVar] || match;
      });
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.substituteEnvVars(item));
    }

    if (obj && typeof obj === 'object') {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.substituteEnvVars(value);
      }
      return result;
    }

    return obj;
  }

  loadAppConfig(): AppConfig {
    if (this.appConfig) return this.appConfig;

    const configPath = path.join(process.cwd(), 'config', 'app.json');

    if (!fs.existsSync(configPath)) {
      throw new Error(`App config file not found: ${configPath}`);
    }

    try {
      const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const configWithEnvVars = this.substituteEnvVars(configData);

      const { error, value } = appConfigSchema.validate(configWithEnvVars);
      if (error) {
        throw new Error(`Invalid app configuration: ${error.message}`);
      }

      this.appConfig = value;
      return <AppConfig>this.appConfig;
    } catch (error) {
      throw new Error(`Failed to load app config: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  loadChannelMapping(): ChannelMappingConfig {
    if (this.channelMappingConfig) return this.channelMappingConfig;

    const mappingPath = path.join(process.cwd(), 'config', 'channel-mapping.json');

    if (!fs.existsSync(mappingPath)) {
      throw new Error(`Channel mapping file not found: ${mappingPath}`);
    }

    try {
      const mappingData = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));

      const { error, value } = channelMappingSchema.validate(mappingData);
      if (error) {
        throw new Error(`Invalid channel mapping configuration: ${error.message}`);
      }

      this.channelMappingConfig = value;
      return <ChannelMappingConfig>this.channelMappingConfig;
    } catch (error) {
      throw new Error(`Failed to load channel mapping: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  reloadConfigs(): void {
    this.appConfig = null;
    this.channelMappingConfig = null;
  }
}
