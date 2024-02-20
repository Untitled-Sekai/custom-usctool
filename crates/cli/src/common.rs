use std::io::{Read, Write};

pub fn read(path: &str) -> Result<Vec<u8>, std::io::Error> {
    let mut buffer = Vec::new();
    if path == "-" {
        std::io::stdin().read_to_end(&mut buffer)?;
    } else {
        std::fs::File::open(path)?.read_to_end(&mut buffer)?;
    }
    Ok(buffer)
}

pub fn write(path: &str, data: &[u8]) -> Result<(), std::io::Error> {
    if path == "-" {
        std::io::stdout().write_all(data)?;
    } else {
        std::fs::File::create(path)?.write_all(data)?;
    }
    Ok(())
}

#[derive(Debug, PartialEq, Eq, Copy, Clone, clap::ValueEnum, Default)]
pub enum FileFormat {
    #[default]
    Auto,
    Sus,
    Chs,
    Mmws,
    Ccmmws,
}
