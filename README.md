# Kenility Assessment

## Prerequisites

- Node.js (v20 or later)
- pnpm
- Docker and Docker Compose

## Running the app

```bash
# Using docker compose
pnpm docker:up
```

## Test

```bash
# E2E tests
pnpm test
```

**Note**: This e2e test suite assumes that mongo is running and listening on localhost:27017.
