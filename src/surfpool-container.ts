import type { StartedTestContainer } from 'testcontainers'
import { AbstractStartedContainer, GenericContainer, Wait } from 'testcontainers'

const DEFAULT_BLOCK_PRODUCTION_MODE = 'clock'
const DEFAULT_IMAGE = 'surfpool/surfpool:latest'
const DEFAULT_LOG_LEVEL = 'info'
const DEFAULT_NETWORK_HOST = '0.0.0.0'
const DEFAULT_PORT_RPC = 8899
const DEFAULT_PORT_STUDIO = 18488
const DEFAULT_PORT_WS = 8900
const DEFAULT_SLOT_TIME = 400

export type SurfpoolBlockProductionMode = 'clock' | 'transaction'
export type SurfpoolLogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'none'
export type SurfpoolNetwork = 'mainnet' | 'devnet' | 'testnet'

export interface SurfpoolContainerOptions {
  /** List of pubkeys to airdrop */
  airdropAddresses?: string[]
  /** Quantity of tokens to airdrop. Default: 10000000000000 */
  airdropAmount?: number
  /** List of keypair paths to airdrop */
  airdropKeypairPaths?: string[]
  /** Block production mode. Default: 'clock' */
  blockProductionMode?: SurfpoolBlockProductionMode
  /** Log level. Default: 'info' */
  logLevel?: SurfpoolLogLevel
  /** Predefined network (mainnet, devnet, testnet). Cannot be used with rpcUrl. */
  network?: SurfpoolNetwork
  /** Disable auto deployments. Default: false */
  noDeploy?: boolean
  /** Disable Studio. Default: false */
  noStudio?: boolean
  /** Start without a remote RPC client (offline mode). Default: true */
  offline?: boolean
  /** RPC port. Default: 8899 */
  port?: number
  /** Custom RPC URL. Cannot be used with network. */
  rpcUrl?: string
  /** Slot time in ms. Default: 400 */
  slotTime?: number
  /** Studio port. Default: 18488 */
  studioPort?: number
  /** WebSocket port. Default: 8900 */
  wsPort?: number
}

export class SurfpoolContainer extends GenericContainer {
  private options: SurfpoolContainerOptions = {}

  constructor(image = DEFAULT_IMAGE) {
    super(image)
    this.withEnvironment({ SURFPOOL_NETWORK_HOST: DEFAULT_NETWORK_HOST }).withStartupTimeout(120_000)
  }

  withSolanaNetwork(network: SurfpoolNetwork): this {
    this.options.network = network
    return this
  }

  withRpcUrl(rpcUrl: string): this {
    this.options.rpcUrl = rpcUrl
    return this
  }

  withOffline(offline = true): this {
    this.options.offline = offline
    return this
  }

  withAirdrop(addresses: string[], amount?: number): this {
    this.options.airdropAddresses = addresses
    if (amount !== undefined) {
      this.options.airdropAmount = amount
    }
    return this
  }

  withAirdropKeypairPaths(paths: string[]): this {
    this.options.airdropKeypairPaths = paths
    return this
  }

  withPort(port: number): this {
    this.options.port = port
    return this
  }

  withWsPort(wsPort: number): this {
    this.options.wsPort = wsPort
    return this
  }

  withStudioPort(studioPort: number): this {
    this.options.studioPort = studioPort
    return this
  }

  withSlotTime(slotTime: number): this {
    this.options.slotTime = slotTime
    return this
  }

  withBlockProductionMode(mode: SurfpoolBlockProductionMode): this {
    this.options.blockProductionMode = mode
    return this
  }

  withNoStudio(noStudio = true): this {
    this.options.noStudio = noStudio
    return this
  }

  withNoDeploy(noDeploy = true): this {
    this.options.noDeploy = noDeploy
    return this
  }

  withLogLevel(logLevel: SurfpoolLogLevel): this {
    this.options.logLevel = logLevel
    return this
  }

  private buildCommand(): string[] {
    const cmd: string[] = ['start', '--no-tui', '--host', '0.0.0.0']

    const port = this.options.port ?? DEFAULT_PORT_RPC
    const wsPort = this.options.wsPort ?? DEFAULT_PORT_WS
    const studioPort = this.options.studioPort ?? DEFAULT_PORT_STUDIO

    cmd.push('--port', String(port))
    cmd.push('--ws-port', String(wsPort))
    cmd.push('--studio-port', String(studioPort))

    if (this.options.network) {
      cmd.push('--network', this.options.network)
    } else if (this.options.rpcUrl) {
      cmd.push('--rpc-url', this.options.rpcUrl)
    } else if (this.options.offline !== false) {
      // Default to offline mode unless explicitly disabled or network/rpcUrl is set
      cmd.push('--offline')
    }

    if (this.options.airdropAddresses?.length) {
      for (const address of this.options.airdropAddresses) {
        cmd.push('--airdrop', address)
      }
    }

    if (this.options.airdropAmount !== undefined) {
      cmd.push('--airdrop-amount', String(this.options.airdropAmount))
    }

    if (this.options.airdropKeypairPaths?.length) {
      for (const path of this.options.airdropKeypairPaths) {
        cmd.push('--airdrop-keypair-path', path)
      }
    }

    if (this.options.slotTime !== undefined && this.options.slotTime !== DEFAULT_SLOT_TIME) {
      cmd.push('--slot-time', String(this.options.slotTime))
    }

    if (this.options.blockProductionMode && this.options.blockProductionMode !== DEFAULT_BLOCK_PRODUCTION_MODE) {
      cmd.push('--block-production-mode', this.options.blockProductionMode)
    }

    if (this.options.noStudio) {
      cmd.push('--no-studio')
    }

    if (this.options.noDeploy) {
      cmd.push('--no-deploy')
    }

    if (this.options.logLevel && this.options.logLevel !== DEFAULT_LOG_LEVEL) {
      cmd.push('--log-level', this.options.logLevel)
    }

    return cmd
  }

  override async start(): Promise<StartedSurfpoolContainer> {
    const port = this.options.port ?? DEFAULT_PORT_RPC
    const wsPort = this.options.wsPort ?? DEFAULT_PORT_WS
    const studioPort = this.options.studioPort ?? DEFAULT_PORT_STUDIO

    this.withExposedPorts(port, wsPort, studioPort)
      .withCommand(this.buildCommand())
      // Surfpool RPC only allows POST/OPTIONS; 405 from GET means the RPC port is reachable.
      .withWaitStrategy(Wait.forHttp('/', port).forStatusCode(405))

    return new StartedSurfpoolContainer(await super.start(), {
      port,
      studioPort,
      wsPort,
    })
  }
}

interface StartedSurfpoolContainerPorts {
  port: number
  wsPort: number
  studioPort: number
}

export class StartedSurfpoolContainer extends AbstractStartedContainer {
  private readonly ports: StartedSurfpoolContainerPorts

  constructor(startedContainer: StartedTestContainer, ports: StartedSurfpoolContainerPorts) {
    super(startedContainer)
    this.ports = ports
  }

  get port(): number {
    return this.getMappedPort(this.ports.port)
  }

  get portWs(): number {
    return this.getMappedPort(this.ports.wsPort)
  }

  get portStudio(): number {
    return this.getMappedPort(this.ports.studioPort)
  }

  get url(): string {
    return `http://${this.getHost()}:${this.port}`
  }

  get urlWs(): string {
    return `ws://${this.getHost()}:${this.portWs}`
  }

  get urlStudio(): string {
    return `http://${this.getHost()}:${this.portStudio}`
  }
}
