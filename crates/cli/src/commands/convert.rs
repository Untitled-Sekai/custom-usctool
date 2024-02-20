use crate::common::FileFormat;
use anyhow::Result;
use usctool::Usc;

pub fn convert(input: &str, output: &str, format: FileFormat, version: Option<i32>) -> Result<()> {
    let data = crate::common::read(input)?;
    let usc = match format {
        FileFormat::Auto => Usc::from_any(&data).unwrap().1,
        FileFormat::Sus => Usc::from_sus(&data).unwrap(),
        FileFormat::Chs => Usc::from_chs(&data).unwrap(),
        FileFormat::Mmws | FileFormat::Ccmmws => Usc::from_mmws(&data).unwrap(),
    };
    let data = usc.to_vusc(version)?;
    crate::common::write(output, data.as_bytes())?;
    Ok(())
}
