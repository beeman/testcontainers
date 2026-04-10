# @beeman/testcontainers

A collection of [Testcontainers](https://testcontainers.com/) for testing your applications with real services.

## Installation

Install the package and Testcontainers:

```bash
bun add @beeman/testcontainers testcontainers
```

## Available Containers

### LibSQL Server

The `LibsqlServerContainer` provides a real libSQL server running in a Docker container. It uses the `ghcr.io/beeman/libsql-server-healthcheck` image by default so Testcontainers can wait on the container health check instead of log output.

#### Usage

If you want to use the example client below, also install `@libsql/client`:

```bash
bun add @libsql/client
```

```typescript
import { createClient } from '@libsql/client'
import { LibsqlServerContainer } from '@beeman/testcontainers'

const container = await new LibsqlServerContainer().start()
const client = createClient({ url: container.url })

await client.execute('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL)')
await client.execute({
  sql: 'INSERT INTO users(name) VALUES (?)',
  args: ['beeman'],
})

const result = await client.execute('SELECT id, name FROM users')

console.log(result.rows[0]?.name)

client.close()
await container.stop()
```

#### Properties

- `container.url`: Returns the HTTP URL (e.g., `http://localhost:32768`).
- `container.urlGrpc`: Returns the gRPC URL (e.g., `http://localhost:32769`).
- `container.port`: Returns the mapped HTTP port.
- `container.portGrpc`: Returns the mapped gRPC port.

For advanced libSQL configuration such as authentication, replicas, or persistent storage, use the inherited `GenericContainer` methods from Testcontainers.

### Solana Test Validator

The `SolanaTestValidatorContainer` provides a real Solana validator running in a Docker container, perfect for integration tests. It uses the `ghcr.io/beeman/solana-test-validator` image by default.

#### Usage

If you want to use the `createLocalSolanaClient` helper below, see the optional install in the `createLocalSolanaClient` section.

```typescript
import { SolanaTestValidatorContainer, createLocalSolanaClient } from '@beeman/testcontainers'

// Start the container
const container = await new SolanaTestValidatorContainer().start()

// Create a client with auto-generated payer
const client = await createLocalSolanaClient({ container })

// ... run your tests ...

// Stop the container when done
await container.stop()
```

#### Properties

- `container.url`: Returns the RPC URL (e.g., `http://localhost:32768`).
- `container.urlWs`: Returns the WebSocket URL (e.g., `ws://localhost:32769`).
- `container.port`: Returns the mapped RPC port.
- `container.portWs`: Returns the mapped WebSocket port.

### Surfpool

The `SurfpoolContainer` provides a [Surfpool](https://github.com/txtx/surfpool) Solana simulator running in a Docker container. It runs in offline mode by default for isolated testing. It uses the `surfpool/surfpool:1.0` image by default.

#### Basic Usage

If you want to use the `createLocalSolanaClient` helper below, see the optional install in the `createLocalSolanaClient` section.

```typescript
import { SurfpoolContainer, createLocalSolanaClient } from '@beeman/testcontainers'

// Start the container (offline mode by default)
const container = await new SurfpoolContainer().start()

// Create a client with auto-generated payer
const client = await createLocalSolanaClient({ container })

// Access the Studio URL
const studioUrl = container.urlStudio

// ... run your tests ...

// Stop the container when done
await container.stop()
```

#### Network Selection

Connect to a specific Solana network (disables offline mode):

```typescript
// Connect to devnet
const container = await new SurfpoolContainer()
  .withSolanaNetwork('devnet')
  .start()

// Or use a custom RPC URL
const container = await new SurfpoolContainer()
  .withRpcUrl('https://my-rpc-provider.com')
  .start()
```

#### Airdrop Configuration

Pre-fund accounts with SOL on startup:

```typescript
const container = await new SurfpoolContainer()
  .withAirdrop(
    ['5cQvx...', '5cQvy...'],  // List of pubkeys to fund
    100_000_000_000             // Amount in lamports (100 SOL)
  )
  .start()
```

#### Custom Slot Time

Adjust the slot time for faster or slower block production:

```typescript
// Faster slots (100ms instead of default 400ms)
const container = await new SurfpoolContainer()
  .withSlotTime(100)
  .start()
```

#### Block Production Mode

Control how blocks are produced:

```typescript
// Transaction-based block production (new block per transaction)
const container = await new SurfpoolContainer()
  .withBlockProductionMode('transaction')
  .start()
```

#### Disable Features

```typescript
const container = await new SurfpoolContainer()
  .withNoStudio()   // Disable the Studio UI
  .withNoDeploy()   // Disable auto deployments
  .start()
```

#### Full Configuration Example

```typescript
// Connect to devnet with custom configuration
const container = await new SurfpoolContainer()
  .withSolanaNetwork('devnet')
  .withAirdrop(['5cQvx...'], 500_000_000_000)
  .withSlotTime(200)
  .withBlockProductionMode('transaction')
  .withLogLevel('debug')
  .start()
```

#### Properties

- `container.url`: Returns the RPC URL (e.g., `http://localhost:32768`).
- `container.urlWs`: Returns the WebSocket URL (e.g., `ws://localhost:32769`).
- `container.urlStudio`: Returns the Studio URL (e.g., `http://localhost:32770`).
- `container.port`: Returns the mapped RPC port.
- `container.portWs`: Returns the mapped WebSocket port.
- `container.portStudio`: Returns the mapped Studio port.

#### Configuration Methods

| Method | Description |
|--------|-------------|
| `withSolanaNetwork(network)` | Connect to `'mainnet'`, `'devnet'`, or `'testnet'` (disables offline mode) |
| `withRpcUrl(url)` | Use a custom RPC URL (disables offline mode) |
| `withOffline(false)` | Disable offline mode (enabled by default) |
| `withAirdrop(addresses, amount?)` | Pre-fund accounts (default: 10,000 SOL) |
| `withAirdropKeypairPaths(paths)` | Fund accounts from keypair files |
| `withSlotTime(ms)` | Set slot duration (default: 400ms) |
| `withBlockProductionMode(mode)` | `'clock'` or `'transaction'` (default: clock) |
| `withNoStudio()` | Disable Studio UI |
| `withNoDeploy()` | Disable auto deployments |
| `withLogLevel(level)` | Set log level: `'trace'`, `'debug'`, `'info'`, `'warn'`, `'error'`, `'none'` |
| `withPort(port)` | Set RPC port (default: 8899) |
| `withWsPort(port)` | Set WebSocket port (default: 8900) |
| `withStudioPort(port)` | Set Studio port (default: 18488) |

## Utilities

### `createLocalSolanaClient`

A convenience helper that creates a Solana RPC client configured for a local container. It wraps `createDefaultLocalhostRpcClient` from `@solana/kit-plugins` and works with both `SolanaTestValidatorContainer` and `SurfpoolContainer`.

To use this helper, install `@solana/kit` and `@solana/kit-plugins`:

```bash
bun add @solana/kit @solana/kit-plugins
```

```typescript
import { SurfpoolContainer, createLocalSolanaClient } from '@beeman/testcontainers'

const container = await new SurfpoolContainer().start()

// Create a client with an auto-generated payer
const client = await createLocalSolanaClient({ container })

// Or provide your own payer
import { generateKeyPairSigner } from '@solana/kit'

const payer = await generateKeyPairSigner()
const client = await createLocalSolanaClient({ container, payer })
```

The returned `LocalSolanaClient` provides access to `rpc`, `rpcSubscriptions`, and the `payer` signer.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `container` | `StartedSolanaTestValidatorContainer \| StartedSurfpoolContainer` | A started container instance |
| `payer` | `TransactionSigner` (optional) | A payer signer; auto-generated if not provided |

## Development

This project is built with [Bun](https://bun.sh/).

### Commands

- **Build**: `bun run build`
- **Test**: `bun test`
- **Lint**: `bun run lint`
- **Type Check**: `bun run check-types`

## License

MIT – see [LICENSE](./LICENSE).
