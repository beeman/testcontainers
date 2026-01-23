import { AbstractStartedContainer, GenericContainer, Wait } from 'testcontainers'

const SOLANA_PORT_RPC = 8899
const SOLANA_PORT_WS = 8900
const DEFAULT_IMAGE = 'ghcr.io/beeman/solana-test-validator:latest'

export class SolanaTestValidatorContainer extends GenericContainer {
  constructor(image = DEFAULT_IMAGE) {
    super(image)
    this.withExposedPorts(SOLANA_PORT_RPC, SOLANA_PORT_WS)
      .withStartupTimeout(120_000)
      .withWaitStrategy(Wait.forLogMessage(/Processed Slot: \d+/))
      .withPrivilegedMode()
  }

  override async start(): Promise<StartedSolanaTestValidatorContainer> {
    return new StartedSolanaTestValidatorContainer(await super.start())
  }
}

export class StartedSolanaTestValidatorContainer extends AbstractStartedContainer {
  get port(): number {
    return this.getMappedPort(SOLANA_PORT_RPC)
  }

  get portWs(): number {
    return this.getMappedPort(SOLANA_PORT_WS)
  }

  get url(): string {
    return `http://${this.getHost()}:${this.port}`
  }

  get urlWs(): string {
    return `ws://${this.getHost()}:${this.portWs}`
  }
}
