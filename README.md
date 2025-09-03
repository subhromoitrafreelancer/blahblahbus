# BlahBlahBus

A Node.js middleware service that receives messages from Slack/Pumble channels and forwards them to corresponding Kafka topics.

## Features

- External configuration management
- Channel to Kafka topic mapping
- Message filtering (bots, subtypes)
- Comprehensive error handling and logging
- Health monitoring endpoints
- Docker containerization
- AWS container deployment ready
- TypeScript support

## Prerequisites

- Node.js 18+ LTS
- Docker (for containerized deployment)
- Kafka cluster
- Slack App with proper permissions

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment file:
   ```bash
   cp .env.example .env
   ```

4. Configure your Slack app credentials in `.env`
5. Update `config/app.json` and `config/channel-mapping.json`

## Configuration

### Environment Variables

Create a `.env` file with your Slack credentials:

```env
SLACK_SIGNING_SECRET=your_slack_signing_secret
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_APP_TOKEN=xapp-your-app-token
```

### App Configuration (`config/app.json`)

Configure server, Kafka, and logging settings.

### Channel Mapping (`config/channel-mapping.json`)

Define which Slack channels map to which Kafka topics with filtering options.

## Slack App Setup

1. Create a new Slack app at https://api.slack.com/apps
2. Configure the following OAuth scopes under "OAuth & Permissions":
   - `channels:history` - View messages in public channels
   - `groups:history` - View messages in private channels
   - `im:history` - View messages in direct messages
   - `mpim:history` - View messages in group direct messages
   - `users:read` - View people in the workspace

3. Enable Events API under "Event Subscriptions":
   - Set Request URL to: `https://your-domain.com/slack/events`
   - Subscribe to bot events: `message.channels`, `message.groups`, `message.im`, `message.mpim`, `app_mention`

4. Install the app to your workspace and note the tokens

## Deployment

### Local Development

```bash
npm run dev
```

### Docker

```bash
docker build -t slack-kafka-middleware .
docker run -p 3000:3000 slack-kafka-middleware
```

### Docker Compose

```bash
docker-compose up -d
```

### AWS Container Deployment

1. Build and push to ECR:
   ```bash
   docker build -t slack-kafka-middleware .
   docker tag slack-kafka-middleware:latest <your-ecr-uri>:latest
   docker push <your-ecr-uri>:latest
   ```

2. Deploy using ECS, EKS, or App Runner with appropriate environment variables and volume mounts for configuration files.

## API Endpoints

- `GET /health` - Health check
- `GET /metrics` - Application metrics
- `POST /reload-config` - Reload configuration files

## Monitoring

- Logs are written to `logs/` directory
- JSON formatted logs for easy parsing
- Error logs separated for alerting
- Health endpoint for load balancer checks

## Message Flow

1. Slack sends message events to the middleware
2. Middleware checks channel mapping configuration
3. Applies configured filters
4. Transforms message to standardized format
5. Sends to corresponding Kafka topic
6. Logs success/failure

## Troubleshooting

1. Check logs in `logs/` directory
2. Verify Slack app permissions and tokens
3. Ensure Kafka brokers are accessible
4. Validate configuration files against schema
5. Use health endpoints for diagnostics

## License

MIT

