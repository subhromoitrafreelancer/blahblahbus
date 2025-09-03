#!/bin/bash

# Test consumer for viewing messages
TOPIC=${1:-slack-general}

echo "Starting consumer for topic: $TOPIC"
echo "Press Ctrl+C to stop..."

docker exec -it kafka-dev-broker kafka-console-consumer \
  --topic $TOPIC \
  --bootstrap-server localhost:9092 \
  --from-beginning \
  --formatter kafka.tools.DefaultMessageFormatter \
  --property print.timestamp=true \
  --property print.key=true \
  --property print.value=true
