#!/bin/bash
# kafka-topics-setup.sh - Updated to include Pumble topics

# Wait for Kafka to be ready
echo "Waiting for Kafka to be ready..."
sleep 30

# Create topics for Slack channels
echo "Creating Kafka topics for Slack..."

# Slack topics
docker exec kafka-dev-broker kafka-topics --create \
  --topic slack-general \
  --bootstrap-server localhost:9092 \
  --replication-factor 1 \
  --partitions 3

docker exec kafka-dev-broker kafka-topics --create \
  --topic slack-alerts \
  --bootstrap-server localhost:9092 \
  --replication-factor 1 \
  --partitions 3

docker exec kafka-dev-broker kafka-topics --create \
  --topic slack-development \
  --bootstrap-server localhost:9092 \
  --replication-factor 1 \
  --partitions 3

docker exec kafka-dev-broker kafka-topics --create \
  --topic slack-support \
  --bootstrap-server localhost:9092 \
  --replication-factor 1 \
  --partitions 3

# Create topics for Pumble channels
echo "Creating Kafka topics for Pumble..."

docker exec kafka-dev-broker kafka-topics --create \
  --topic pumble-general \
  --bootstrap-server localhost:9092 \
  --replication-factor 1 \
  --partitions 3

docker exec kafka-dev-broker kafka-topics --create \
  --topic pumble-alerts \
  --bootstrap-server localhost:9092 \
  --replication-factor 1 \
  --partitions 3

docker exec kafka-dev-broker kafka-topics --create \
  --topic pumble-development \
  --bootstrap-server localhost:9092 \
  --replication-factor 1 \
  --partitions 3

docker exec kafka-dev-broker kafka-topics --create \
  --topic pumble-support \
  --bootstrap-server localhost:9092 \
  --replication-factor 1 \
  --partitions 3

# List created topics
echo "Created topics:"
docker exec kafka-dev-broker kafka-topics --list --bootstrap-server localhost:9092

echo "Kafka setup complete with both Slack and Pumble topics!"
