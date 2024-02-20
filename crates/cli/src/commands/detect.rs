use anyhow::Result;
use usctool::Usc;

pub fn detect(input: &str) -> Result<()> {
    let data = crate::common::read(input)?;
    let type_ = Usc::from_any(&data)?.0;
    println!("{}", type_);

    Ok(())
}
