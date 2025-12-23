fn main() {
    tauri_build::build();
    #[cfg(target_os = "macos")]
    {
        cc::Build::new()
            .file("src/fn_key_monitor.c")
            .compile("fn_key_monitor");
        println!("cargo:rerun-if-changed=src/fn_key_monitor.c");
        println!("cargo:rustc-link-lib=framework=IOKit");
        println!("cargo:rustc-link-lib=framework=CoreFoundation");
    }
}
