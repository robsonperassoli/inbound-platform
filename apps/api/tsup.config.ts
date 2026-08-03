import { defineConfig } from "tsup"

export default defineConfig({
  entry: {
    index: "src/index.ts",
    migrate: "src/scripts/migrate.ts",
  },
  format: ["esm"],
  platform: "node",
  target: "node24",
  outDir: "dist",
  clean: true,
  sourcemap: true,
  splitting: false,
  dts: false,
  // Workspace TS packages must be compiled into the bundle.
  noExternal: ["@inbound/shared"],
  // Native addon — must load from node_modules at runtime
  external: ["better-sqlite3"],
})
