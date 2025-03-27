#!/bin/bash

# Check if MinIO container is running
if ! docker ps | grep -q kenility-minio; then
    echo "MinIO container is not running. Check readme for instructions."
    exit 1
fi

echo "Creating bucket..."
docker exec kenility-minio mc alias set minio http://localhost:9000 minioadmin minioadmin
docker exec kenility-minio mc mb minio/products --ignore-existing
docker exec kenility-minio mc anonymous set download minio/products

echo "MinIO setup completed!"