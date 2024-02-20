fn main() {
    if std::env::var("PROFILE").unwrap() == "release" {
        cbindgen::generate(".")
            .unwrap()
            .write_to_file("../../target/usctool.h");
    }
}
