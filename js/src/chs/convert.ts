import { Score } from "../sus/analyze.js"
import { chsLikeToUSC } from "../sus/convert.js"
import { USC } from "../usc/index.js"
import { Chs2, Chs3, SusExportPluginOption } from "./typing/index.js"
import pako from "pako"

const tapLikeNotes = ["taps", "exTaps", "flicks", "damages"] as const
const noteTypeToSusType = {
  taps: 1,
  exTaps: 2,
  flicks: 3,
  damages: 4,
} as const
const chsDirectionToSusDirection = (note: {
  verticalDirection: 0 | 1
  horizontalDirection: 0 | 1 | 2
}) => {
  return {
    "0:0": 1,
    "0:1": 3,
    "0:2": 4,
    "1:0": 2,
    "1:1": 5,
    "1:2": 6,
  }[`${note.verticalDirection}:${note.horizontalDirection}`]
}
const analyze = (chs: Uint8Array): Score => {
  const parsedChs: Chs2 | Chs3 = JSON.parse(pako.ungzip(chs, { to: "string" }))
  const bpmChanges: Score["bpmChanges"] = []
  const directionalNotes: Score["directionalNotes"] = []
  let offset: number
  const meta: Score["meta"] = new Map()
  const slides: Score["slides"] = []
  const tapNotes: Score["tapNotes"] = []
  const guides: Score["guides"] = []
  const ticksPerBeat = parsedChs.score.ticksPerBeat
  const timeScaleChanges: Score["timeScaleChanges"] = []

  meta.set("REQUEST", ['"side_lane true"'])

  if (parsedChs.version.Major === 2) {
    offset = (parsedChs as Chs2).exporterArgs.sus?.soundOffset ?? 0
  } else if (parsedChs.version.Major === 3) {
    const pluginOption = (parsedChs as Chs3).exportArgs[
      "Ched.Plugins.SusExportPlugin"
    ]
    if (!pluginOption) {
      offset = 0
    } else {
      offset =
        (JSON.parse(pluginOption) as SusExportPluginOption).soundOffset ?? 0
    }
  } else {
    throw new Error("Invalid version")
  }

  for (const bpmChange of parsedChs.score.events.bpmChangeEvents) {
    bpmChanges.push({
      tick: bpmChange.tick,
      bpm: bpmChange.bpm,
    })
  }
  bpmChanges.sort((a, b) => a.tick - b.tick)
  const laneOffset = "laneoffset" in parsedChs ? parsedChs.laneoffset : 0

  meta.set("REQUEST", [`"lane_offset ${laneOffset}"`])
  const channelMap = new Map<number, number>()

  const tryChannel = (obj: { channel?: number } | Record<string, unknown>) => {
    if (!("channel" in obj) || typeof obj.channel !== "number") {
      return 0
    }
    const channel = obj.channel ?? 0
    if (!channelMap.has(channel)) {
      channelMap.set(channel, channelMap.size)
    }
    return channelMap.get(channel)!
  }

  for (const hispeedChange of parsedChs.score.events.highSpeedChangeEvents) {
    let timeScaleGroup = 0
    if ("speedCh" in hispeedChange) {
      if (!channelMap.has(hispeedChange.speedCh)) {
        channelMap.set(hispeedChange.speedCh, channelMap.size)
        timeScaleChanges.push([])
      }
      timeScaleGroup = channelMap.get(hispeedChange.speedCh)!
    } else if (timeScaleChanges.length === 0) {
      timeScaleChanges.push([])
    }
    timeScaleChanges[timeScaleGroup].push({
      tick: hispeedChange.tick,
      timeScale: hispeedChange.speedRatio,
    })
  }
  if (timeScaleChanges.length === 0) {
    timeScaleChanges.push([])
  }
  for (const timeScaleChange of timeScaleChanges) {
    timeScaleChange.sort((a, b) => a.tick - b.tick)
  }

  for (const [noteType, note] of tapLikeNotes.flatMap((key) =>
    parsedChs.score.notes[key].map(
      (note: {
        tick: number
        laneIndex: number
        width: number
        channel?: number
      }) => [key, note] as const
    )
  )) {
    const susType = noteTypeToSusType[noteType]
    tapNotes.push({
      type: susType,
      tick: note.tick,
      lane: note.laneIndex,
      width: note.width,
      timeScaleGroup: tryChannel(note),
    })
  }

  const notes = Object.values(parsedChs.score.notes).flatMap((notes) =>
    typeof notes === "string" ? [] : notes
  ) as {
    $id: string
    tick: number
    laneIndex: number
    width: number
    channel?: number
  }[]

  for (const slide of parsedChs.score.notes.slides) {
    const susSlide: Score["slides"][0] = [
      {
        lane: slide.startLaneIndex,
        tick: slide.startTick,
        type: 1,
        width: slide.startWidth,
        timeScaleGroup: tryChannel(slide),
      },
    ]
    slide.stepNotes.sort((a, b) => a.tickOffset - b.tickOffset)
    for (const step of slide.stepNotes) {
      susSlide.push({
        lane: slide.startLaneIndex + step.laneIndexOffset,
        tick: slide.startTick + step.tickOffset,
        type: step.isVisible ? 3 : 5,
        width: slide.startWidth + step.widthChange,
        timeScaleGroup: tryChannel(step),
      })
      notes.push({
        $id: step.$id,
        tick: slide.startTick + step.tickOffset,
        laneIndex: slide.startLaneIndex + step.laneIndexOffset,
        width: slide.startWidth + step.widthChange,
      })
    }
    susSlide[susSlide.length - 1].type = 2
    slides.push(susSlide)
  }

  if ("guides" in parsedChs.score.notes) {
    for (const guide of parsedChs.score.notes.guides) {
      const susSlide: Score["slides"][0] = [
        {
          lane: guide.startLaneIndex,
          tick: guide.startTick,
          type: 1,
          width: guide.startWidth,
          timeScaleGroup: tryChannel(guide),
        },
      ]
      guide.stepNotes.sort((a, b) => a.tickOffset - b.tickOffset)
      for (const step of guide.stepNotes) {
        susSlide.push({
          lane: guide.startLaneIndex + step.laneIndexOffset,
          tick: guide.startTick + step.tickOffset,
          type: step.isVisible ? 3 : 5,
          width: guide.startWidth + step.widthChange,
          timeScaleGroup: tryChannel(step),
        })
        notes.push({
          $id: step.$id,
          tick: guide.startTick + step.tickOffset,
          laneIndex: guide.startLaneIndex + step.laneIndexOffset,
          width: guide.startWidth + step.widthChange,
        })
      }
      susSlide[susSlide.length - 1].type = 2
      guides.push(susSlide)
    }
  }

  for (const note of parsedChs.score.notes.airs) {
    const refNote = notes.find((n) => n.$id === note.parentNote.$ref)
    if (!refNote) {
      continue
    }
    directionalNotes.push({
      tick: refNote.tick,
      lane: refNote.laneIndex,
      width: refNote.width,
      type: chsDirectionToSusDirection(note),
      timeScaleGroup: tryChannel(note),
    })
  }

  return {
    bpmChanges,
    directionalNotes,
    offset,
    meta,
    slides,
    guides,
    tapNotes,
    ticksPerBeat,
    timeScaleChanges,
  }
}

/** Convert the CHS to the USC */
export const chsToUSC = (chs: Uint8Array): USC => chsLikeToUSC(analyze(chs))
