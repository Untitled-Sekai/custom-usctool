import { Format, anyToUSC, chsToUSC, mmwsToUSC, susToUSC } from ".."
import { toByteArray } from "base64-js"

type Payload = {
  format: Format | "auto"
  data: string
}
export type Command = {
  command: "convert"
  payload: Payload
}

export function run(payload: Payload) {
  const { format, data: dataRaw } = payload
  const data = toByteArray(dataRaw)
  switch (format) {
    case "auto":
      return anyToUSC(data)
    case "sus":
      return {
        format: "sus",
        data: susToUSC(data),
      }
    case "chs":
      return {
        format: "chs",
        data: chsToUSC(data),
      }
    case "mmws":
      return {
        format: "mmws",
        data: mmwsToUSC(data),
      }
    default:
      throw new Error(`Unknown format: ${format}`)
  }
}
