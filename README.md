# Kenility Assessment

## Prerequisites

- Node v22.11.0
- pnpm
- Docker and Docker Compose

## Running the app

```bash
# Start containers
pnpm docker:up

# Create MinIO public bucket for image storage
pnpm docker:setup
```

## Test

```bash
# E2E tests
pnpm test
```

**Note**: This e2e test suite needs Mongo and MinIO containers up and running to execute properly.
