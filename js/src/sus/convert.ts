import {
  USC,
  USCConnectionAttachNote,
  USCConnectionEndNote,
  USCConnectionStartNote,
  USCConnectionTickNote,
  USCGuideNote,
  USCObject,
  USCSlideNote,
} from "../usc"
import { NoteObject, Score, analyze } from "./analyze"

/** Convert a SUS to a USC */
export const susToUSC = (sus: string): USC => chsLikeToUSC(analyze(sus))

export const chsLikeToUSC = (score: Score): USC => {
  const flickMods = new Map<string, "left" | "up" | "right">()
  const criticalMods = new Set<string>()
  const tickRemoveMods = new Set<string>()
  const judgeRemoveMods = new Set<string>()
  const easeMods = new Map<string, "in" | "out">()

  const preventSingles = new Set<string>()
  const dedupeSingles = new Set<string>()
  const dedupeSlides = new Map<string, USCSlideNote | USCGuideNote>()

  const requests = {
    sideLane: false,
    laneOffset: 0,
  }
  const requestsRaw = score.meta.get("REQUEST")
  if (requestsRaw) {
    for (const request of requestsRaw) {
      try {
        const [key, value] = JSON.parse(request).split(" ", 2)
        switch (key) {
          case "side_lane":
            requests.sideLane = value === "true"
            break
          case "lane_offset":
            requests.laneOffset = Number(value)
            break
        }
      } catch (e) {
        // Noop
      }
    }
  }

  for (const slides of [score.slides, score.guides] as const) {
    for (const slide of slides) {
      for (const note of slide) {
        const key = getKey(note)
        switch (note.type) {
          case 1:
          case 2:
          case 3:
          case 5:
            preventSingles.add(key)
            break
        }
      }
    }
  }
  for (const note of score.directionalNotes) {
    const key = getKey(note)
    switch (note.type) {
      case 1:
        flickMods.set(key, "up")
        break
      case 3:
        flickMods.set(key, "left")
        break
      case 4:
        flickMods.set(key, "right")
        break
      case 2:
        easeMods.set(key, "in")
        break
      case 5:
      case 6:
        easeMods.set(key, "out")
        break
    }
  }
  for (const note of score.tapNotes) {
    const key = getKey(note)
    switch (note.type) {
      case 2:
        criticalMods.add(key)
        break
      case 4:
        judgeRemoveMods.add(key)
        break
      case 3:
      case 5:
        tickRemoveMods.add(key)
        break
      case 6:
        criticalMods.add(key)
        tickRemoveMods.add(key)
        break
      case 7:
        judgeRemoveMods.add(key)
        break
      case 8:
        criticalMods.add(key)
        judgeRemoveMods.add(key)
        break
    }
  }

  const objects: USCObject[] = []

  for (const timeScaleChanges of score.timeScaleChanges) {
    objects.push({
      type: "timeScaleGroup",
      changes: timeScaleChanges.map((timeScaleChange) => ({
        beat: timeScaleChange.tick / score.ticksPerBeat,
        timeScale: timeScaleChange.timeScale,
      })),
    })
  }

  for (const bpmChange of score.bpmChanges) {
    objects.push({
      type: "bpm",
      beat: bpmChange.tick / score.ticksPerBeat,
      bpm: bpmChange.bpm,
    })
  }

  for (const note of score.tapNotes) {
    if (!requests.sideLane && (note.lane <= 1 || note.lane >= 14)) continue

    const key = getKey(note)
    if (preventSingles.has(key)) continue

    if (dedupeSingles.has(key)) continue
    dedupeSingles.add(key)
    let object: USCObject
    switch (note.type) {
      case 1:
      case 2:
      case 3:
      case 5:
      case 6: {
        object = {
          type: "single",
          beat: note.tick / score.ticksPerBeat,
          lane: note.lane - 8 + note.width / 2 + requests.laneOffset,
          size: note.width / 2,
          critical: [2, 6].includes(note.type) || criticalMods.has(key),
          trace: [3, 5, 6].includes(note.type) || tickRemoveMods.has(key),

          timeScaleGroup: note.timeScaleGroup,
        }

        const flickMod = flickMods.get(key)
        if (flickMod) object.direction = flickMod
        if (easeMods.has(key)) object.direction = "none"
        break
      }
      case 4:
        object = {
          type: "damage",
          beat: note.tick / score.ticksPerBeat,
          lane: note.lane - 8 + note.width / 2 + requests.laneOffset,
          size: note.width / 2,

          timeScaleGroup: note.timeScaleGroup,
        }
        break
      default:
        continue
    }

    objects.push(object)
  }

  for (const [isDummy, slides] of [
    [false, score.slides],
    [true, score.guides],
  ] as const) {
    for (const slide of slides) {
      const startNote = slide.find(({ type }) => type === 1 || type === 2)
      if (!startNote) continue
      const endNote = slide.find(({ type }) => type === 2)
      if (!endNote) continue

      const object: USCSlideNote = {
        type: "slide",
        critical: criticalMods.has(getKey(startNote)),
        connections: [] as never,
      }

      for (const note of slide) {
        const key = getKey(note)

        const beat = note.tick / score.ticksPerBeat
        const lane = note.lane - 8 + note.width / 2 + requests.laneOffset
        const size = note.width / 2
        const timeScaleGroup = note.timeScaleGroup
        const critical =
          ("critical" in object && object.critical) || criticalMods.has(key)
        const ease = easeMods.get(key) ?? "linear"

        switch (note.type) {
          case 1: {
            let judgeType: "normal" | "trace" | "none" = "normal"
            if (tickRemoveMods.has(key)) judgeType = "trace"
            if (judgeRemoveMods.has(key)) judgeType = "none"
            const connection: USCConnectionStartNote = {
              type: "start",
              beat,
              lane,
              size,
              critical,
              ease: easeMods.get(key) ?? "linear",
              judgeType,

              timeScaleGroup,
            }

            object.connections.push(connection)
            break
          }
          case 2: {
            let judgeType: "normal" | "trace" | "none" = "normal"
            if (tickRemoveMods.has(key)) judgeType = "trace"
            if (judgeRemoveMods.has(key)) judgeType = "none"

            const connection: USCConnectionEndNote = {
              type: "end",
              beat,
              lane,
              size,
              critical,
              judgeType,

              timeScaleGroup,
            }

            const flickMod = flickMods.get(key)
            if (flickMod) connection.direction = flickMod

            object.connections.push(connection)
            break
          }
          case 3: {
            if (tickRemoveMods.has(key)) {
              const connection: USCConnectionAttachNote = {
                type: "attach",
                beat,
                critical,
                timeScaleGroup,
              }

              object.connections.push(connection)
            } else {
              const connection: USCConnectionTickNote = {
                type: "tick",
                beat,
                lane,
                size,
                critical,
                ease,

                timeScaleGroup,
              }

              object.connections.push(connection)
            }
            break
          }
          case 5: {
            if (tickRemoveMods.has(key)) break

            const connection: USCConnectionTickNote = {
              type: "tick",
              beat,
              lane,
              size,
              ease,

              timeScaleGroup,
            }

            object.connections.push(connection)
            break
          }
        }
      }

      if (
        isDummy ||
        (tickRemoveMods.has(getKey(startNote)) &&
          judgeRemoveMods.has(getKey(startNote)))
      ) {
        objects.push({
          type: "guide",
          color: criticalMods.has(getKey(startNote)) ? "yellow" : "green",
          fade: judgeRemoveMods.has(getKey(endNote)) ? "none" : "out",
          midpoints: object.connections.flatMap((connection) =>
            connection.type === "attach"
              ? []
              : [
                  {
                    beat: connection.beat,
                    lane: connection.lane,
                    size: connection.size,
                    ease:
                      connection.type === "end" ? "linear" : connection.ease,
                    timeScaleGroup: connection.timeScaleGroup,
                  },
                ]
          ),
        })
      } else {
        objects.push(object)
      }

      const key = getKey(startNote)
      const dupe = dedupeSlides.get(key)
      if (dupe) objects.splice(objects.indexOf(dupe), 1)

      dedupeSlides.set(key, object)
    }
  }

  return {
    offset: score.offset,
    objects,
  }
}

const getKey = (note: NoteObject) => `${note.lane}-${note.tick}`
