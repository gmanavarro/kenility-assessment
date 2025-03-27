#!/bin/bash

echo "Waiting for MinIO container to be ready..."
while ! docker ps | grep -q kenility-minio; do
    echo "MinIO container is not running yet. Waiting 1 second..."
    sleep 1
done

echo "MinIO container is running. Proceeding with setup..."

echo "Creating bucket..."
docker exec kenility-minio mc alias set minio http://localhost:9000 minioadmin minioadmin
docker exec kenility-minio mc mb minio/products --ignore-existing
docker exec kenility-minio mc anonymous set download minio/products

echo "MinIO setup completed!"