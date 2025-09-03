#!/bin/bash

# Test producer for sending messages
TOPIC=${1:-slack-general}

echo "Starting producer for topic: $TOPIC"
echo "Type messages and press Enter. Press Ctrl+C to stop..."

docker exec -it kafka-dev-broker kafka-console-producer \
  --topic $TOPIC \
  --bootstrap-server localhost:9092 \
  --property parse.key=true \
  --property key.separator=:
