# Kenility Assessment

## Prerequisites

- Node.js (v20 or later)
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

**Note**: This e2e test suite assumes that mongo is running and listening on localhost:27017.
