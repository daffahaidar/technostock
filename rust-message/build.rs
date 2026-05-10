fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Jika env var PROTOC sudah diset oleh Linux/VPS, gunakan itu.
    // Jika belum/lokal, gunakan fallback path Mac jika tersedia.
    if std::env::var("PROTOC").is_err() {
        let local_protoc = "/Users/daffahaidarnz/Development/projects/dimentorin/tools/protobuf/bin/protoc";
        if std::path::Path::new(local_protoc).exists() {
            std::env::set_var("PROTOC", local_protoc);
        }
    }
    tonic_build::configure()
        .build_server(false) 
        .build_client(true) // rust-message is the client
        .compile_protos(&["../proto/user.proto"], &["../proto"])?;
    Ok(())
}
