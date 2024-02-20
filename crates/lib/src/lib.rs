mod js_bridge;
mod result;
mod usc;

use duplicate::duplicate_item;
use result::{Error, Result};
use serde::{Serialize, Serializer};
use serde_json::json;

pub use usc::FileFormat;

#[derive(Debug)]
pub struct Usc {
    pub data: usc::Usc,
}

impl Serialize for Usc {
    fn serialize<S: Serializer>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error> {
        self.data.serialize(serializer)
    }
}

impl Usc {
    pub fn from_any(data: &[u8]) -> Result<(usc::FileFormat, Usc)> {
        let data = js_bridge::convert(js_bridge::Format::Auto, data).map_err(Error::Convert)?;
        let format = match data.format {
            js_bridge::Format::Sus => usc::FileFormat::Sus,
            js_bridge::Format::Chs => usc::FileFormat::Chs,
            js_bridge::Format::Mmws => usc::FileFormat::Mmws,
            js_bridge::Format::Vusc => usc::FileFormat::Vusc,
            js_bridge::Format::Auto => unreachable!(),
        };
        let data = serde_json::from_value(data.usc).map_err(|e| Error::Convert(e.into()))?;
        Ok((format, Usc { data }))
    }
    #[duplicate_item(
        method_name format_name;
        [from_chs] [Chs];
        [from_mmws] [Mmws];
    )]
    pub fn method_name(data: &[u8]) -> Result<Usc> {
        let data =
            js_bridge::convert(js_bridge::Format::format_name, data).map_err(Error::Convert)?;
        let data = serde_json::from_value(data.usc).map_err(|e| Error::Convert(e.into()))?;
        Ok(Usc { data })
    }

    #[duplicate_item(
        method_name format_name;
        [from_sus] [Sus];
        [from_vusc] [Vusc];
    )]
    pub fn method_name(data: &[u8]) -> Result<Usc> {
        let data =
            js_bridge::convert(js_bridge::Format::format_name, data).map_err(Error::Convert)?;
        let data = serde_json::from_value(data.usc).map_err(|e| Error::Convert(e.into()))?;
        Ok(Usc { data })
    }

    pub fn new(data: &[u8]) -> Result<Usc> {
        let (_, usc) = Self::from_any(data)?;
        Ok(usc)
    }

    pub fn to_vusc(&self, version: Option<i32>) -> Result<String> {
        let data = match version {
            Some(version) => json!({
                "version": version,
                "usc": js_bridge::migrate(serde_json::to_value(&self.data).unwrap(), version).unwrap(),
            }),
            None => json!({
                "version": 2,
                "usc": &self.data,
            }),
        };
        Ok(serde_json::to_string(&data).unwrap())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use rstest::rstest;

    #[rstest(
        filename,
        case("test.sus"),
        case("ched2.chs"),
        case("ched3.chs"),
        case("test.mmws"),
        case("test.ccmmws")
    )]
    fn test(filename: &str) {
        let data: Vec<u8> = std::fs::read(format!(
            concat!(
                env!("CARGO_MANIFEST_DIR"),
                "/../../js/src/__tests__/assets/{}"
            ),
            filename
        ))
        .unwrap();

        let usc = Usc::new(&data).unwrap();
        dbg!(usc);
    }
}
