import { susToUSC } from "./sus/convert.js"
import { chsToUSC } from "./chs/convert.js"
import { mmwsToUSC } from "./mmws/convert.js"
import { migrateVUSC, currentVersion } from "./usc/migrate/index.js"
import { USC } from "./usc/index.js"
import { TextDecoder } from "fastestsmallesttextencoderdecoder"

function checkHeader(buffer: Uint8Array, header: number[]): boolean {
  for (let i = 0; i < header.length; i++) {
    if (buffer[i] !== header[i]) {
      return false
    }
  }
  return true
}

/**
 * An error for when the file format is unknown
 */
export class UnknownFormatError extends Error {
  constructor() {
    super("Unknown file format")
  }
}

/**
 * The format of the buffer
 */
export type Format = "sus" | "chs" | "mmws" | "ccmmws" | "vusc"

/**
 * Detects the format of the given buffer and converts it to USC.
 * @param buffer The buffer to convert
 * @returns The format and the converted USC
 * @throws {UnknownFormatError} When the file format is unknown
 */
export function anyToUSC(buffer: Uint8Array): { format: Format; usc: USC } {
  const header = buffer.slice(0, 6)
  if (
    checkHeader(header, [0x4d, 0x4d, 0x57, 0x53]) // MMWS
  ) {
    return { format: "mmws", usc: mmwsToUSC(buffer) }
  } else if (
    checkHeader(header, [0x43, 0x43, 0x4d, 0x4d, 0x57, 0x53]) // CCMMWS
  ) {
    return { format: "ccmmws", usc: mmwsToUSC(buffer) }
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
        throw new UnknownFormatError()
      }
    } catch (e) {
      return { format: "sus", usc: susToUSC(decoded) }
    }
  }
}

export { susToUSC, chsToUSC, mmwsToUSC, migrateVUSC, currentVersion }
export * from "./usc/index.js"
