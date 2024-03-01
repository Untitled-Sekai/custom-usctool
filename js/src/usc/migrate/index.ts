import { USC as USC1 } from "../types/v1"
import { USC as USC2 } from "../types/v2"
import * as v1tov2 from "./v1tov2"

/**
 * The USC with versioning information
 */
export type VersionedUSC =
  | {
      version: 1
      usc: USC1
    }
  | {
      version: 2
      usc: USC2
    }
type USC = USC2

/** The current version of the USC */
export const currentVersion = 2
/**
 * Migrate the USC to the specified version
 * @param data The USC with versioning information
 * @param to The version to migrate to
 * @returns The USC with the specified version
 * @throws If the version is unknown
 */
export function migrateVUSC(
  data: VersionedUSC,
  {
    to = 2,
  }: {
    to?: 2
  } = {}
): USC {
  let ret: VersionedUSC = JSON.parse(JSON.stringify(data.usc))
  while (ret.version < to) {
    switch (ret.version) {
      case 1:
        ret = {
          version: 2,
          usc: v1tov2.forward(ret.usc),
        }
        break
      default:
        throw new Error("Unknown version")
    }
  }
  while (ret.version > to) {
    switch (ret.version) {
      case 2:
        ret = {
          version: 1,
          usc: v1tov2.backward(ret.usc),
        }
        break
      default:
        throw new Error("Unknown version")
    }
  }
  return ret.usc
}
