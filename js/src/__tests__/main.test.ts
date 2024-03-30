import { readFile } from "fs/promises"
import { expect, it } from "vitest"
import * as usctool from ".."
import { describe } from "node:test"

describe("Snapshot tests", () => {
  it("converts sus to usc", async () => {
    const sus = await readFile("./src/__tests__/assets/test.sus", "utf-8")
    const usc = usctool.susToUSC(sus)
    expect(usc).toMatchSnapshot()
  })

  it("converts mmws to usc", async () => {
    const mmws = await readFile("./src/__tests__/assets/test.mmws")
    const usc = usctool.mmwsToUSC(mmws)
    expect(usc).toMatchSnapshot()
  })

  it("converts ccmmws to usc", async () => {
    const mmws = await readFile("./src/__tests__/assets/test.ccmmws")
    const usc = usctool.mmwsToUSC(mmws)
    expect(usc).toMatchSnapshot()
  })

  it("converts layered ccmmws to usc", async () => {
    const mmws = await readFile("./src/__tests__/assets/layered.ccmmws")
    const usc = usctool.mmwsToUSC(mmws)
    expect(usc).toMatchSnapshot()
  })

  it("converts ched2 chs to usc", async () => {
    const chs = await readFile("./src/__tests__/assets/ched2.chs")
    const usc = usctool.chsToUSC(chs)
    expect(usc).toMatchSnapshot()
  })

  it("converts ched3 chs to usc", async () => {
    const chs = await readFile("./src/__tests__/assets/ched3.chs")
    const usc = usctool.chsToUSC(chs)
    expect(usc).toMatchSnapshot()
  })
})

describe("anyToUSC", () => {
  for (const [file, name, format] of [
    ["./src/__tests__/assets/test.sus", "sus", "sus"],
    ["./src/__tests__/assets/test.mmws", "mmws", "mmws"],
    ["./src/__tests__/assets/test.ccmmws", "ccmmws", "ccmmws"],
    ["./src/__tests__/assets/ched2.chs", "chs2", "chs"],
    ["./src/__tests__/assets/ched3.chs", "chs3", "chs"],
  ] as const) {
    it(`converts ${name} to usc`, async () => {
      const data = await readFile(file)
      const { format: detected } = usctool.anyToUSC(data)
      expect(detected).toBe(format)
    })
  }
})
