import { generateKeyPairSigner, type TransactionSigner } from '@solana/kit'
import { createDefaultLocalhostRpcClient } from '@solana/kit-plugins'
import type { StartedSolanaTestValidatorContainer } from './solana-test-validator-container.ts'
import type { StartedSurfpoolContainer } from './surfpool-container.ts'

export type LocalSolanaClient = Awaited<ReturnType<typeof createLocalSolanaClient>>
export async function createLocalSolanaClient({
  container,
  payer,
}: {
  container: StartedSolanaTestValidatorContainer | StartedSurfpoolContainer
  payer?: TransactionSigner
}) {
  return createDefaultLocalhostRpcClient({
    payer: payer ?? (await generateKeyPairSigner()),
    rpcSubscriptionsConfig: { url: container.urlWs },
    url: container.url,
  })
}
