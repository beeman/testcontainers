import { AbstractStartedContainer, GenericContainer, Wait } from 'testcontainers'

const DEFAULT_IMAGE = 'ghcr.io/beeman/libsql-server-healthcheck:latest'
const LIBSQL_PORT_GRPC = 5001
const LIBSQL_PORT_HTTP = 8080

export class LibsqlServerContainer extends GenericContainer {
  constructor(image = DEFAULT_IMAGE) {
    super(image)
    this.withExposedPorts(LIBSQL_PORT_HTTP, LIBSQL_PORT_GRPC)
      .withStartupTimeout(120_000)
      .withWaitStrategy(Wait.forHealthCheck())
  }

  override async start(): Promise<StartedLibsqlServerContainer> {
    return new StartedLibsqlServerContainer(await super.start())
  }
}

export class StartedLibsqlServerContainer extends AbstractStartedContainer {
  get port(): number {
    return this.getMappedPort(LIBSQL_PORT_HTTP)
  }

  get portGrpc(): number {
    return this.getMappedPort(LIBSQL_PORT_GRPC)
  }

  get url(): string {
    return `http://${this.getHost()}:${this.port}`
  }

  get urlGrpc(): string {
    return `http://${this.getHost()}:${this.portGrpc}`
  }
}
