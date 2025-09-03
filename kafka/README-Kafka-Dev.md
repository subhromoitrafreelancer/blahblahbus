# Kafka Development Environment

This Docker Compose setup provides a complete Kafka development environment for testing the Slack-to-Kafka middleware.

## Quick Start

### Option 1: Using Make (Recommended)
```bash
# Start everything
make start

# View logs
make logs

# Stop everything
make stop

# Clean up (including data volumes)
make clean
```

### Option 2: Manual Commands
```bash
# Start services
docker-compose -f docker-compose.kafka-dev.yml up -d

# Wait for services to start, then create topics
sleep 45
bash kafka-topics-setup.sh

# Stop services
docker-compose -f docker-compose.kafka-dev.yml down
```

## Services Included

### Core Services
- **Zookeeper** (port 2181) - Kafka coordination
- **Kafka Broker** (port 9092) - Main Kafka service
- **Kafka UI** (port 8080) - Web interface for managing Kafka

### Optional Services (Commented Out)
- **Kafdrop** - Alternative web UI
- **Schema Registry** - For Avro schemas
- **Kafka Connect** - For connectors

## Accessing Services

- **Kafka Broker**: `localhost:9092`
- **Kafka UI**: http://localhost:8080
- **Zookeeper**: `localhost:2181`

## Pre-created Topics

The setup automatically creates these topics for your Slack channels:
- `slack-general`
- `slack-alerts`
- `slack-development`
- `slack-support`

## Testing Commands

### Consumer Testing
```bash
# Listen to all messages from beginning
make consumer TOPIC=slack-general

# Or manually:
bash kafka-consumer-test.sh slack-general
```

### Producer Testing
```bash
# Send test messages
make producer TOPIC=slack-general

# Or manually:
bash kafka-producer-test.sh slack-general
```

### Topic Management
```bash
# List all topics
make list-topics

# Describe a topic
make describe-topic TOPIC=slack-general
```

## Configuration for Middleware

Update your middleware's `config/app.json`:
```json
{
  "kafka": {
    "brokers": ["localhost:9092"],
    "clientId": "slack-kafka-middleware"
  }
}
```

## Development Tips

1. **Kafka UI**: Use http://localhost:8080 to monitor topics, messages, and consumers
2. **Data Persistence**: Data is stored in Docker volumes and persists between restarts
3. **Resource Usage**: Configured for development with reduced memory settings
4. **Auto-create Topics**: Kafka will automatically create topics if they don't exist

## Troubleshooting

### Services Not Starting
```bash
# Check logs
make logs

# Or specific service logs
docker-compose -f docker-compose.kafka-dev.yml logs kafka
```

### Port Conflicts
If ports are already in use, modify the ports in `docker-compose.kafka-dev.yml`:
```yaml
ports:
  - "9093:9092"  # Change external port
```

### Clean Start
```bash
# Remove all data and restart fresh
make clean
make start
```

### Health Checks
```bash
# Check if Kafka is ready
docker exec kafka-dev-broker kafka-broker-api-versions --bootstrap-server localhost:9092
```

## Production Differences

This development setup differs from production:
- Single broker (vs. multiple for HA)
- Replication factor of 1 (vs. 3+ for production)
- Shorter retention periods
- Auto-topic creation enabled
- No authentication/SSL
- Reduced memory settings

## Integration with Slack Middleware

1. Start Kafka: `make start`
2. Update middleware config to use `localhost:9092`
3. Start your Slack middleware
4. Monitor messages in Kafka UI at http://localhost:8080
5. Test with console consumer: `make consumer TOPIC=slack-general`
