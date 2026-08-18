import { sqlite } from "../db/client"
import { applyMigrations } from "../db/migrate"

applyMigrations()
sqlite.close()
