import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { type Client, createClient } from '@libsql/client'
import { LibsqlServerContainer, type StartedLibsqlServerContainer } from '../src/libsql-server-container.ts'

describe('LibsqlServerContainer', () => {
  let client!: Client
  let container!: StartedLibsqlServerContainer

  beforeAll(async () => {
    container = await new LibsqlServerContainer().start()
    client = createClient({ url: container.url })
  }, 120_000)

  afterAll(async () => {
    if (client) {
      client.close()
    }
    if (container) {
      await container.stop()
    }
  })

  it('should return the HTTP URL', () => {
    const url = container.url
    const parsed = new URL(url)

    expect(parsed.hostname).toBe(container.getHost())
    expect(parsed.port).toBe(container.port.toString())
    expect(parsed.protocol).toBe('http:')
  })

  it('should return the gRPC URL', () => {
    const urlGrpc = container.urlGrpc
    const parsed = new URL(urlGrpc)

    expect(parsed.hostname).toBe(container.getHost())
    expect(parsed.port).toBe(container.portGrpc.toString())
    expect(parsed.protocol).toBe('http:')
  })

  it('should execute queries with @libsql/client', async () => {
    await client.execute('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL)')

    const insertResult = await client.execute({
      args: ['beeman'],
      sql: 'INSERT INTO users(name) VALUES (?)',
    })

    const selectResult = await client.execute('SELECT id, name FROM users')

    expect(insertResult.lastInsertRowid).toBe(1n)
    expect(insertResult.rowsAffected).toBe(1)
    expect(selectResult.rows).toHaveLength(1)
    expect(selectResult.rows[0]?.id).toBe(1)
    expect(selectResult.rows[0]?.name).toBe('beeman')
  })
})
