# Pumble Integration Setup Guide

## Overview
This guide shows how to set up Pumble webhook integration with your existing Slack-to-Kafka middleware.

## Key Changes Made

### 1. **Separate Webhook Endpoint**
- **Slack**: Uses Slack Bolt SDK with Events API
- **Pumble**: Uses webhook endpoint at `/pumble/webhook` (configurable)

### 2. **Unified Message Format**
Both Slack and Pumble messages are transformed into a `UnifiedMessage` format:

```json
{
  "timestamp": "2025-01-15T10:30:00.000Z",
  "channel": { "id": "...", "name": "..." },
  "user": { "id": "...", "name": "..." },
  "message": { "text": "...", "id": "...", "thread_id": "..." },
  "metadata": { "workspace_id": "...", "source": "pumble" }
}
```

### 3. **Separate Configuration Files**
- `config/channel-mapping.json` - Slack channels
- `config/pumble-channel-mapping.json` - Pumble channels

## Pumble App Setup

### 1. Create Pumble App
1. Go to your Pumble workspace settings
2. Navigate to "Apps & Integrations"
3. Create a new webhook integration
4. Note the webhook secret for signature verification

### 2. Configure Webhook URL
Set your webhook URL to: `https://your-domain.com/pumble/webhook`

### 3. Required Permissions
- Read message events from channels
- Access to user information (for name enrichment)

## Environment Variables

Add to your `.env` file:
```env
# Existing Slack variables...

# Add Pumble variables
PUMBLE_WEBHOOK_SECRET=your_pumble_webhook_secret_here
PUMBLE_API_TOKEN=your_pumble_api_token_here  # Optional
```

## Configuration Setup

### 1. Update `config/app.json`
Add the pumble section to your existing configuration:

```json
{
  // ... existing slack, kafka, server config ...
  "pumble": {
    "webhookSecret": "${PUMBLE_WEBHOOK_SECRET}",
    "apiToken": "${PUMBLE_API_TOKEN}",
    "webhookPath": "/pumble/webhook"
  }
}
```

### 2. Create `config/pumble-channel-mapping.json`
Map Pumble channels to Kafka topics:

```json
{
  "mappings": [
    {
      "channelId": "P1234567890",
      "channelName": "general",
      "kafkaTopic": "pumble-general",
      "enabled": true,
      "filters": {
        "excludeBots": true,
        "excludeMessageTypes": ["channel_join", "channel_leave", "system"]
      }
    }
  ]
}
```

## API Endpoints

### New Endpoints Added
- `POST /pumble/webhook` - Receives Pumble webhook events
- `POST /reload-config/pumble` - Reload only Pumble configuration
- `POST /reload-config/slack` - Reload only Slack configuration

### Updated Endpoints
- `GET /health` - Now shows both Slack and Pumble service status
- `GET /metrics` - Includes both service endpoints
- `POST /reload-config` - Reloads both Slack and Pumble configs

## Testing the Integration

### 1. Start Services
```bash
# Start Kafka
make start

# Start your middleware
npm run dev
```

### 2. Test Pumble Webhook
```bash
# Test webhook endpoint
curl -X POST http://localhost:3000/pumble/webhook \
  -H "Content-Type: application/json" \
  -H "X-Pumble-Signature: sha256=your_signature" \
  -d '{"event":{"type":"message","message":{"text":"test"}}}'
```

### 3. Monitor Messages
```bash
# Watch Pumble messages
make consumer TOPIC=pumble-general

# Watch Slack messages (existing)
make consumer TOPIC=slack-general
```

## Message Flow Comparison

### Slack Flow
1. Slack → Events API → Slack Bolt SDK → Transform → Kafka
2. Real-time connection via Slack Events API

### Pumble Flow
1. Pumble → Webhook → Express Route → Transform → Kafka
2. HTTP webhook calls with signature verification

## Troubleshooting

### Common Issues

1. **Webhook Signature Verification Failed**
   ```
   Solution: Check PUMBLE_WEBHOOK_SECRET matches your Pumble app
   ```

2. **No Channel Mapping Found**
   ```
   Solution: Add channel mapping in pumble-channel-mapping.json
   ```

3. **Messages Not Appearing in Kafka**
   ```
   Check: /health endpoint shows services running
   Check: Kafka topics exist (make list-topics)
   Check: Logs for filtering/errors
   ```

### Debug Commands
```bash
# Check service health
curl http://localhost:3000/health

# Reload Pumble config only
curl -X POST http://localhost:3000/reload-config/pumble

# View logs
docker-compose -f docker-compose.kafka-dev.yml logs -f
```

## Security Considerations

### Webhook Security
- **Signature Verification**: All Pumble webhooks are verified using HMAC-SHA256
- **Secret Management**: Webhook secrets stored in environment variables
- **HTTPS Required**: Production deployments should use HTTPS endpoints

### Network Security
- **Firewall**: Allow Pumble webhook IPs to reach your endpoint
- **Rate Limiting**: Consider adding rate limiting for webhook endpoints
- **Monitoring**: Monitor webhook endpoint for unusual activity

## Deployment Notes

### Docker Updates
The existing Docker setup works without changes. Just ensure:
1. Mount both config files as volumes
2. Set Pumble environment variables
3. Expose webhook endpoint through load balancer

### AWS Deployment
- **ALB**: Route `/pumble/webhook` to your container
- **Secrets Manager**: Store PUMBLE_WEBHOOK_SECRET securely
- **CloudWatch**: Monitor both Slack and Pumble message flows

## Extending Further

This architecture makes it easy to add more platforms:

1. **Create new service** (e.g., `TeamsService`, `DiscordService`)
2. **Add configuration** files and environment variables
3. **Transform to UnifiedMessage** format
4. **Add routes** in server.ts
5. **Create topics** in Kafka

The unified message format ensures all platforms send consistent data to Kafka consumers.
