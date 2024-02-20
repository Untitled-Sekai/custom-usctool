import { readFile } from "fs/promises"
import * as usctool from ".."

it("converts sus to usc", async () => {
  const sus = await readFile("./src/__tests__/assets/test.sus", "utf-8")
  usctool.susToUSC(sus)
})

it("converts mmws to usc", async () => {
  const mmws = await readFile("./src/__tests__/assets/test.mmws")
  usctool.mmwsToUSC(mmws)
})

it("converts ccmmws to usc", async () => {
  const mmws = await readFile("./src/__tests__/assets/test.ccmmws")
  usctool.mmwsToUSC(mmws)
})

it("converts ched2 chs to usc", async () => {
  const chs = await readFile("./src/__tests__/assets/ched2.chs")
  usctool.chsToUSC(chs)
})

it("converts ched3 chs to usc", async () => {
  const chs = await readFile("./src/__tests__/assets/ched3.chs")
  usctool.chsToUSC(chs)
})

for (const [file, format] of [
  ["./src/__tests__/assets/test.sus", "sus"],
  ["./src/__tests__/assets/test.mmws", "mmws"],
  ["./src/__tests__/assets/test.ccmmws", "ccmmws"],
  ["./src/__tests__/assets/ched2.chs", "chs2"],
  ["./src/__tests__/assets/ched3.chs", "chs3"],
] as const) {
  it(`converts ${format} to usc`, async () => {
    const data = await readFile(file)
    usctool.anyToUSC(data)
  })
}
