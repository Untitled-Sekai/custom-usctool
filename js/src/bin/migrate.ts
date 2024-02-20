import { migrateVUSC } from ".."

type Payload = {
  data: migrateVUSC
  to: number
}
export type Command = {
  command: "migrate"
  payload: Payload
}

export function run(payload: Payload) {
  return migrateVUSC(payload.data, {
    to: payload.to,
  })
}
