mod commands;
mod common;

use clap::{Parser, Subcommand};
use common::FileFormat;

#[derive(Parser)]
#[command(author, version, about, long_about = None, propagate_version = true)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Convert files into Versioned USC
    Convert {
        /// Input file, "-" for stdin
        path: String,
        /// Output file, "-" for stdout
        output: String,
        /// Format of input file. If not specified, will be inferred from its contents.
        #[clap(long, short)]
        format: Option<FileFormat>,
        /// Version of VUSC to convert to, defaults to latest
        #[clap(long, short)]
        target: Option<u32>,
    },
    /// Migrate VUSC file to a different version
    Migrate {
        /// Input file, "-" for stdin
        path: String,
        /// Output file, "-" for stdout
        output: String,
        /// Version of VUSC to migrate to, defaults to latest
        #[clap(long, short)]
        target: Option<u32>,
    },
    /// Detect the format of a file
    Detect {
        /// Input file, "-" for stdin
        path: String,
    },
}

fn main() {
    let cli = Cli::parse();

    let result = match &cli.command {
        Commands::Convert {
            path,
            output,
            format,
            target,
        } => commands::convert(path, output, format.unwrap_or_default(), *target),
        Commands::Migrate {
            path,
            output,
            target,
        } => commands::migrate(path, output, *target),
        Commands::Detect { path } => commands::detect(path),
    };

    if let Err(e) = result {
        eprintln!("Error: {}", e);
        std::process::exit(1);
    }
}
