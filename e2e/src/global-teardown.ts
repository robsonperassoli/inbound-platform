import fs from "node:fs"
import { sqlitePath, storageStatePath } from "./servers"

export default function globalTeardown() {
  for (const suffix of ["", "-wal", "-shm"]) {
    fs.rmSync(`${sqlitePath}${suffix}`, { force: true })
  }
  fs.rmSync(storageStatePath, { force: true })
}
