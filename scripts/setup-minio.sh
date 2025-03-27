#!/bin/bash

# Esperar a que MinIO esté listo
until mc alias set myminio http://localhost:9000 minioadmin minioadmin; do
  echo "Esperando a que MinIO esté disponible..."
  sleep 1
done

# Crear el bucket de pruebas si no existe
mc mb myminio/products-test --ignore-existing

# Configurar políticas de acceso público para el bucket de pruebas
mc anonymous set public myminio/products-test

echo "MinIO configurado exitosamente" 