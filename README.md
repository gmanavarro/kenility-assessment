# Kenility Assessment

This is a RESTful API built with NestJS that provides user authentication using JWT, simple product and order management and a couple of endpoints to see relevant stats/metrics. Also using MinIO in a container as file storage to replace a paid provider like AWS S3.

## Prerequisites

- Node v22.11.0
- pnpm
- Docker and Docker Compose

## Running the app

```bash
# Start containers
pnpm docker:up

# Create MinIO public bucket for image storage
# and seed database with test data
pnpm run setup
```

## Test

### User credentials

- Username: `testuser`
- Password: `Test1234`

### Docs

OpenAPI docs are available via Swagger at http://localhost:3000/docs

### Automated Tests

```bash
# E2E tests
pnpm test
```

**Note**: This e2e test suite needs Mongo and MinIO containers up and running to execute properly.
