use std::path::{Path, PathBuf};

/// Cari `protoc` yang benar-benar bisa dijalankan di platform ini.
///
/// Urutan:
///   1. env `PROTOC` — dihormati apa adanya (CI/VPS/Dockerfile).
///   2. `protoc` dari PATH — jalur normal di Docker (`apt install protobuf-compiler`).
///   3. `tools/protobuf/bin/protoc` yang di-vendor di repo — hanya sebagai
///      fallback terakhir. Binary itu khusus macOS, jadi TIDAK boleh dipakai
///      lebih dulu: di Linux ia gagal dengan "Exec format error".
fn resolve_protoc() {
    if std::env::var_os("PROTOC").is_some() {
        return;
    }

    let exe = if cfg!(windows) { "protoc.exe" } else { "protoc" };

    if let Some(paths) = std::env::var_os("PATH") {
        if std::env::split_paths(&paths).any(|dir| dir.join(exe).is_file()) {
            return; // prost-build akan menemukannya sendiri
        }
    }

    let vendored: PathBuf = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../tools/protobuf/bin")
        .join(exe);
    if vendored.is_file() {
        std::env::set_var("PROTOC", vendored);
    }
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    resolve_protoc();

    println!("cargo:rerun-if-changed=../proto/user.proto");

    tonic_build::configure()
        .build_server(true)
        .build_client(false)
        .compile_protos(&["../proto/user.proto"], &["../proto"])?;
    Ok(())
}
