import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import type { KeyPairSigner, TransactionSigner } from '@solana/kit'
import { generateKeyPairSigner, lamports } from '@solana/kit'
import { createDefaultRpcClient } from '@solana/kit-plugins'
import { type StartedSurfpoolContainer, SurfpoolContainer } from '../src/surfpool-container.ts'

function createSolanaClient(container: StartedSurfpoolContainer, payer: TransactionSigner) {
  return createDefaultRpcClient({
    payer,
    rpcSubscriptionsConfig: { url: container.urlWs },
    url: container.url,
  })
}

describe('SurfpoolContainer', () => {
  describe('default configuration', () => {
    let container: StartedSurfpoolContainer
    let client: ReturnType<typeof createSolanaClient>

    beforeAll(async () => {
      const payer = await generateKeyPairSigner()
      container = await new SurfpoolContainer().start()
      client = createSolanaClient(container, payer)
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

    it('should return the studio URL', () => {
      const urlStudio = container.urlStudio
      expect(urlStudio).toMatch(/^http:\/\/localhost:\d+$/)
      expect(urlStudio).toInclude(container.portStudio.toString())
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

  describe('with airdrop', () => {
    let container: StartedSurfpoolContainer
    let client: ReturnType<typeof createSolanaClient>
    let airdropKeypair: KeyPairSigner
    const airdropAmount = 500_000_000_000 // 500 SOL

    beforeAll(async () => {
      const payer = await generateKeyPairSigner()
      airdropKeypair = await generateKeyPairSigner()
      container = await new SurfpoolContainer().withAirdrop([airdropKeypair.address], airdropAmount).start()
      client = createSolanaClient(container, payer)
    }, 120_000)

    afterAll(async () => {
      await container.stop()
    })

    it('should respond to getHealth RPC call with airdrop config', async () => {
      const result = await client.rpc.getHealth().send()

      expect(result).toBe('ok')
    })

    it('should have airdropped tokens to the specified address', async () => {
      const result = await client.rpc.getBalance(airdropKeypair.address).send()

      expect(result.value).toEqual(lamports(BigInt(airdropAmount)))
    })
  })

  describe('with custom slot time', () => {
    let container: StartedSurfpoolContainer
    let client: ReturnType<typeof createSolanaClient>

    beforeAll(async () => {
      const payer = await generateKeyPairSigner()
      container = await new SurfpoolContainer().withSlotTime(100).start()
      client = createSolanaClient(container, payer)
    }, 120_000)

    afterAll(async () => {
      await container.stop()
    })

    it('should respond to getHealth RPC call with custom slot time', async () => {
      const result = await client.rpc.getHealth().send()

      expect(result).toBe('ok')
    })

    it('should advance slots faster with lower slot time', async () => {
      const slot1 = await client.rpc.getSlot().send()
      await new Promise((resolve) => setTimeout(resolve, 500))
      const slot2 = await client.rpc.getSlot().send()

      expect(slot2).toBeGreaterThan(slot1)
    })
  })
})
