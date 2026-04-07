use clap::{Arg, Command};

fn main() {
    let db = std::env::var("DATABASE_URL").unwrap();

    let matches = Command::new("synthetic")
        .arg(Arg::new("config").long("config").short('c'))
        .arg(Arg::new("threads").long("threads").short('t'))
        .arg(Arg::new("verbose").long("verbose").short('v'))
        .arg(Arg::new("quiet").long("quiet").short('q'))
        .get_matches();
}
