# @beeman/testcontainers

A collection of [Testcontainers](https://testcontainers.com/) for testing your applications with real services.

## Installation

```bash
bun add @beeman/testcontainers testcontainers
```

## Available Containers

### Solana Test Validator

The `SolanaTestValidatorContainer` provides a real Solana validator running in a Docker container, perfect for integration tests. It uses the `ghcr.io/beeman/solana-test-validator` image by default.

#### Usage

```typescript
import { SolanaTestValidatorContainer } from '@beeman/testcontainers'
import { createDefaultRpcClient } from '@solana/kit'

// Start the container
const container = await new SolanaTestValidatorContainer().start()

// Get the connection URLs
const rpcUrl = container.url
const wsUrl = container.urlWs

// Use with @solana/kit
const client = createDefaultRpcClient({ url: rpcUrl })

// ... run your tests ...

// Stop the container when done
await container.stop()
```

#### Properties

- `container.url`: Returns the RPC URL (e.g., `http://localhost:32768`).
- `container.urlWs`: Returns the WebSocket URL (e.g., `ws://localhost:32769`).
- `container.port`: Returns the mapped RPC port.
- `container.portWs`: Returns the mapped WebSocket port.

## Development

This project is built with [Bun](https://bun.sh/).

### Commands

- **Build**: `bun run build`
- **Test**: `bun test`
- **Lint**: `bun run lint`
- **Type Check**: `bun run check-types`

## License

MIT – see [LICENSE](./LICENSE).
