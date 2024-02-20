import { Command as ConvertCommand, run as convert } from "./convert"
import { Command as MigrateCommand, run as migrate } from "./migrate"

type Command = ConvertCommand | MigrateCommand
function runCommand(payload: Command) {
  switch (payload.command) {
    case "convert":
      return convert(payload.payload)
    case "migrate":
      return migrate(payload.payload)
    default:
      throw new Error(`Unknown command: ${payload}`)
  }
}

export default function run(commandJson: string): string {
  const command: Command = JSON.parse(commandJson)
  try {
    return JSON.stringify({
      result: "ok",
      data: runCommand(command),
    })
  } catch (e) {
    return JSON.stringify({ result: "error", message: e.toString() })
  }
}
