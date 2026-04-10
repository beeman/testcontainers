import { defineConfig } from 'tsdown'

export default defineConfig({
  clean: true,
  deps: {
    neverBundle: [/^@solana\//, 'testcontainers'],
  },
  dts: true,
  entry: ['src/index.ts'],
  fixedExtension: false,
  format: ['esm', 'cjs'],
  sourcemap: true,
})
