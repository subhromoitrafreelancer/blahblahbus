#!/bin/bash

# Wait for Kafka to be ready
echo "Waiting for Kafka to be ready..."
sleep 30

# Create topics for Slack channels
echo "Creating Kafka topics..."

# General topic
docker exec kafka-dev-broker kafka-topics --create \
  --topic slack-general \
  --bootstrap-server localhost:9092 \
  --replication-factor 1 \
  --partitions 3

# Alerts topic
docker exec kafka-dev-broker kafka-topics --create \
  --topic slack-alerts \
  --bootstrap-server localhost:9092 \
  --replication-factor 1 \
  --partitions 3

# Development topic
docker exec kafka-dev-broker kafka-topics --create \
  --topic slack-development \
  --bootstrap-server localhost:9092 \
  --replication-factor 1 \
  --partitions 3

# Support topic
docker exec kafka-dev-broker kafka-topics --create \
  --topic slack-support \
  --bootstrap-server localhost:9092 \
  --replication-factor 1 \
  --partitions 3

# List created topics
echo "Created topics:"
docker exec kafka-dev-broker kafka-topics --list --bootstrap-server localhost:9092

echo "Kafka setup complete!"
