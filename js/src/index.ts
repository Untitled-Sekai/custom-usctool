import { susToUSC } from "~/sus/convert"
import { chsToUSC } from "~/chs/convert"
import { mmwsToUSC } from "~/mmws/convert"
import { migrateVUSC, currentVersion } from "~/usc/migrate"
import { USC } from "./usc"
import { TextDecoder } from "text-encoding"

function checkHeader(buffer: Uint8Array, header: number[]): boolean {
  for (let i = 0; i < header.length; i++) {
    if (buffer[i] !== header[i]) {
      return false
    }
  }
  return true
}

export type Format = "sus" | "chs" | "mmws" | "vusc"

export function anyToUSC(buffer: Uint8Array): { format: Format; usc: USC } {
  const header = buffer.slice(0, 6)
  if (
    checkHeader(header, [0x4d, 0x4d, 0x57, 0x53]) || // MMWS
    checkHeader(header, [0x43, 0x43, 0x4d, 0x4d, 0x57, 0x53]) // CCMMWS
  ) {
    return { format: "mmws", usc: mmwsToUSC(buffer) }
  } else if (checkHeader(header, [0x1f, 0x8b])) {
    // GZip, chs
    return { format: "chs", usc: chsToUSC(buffer) }
  } else {
    let decoded: string
    try {
      const decoder = new TextDecoder()
      decoded = decoder.decode(buffer)
    } catch (e) {
      throw new Error(`Unknown file format: ${e}`)
    }
    try {
      const parsed = JSON.parse(decoded)
      if (parsed.version) {
        return { format: "vusc", usc: migrateVUSC(parsed) }
      } else {
        throw new Error("Unknown file format")
      }
    } catch (e) {
      return { format: "sus", usc: susToUSC(decoded) }
    }
  }
}

export { susToUSC, chsToUSC, mmwsToUSC, migrateVUSC, currentVersion }
