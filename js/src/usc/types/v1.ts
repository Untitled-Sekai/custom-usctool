export type USC = {
  offset: number
  objects: USCObject[]
}

export type USCObject =
  | USCBpmChange
  | USCTimeScaleChange
  | USCSingleNote
  | USCSlideNote
  | USCDamageNote

type BaseUSCObject = {
  beat: number
  timeScaleGroup: number
}

export type USCBpmChange = Omit<BaseUSCObject, "timeScaleGroup"> & {
  type: "bpm"
  bpm: number
}

export type USCTimeScaleChange = {
  type: "timeScaleGroup"
  changes: {
    beat: number
    timeScale: number
  }[]
}

type BaseUSCNote = BaseUSCObject & {
  lane: number
  size: number
}

export type USCSingleNote = BaseUSCNote & {
  type: "single"
  critical: boolean
  trace: boolean
  direction?: "left" | "up" | "right" | "none"
}

export type USCDamageNote = BaseUSCNote & {
  type: "damage"
}

export type USCConnectionStartNote = BaseUSCNote & {
  type: "start"
  critical: boolean
  ease: "out" | "linear" | "in"
  judgeType: "normal" | "trace" | "none"
}

export type USCConnectionTickNote = BaseUSCNote & {
  type: "tick"
  critical?: boolean
  ease: "out" | "linear" | "in"
}

export type USCConnectionAttachNote = Omit<BaseUSCObject, "timeScaleGroup"> & {
  type: "attach"
  critical?: boolean
  timeScaleGroup?: number
}

export type USCConnectionEndNote = BaseUSCNote & {
  type: "end"
  critical: boolean
  direction?: "left" | "up" | "right"
  judgeType: "normal" | "trace" | "none"
}

export type USCSlideNote = {
  type: "slide"
  subType: "normal" | "fadeDummy" | "dummy"
  critical: boolean
  connections: [
    USCConnectionStartNote,
    ...(USCConnectionTickNote | USCConnectionAttachNote)[],
    USCConnectionEndNote,
  ]
}
