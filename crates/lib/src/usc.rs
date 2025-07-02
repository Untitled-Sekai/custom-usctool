use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq, Copy, Clone)]
#[serde(rename_all = "camelCase")]
pub enum FileFormat {
    Sus,
    Chs,
    Mmws,
    Ccmmws,
    Vusc,
}

impl std::fmt::Display for FileFormat {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        serde_json::to_string(self)
            .map_err(|_| std::fmt::Error)
            .and_then(|s| f.write_str(&s))
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Usc {
    pub offset: f64,
    pub objects: Vec<UscObject>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum UscObject {
    Bpm(UscBpmChange),
    TimeScaleGroup(UscTimeScaleChange),
    Single(UscSingleNote),
    Slide(UscSlideNote),
    Guide(UscGuideNote),
    Damage(UscDamageNote),
    LaneEvent(UscLaneEvent), //レーンイベント
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UscBpmChange {
    pub beat: f64,
    pub bpm: f64,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UscTimeScaleChange {
    pub changes: Vec<TimeScaleChange>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimeScaleChange {
    pub beat: f64,
    pub time_scale: f64,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UscSingleNote {
    pub beat: f64,
    pub time_scale_group: i32,
    pub lane: f64,
    pub size: f64,
    pub critical: bool,
    pub trace: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub direction: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UscDamageNote {
    pub beat: f64,
    pub time_scale_group: i32,
    pub lane: f64,
    pub size: f64,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UscConnectionStartNote {
    pub beat: f64,
    pub time_scale_group: i32,
    pub lane: f64,
    pub size: f64,
    pub critical: bool,
    pub ease: String,
    pub judge_type: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", tag = "type")]
pub enum UscSlideConnection {
    Start(UscConnectionStartNote),
    Tick(UscConnectionTickNote),
    Attach(UscConnectionAttachNote),
    End(UscConnectionEndNote),
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UscConnectionTickNote {
    pub beat: f64,
    pub time_scale_group: i32,
    pub lane: f64,
    pub size: f64,
    pub critical: Option<bool>,
    pub ease: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UscConnectionAttachNote {
    pub beat: f64,
    pub critical: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub time_scale_group: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UscConnectionEndNote {
    pub beat: f64,
    pub time_scale_group: i32,
    pub lane: f64,
    pub size: f64,
    pub critical: bool,
    pub direction: Option<String>,
    pub judge_type: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UscSlideNote {
    pub critical: bool,
    pub connections: Vec<UscSlideConnection>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UscGuideMidpointNote {
    pub beat: f64,
    pub time_scale_group: i32,
    pub lane: f64,
    pub size: f64,
    pub ease: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UscGuideNote {
    pub color: UscColor,
    pub fade: UscFade,
    pub midpoints: Vec<UscGuideMidpointNote>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum UscColor {
    Neutral,
    Red,
    Green,
    Blue,
    Yellow,
    Purple,
    Cyan,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum UscFade {
    In,
    Out,
    None,
}

// --- 追加 ---

// レーンイベント 
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UscLaneEvent {
    pub beat: f64,
    pub alpha: f64, // レーンの透明度
    // pub rotation: f64, // レーンの回転角度  実装予定ではあるが、現時点では未使用
}