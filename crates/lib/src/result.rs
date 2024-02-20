use thiserror::Error;

#[derive(Error, Debug)]
pub enum Error {
    #[error("Failed to convert")]
    Convert(#[from] anyhow::Error),
}

pub type Result<T> = std::result::Result<T, Error>;
