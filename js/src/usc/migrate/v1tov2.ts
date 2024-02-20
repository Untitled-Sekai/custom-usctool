import {
  USC as USC1,
  USCConnectionStartNote,
  USCSlideNote,
} from "~/usc/types/v1"
import { USC as USC2 } from "~/usc/types/v2"

export function forward(data: USC1): USC2 {
  const objects: USC2["objects"] = []
  for (const object of data.objects) {
    if (object.type !== "slide") {
      objects.push(object)
      continue
    }
    switch (object.subType) {
      case "normal":
        objects.push({
          type: "slide",
          connections: object.connections,
          critical: object.critical,
        })
        break
      case "fadeDummy":
      case "dummy":
        objects.push({
          type: "guide",
          color: object.critical ? "yellow" : "green",
          fade: object.subType === "fadeDummy" ? "out" : "none",
          midpoints: object.connections.flatMap((c) => {
            if (c.type !== "tick") {
              return []
            }

            return [
              {
                lane: c.lane,
                beat: c.beat,
                size: c.size,
                timeScaleGroup: c.timeScaleGroup,
                ease: c.ease,
              },
            ]
          }),
        })
        break

      default:
        throw new Error("Unknown subType")
    }
  }
  return {
    offset: data.offset,
    objects,
  }
}

export function backward(data: USC2): USC1 {
  const objects: USC1["objects"] = []
  for (const object of data.objects) {
    switch (object.type) {
      case "slide": {
        objects.push({
          type: "slide",
          subType: "normal",
          connections: object.connections,
          critical: object.critical,
        })
        break
      }
      case "guide": {
        const critical = object.color === "yellow"
        const connections = [] as unknown as USCSlideNote["connections"]
        let i = -1
        for (const midpoint of object.midpoints) {
          i++
          connections.push({
            type:
              i === 0
                ? "start"
                : i === object.midpoints.length - 1
                  ? "end"
                  : "tick",
            lane: midpoint.lane,
            beat: midpoint.beat,
            size: midpoint.size,
            timeScaleGroup: midpoint.timeScaleGroup,
            ease: midpoint.ease,
            critical,
            judgeType: "none",
          })
        }

        objects.push({
          type: "slide",
          subType: object.fade === "none" ? "dummy" : "fadeDummy",
          connections,
          critical,
        })
        break
      }
      default:
        objects.push(object)
        break
    }
  }
  return {
    offset: data.offset,
    objects,
  }
}
