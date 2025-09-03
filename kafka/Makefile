.PHONY: start stop restart logs ui topics consumer producer clean

# Start Kafka development environment
start:
	@echo "Starting Kafka development environment..."
	@docker compose -f docker-compose.kafka-dev.yml up -d
	@echo "Waiting for services to be ready..."
	@sleep 15
	@bash kafka-topics-setup.sh
	@echo "Kafka development environment is ready!"
	@echo "  - Kafka UI: http://localhost:8080"
	@echo "  - Kafka Broker: localhost:9092"

# Stop Kafka development environment
stop:
	@echo "Stopping Kafka development environment..."
	@docker compose -f docker-compose.kafka-dev.yml down

# Restart Kafka development environment
restart: stop start

# Show logs
logs:
	@docker compose -f docker-compose.kafka-dev.yml logs -f

# Open Kafka UI
ui:
	@echo "Opening Kafka UI..."
	@open http://localhost:8080 || xdg-open http://localhost:8080 || echo "Please open http://localhost:8080"

# Create additional topics
topics:
	@bash kafka-topics-setup.sh

# Start consumer for testing
consumer:
	@bash kafka-consumer-test.sh $(TOPIC)

# Start producer for testing
producer:
	@bash kafka-producer-test.sh $(TOPIC)

# List all topics
list-topics:
	@docker exec kafka-dev-broker kafka-topics --list --bootstrap-server localhost:9092

# Describe topic
describe-topic:
	@docker exec kafka-dev-broker kafka-topics --describe --topic $(TOPIC) --bootstrap-server localhost:9092

# Clean up everything including volumes
clean:
	@echo "Cleaning up Kafka development environment..."
	@docker compose -f docker-compose.kafka-dev.yml down -v
	@docker volume prune -f
	@echo "Cleanup complete!"

# Show help
help:
	@echo "Available commands:"
	@echo "  make start     - Start Kafka development environment"
	@echo "  make stop      - Stop Kafka development environment"
	@echo "  make restart   - Restart Kafka development environment"
	@echo "  make logs      - Show logs"
	@echo "  make ui        - Open Kafka UI in browser"
	@echo "  make topics    - Create default topics"
	@echo "  make consumer TOPIC=topic-name - Start consumer for topic"
	@echo "  make producer TOPIC=topic-name - Start producer for topic"
	@echo "  make list-topics - List all topics"
	@echo "  make describe-topic TOPIC=topic-name - Describe topic"
	@echo "  make clean     - Clean up everything including volumes"
