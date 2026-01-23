import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { generateKeyPairSigner, lamports } from '@solana/kit'
import { createDefaultRpcClient } from '@solana/kit-plugins'
import {
  SolanaTestValidatorContainer,
  type StartedSolanaTestValidatorContainer,
} from '../src/solana-test-validator-container.ts'

describe('SolanaTestValidatorContainer', () => {
  let container: StartedSolanaTestValidatorContainer

  let client: ReturnType<typeof createDefaultRpcClient>

  beforeAll(async () => {
    container = await new SolanaTestValidatorContainer().start()
    client = createDefaultRpcClient({
      payer: await generateKeyPairSigner(),
      rpcSubscriptionsConfig: { url: container.urlWs },
      url: container.url,
    })
  }, 120_000)

  afterAll(async () => {
    await container.stop()
  })

  it('should return the RPC URL', () => {
    const url = container.url
    expect(url).toMatch(/^http:\/\/localhost:\d+$/)
    expect(url).toInclude(container.port.toString())
  })

  it('should return the websocket URL', () => {
    const urlWs = container.urlWs
    expect(urlWs).toMatch(/^ws:\/\/localhost:\d+$/)
    expect(urlWs).toInclude(container.portWs.toString())
  })

  it('should respond to getHealth RPC call', async () => {
    const result = await client.rpc.getHealth().send()

    expect(result).toBe('ok')
  })

  it('should respond to getVersion RPC call', async () => {
    const result = await client.rpc.getVersion().send()

    expect(result).toHaveProperty('solana-core')
    expect(result).toHaveProperty('feature-set')
  })

  it('should respond to getSlot RPC call', async () => {
    const result = await client.rpc.getSlot().send()

    expect(typeof result).toBe('bigint')
    expect(result).toBeGreaterThanOrEqual(0)
  })

  it('should get balance from the fee payer', async () => {
    const result = await client.rpc.getBalance(client.payer.address).send()

    expect(result.value).toEqual(lamports(0n))
  })
})
