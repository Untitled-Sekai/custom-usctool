use anyhow::Result;
use usctool::Usc;

pub fn migrate(input: &str, output: &str, version: Option<i32>) -> Result<()> {
    let data = crate::common::read(input)?;
    let usc = Usc::from_any(&data)?.1;
    let data = usc.to_vusc(version)?;
    crate::common::write(output, data.as_bytes())?;
    Ok(())
}
