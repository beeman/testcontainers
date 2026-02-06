import { defineConfig } from 'tsup'

export default defineConfig({
  clean: true,
  dts: true,
  entry: ['src/index.ts'],
  external: ['@solana/kit', '@solana/kit-plugins', 'testcontainers'],
  format: ['esm', 'cjs'],
  sourcemap: true,
  splitting: false,
})
