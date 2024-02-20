use anyhow::Result;
use base64::{engine::general_purpose, Engine as _};
use once_cell::sync::Lazy;
use rquickjs::{Context, Function};
use serde::{Deserialize, Serialize};
use serde_json::Value;

static RUNTIME: Lazy<rquickjs::Runtime> = Lazy::new(|| rquickjs::Runtime::new().unwrap());
static SCRIPT: &str = concat!(include_str!("./usctool.js"), "\n", "usctool.default");

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum Format {
    Auto,
    Sus,
    Chs,
    Mmws,
    Ccmmws,
    Vusc,
}
#[derive(Debug, Serialize)]
#[serde(tag = "command", content = "payload", rename_all = "camelCase")]
pub enum Command {
    Convert { format: Format, data: String },
    Migrate { data: Value, to: u32 },
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", tag = "result")]
pub enum JsResult<T> {
    Ok { data: T },
    Error { message: String },
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConvertResult {
    pub format: Format,
    pub usc: Value,
}

impl<T> From<JsResult<T>> for Result<T> {
    fn from(js_result: JsResult<T>) -> Self {
        match js_result {
            JsResult::Ok { data } => Ok(data),
            JsResult::Error { message } => Err(anyhow::anyhow!(message)),
        }
    }
}

fn call_js(command: Command) -> String {
    let command_json = serde_json::to_string(&command).unwrap();
    let context = Context::full(&RUNTIME).unwrap();
    let result: String = context.with(|ctx| {
        let entry: Function = ctx.eval(SCRIPT).unwrap();
        let res: String = entry.call((command_json,)).unwrap();
        res
    });
    result
}

pub fn convert(format: Format, data: &[u8]) -> Result<ConvertResult> {
    let data = general_purpose::STANDARD.encode(data);
    let command = Command::Convert { format, data };
    let result: JsResult<ConvertResult> = serde_json::from_str(&call_js(command)).unwrap();
    result.into()
}

pub fn migrate(data: Value, to: u32) -> Result<Value> {
    let command = Command::Migrate { data, to };
    let result: JsResult<Value> = serde_json::from_str(&call_js(command)).unwrap();
    result.into()
}
