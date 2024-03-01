mod strings;
use std::ffi::c_char;

thread_local! {
    static LAST_ERROR: std::cell::RefCell<Option<String>> = std::cell::RefCell::new(None);
}

fn run(f: impl FnOnce() -> Result<String, anyhow::Error>) -> *const c_char {
    let result = f();
    match result {
        Ok(data) => {
            let mut cstring_manager = strings::STRINGS_MANAGER.lock().unwrap();
            cstring_manager.add(&data)
        }
        Err(e) => {
            LAST_ERROR.with(|last_error| {
                *last_error.borrow_mut() = Some(e.to_string());
            });
            std::ptr::null()
        }
    }
}

/// Returns the version of the library.
///
/// # Safety
///
/// The returned pointer must be freed with `usctool_free`.
#[no_mangle]
extern "C" fn usctool_version() -> *const c_char {
    let version = env!("CARGO_PKG_VERSION");
    {
        let mut cstring_manager = strings::STRINGS_MANAGER.lock().unwrap();
        cstring_manager.add(version)
    }
}

/// Frees the memory allocated by the library.
///
/// Returns `true` if the memory was freed successfully, otherwise `false`.
#[no_mangle]
extern "C" fn usctool_free(ptr: *const c_char) -> bool {
    let mut cstring_manager = strings::STRINGS_MANAGER.lock().unwrap();
    cstring_manager.free(ptr)
}

/// The file format of the input file.
#[repr(C)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum UsctoolFileFormat {
    /// Auto-detect the file format.
    UsctoolFileFormatAuto = 0,
    /// Sliding Universal Score。
    UsctoolFileFormatSus = 1,
    /// Chs。
    UsctoolFileFormatChs = 2,
    /// MMWS。
    UsctoolFileFormatMmws = 3,
    /// CCMMWS。
    UsctoolFileFormatCcmmws = 4,
}

/// Converts the input file to VUSC.
///
/// If successful, it returns a pointer to a Null-terminated string.
/// The pointer must be freed with `usctool_free`.
/// If it fails, it returns `nullptr`.
/// The error can be obtained with `usctool_last_error`.
///
/// # Arguments
///
/// * `input` - The pointer to the input file.
/// * `input_len` - The length of the input file.
/// * `format` - The file format of the input file.
#[no_mangle]
extern "C" fn usctool_convert(
    input: *const u8,
    input_len: usize,
    format: UsctoolFileFormat,
) -> *const c_char {
    let input = unsafe { std::slice::from_raw_parts(input, input_len) };

    run(move || {
        let data = match format {
            UsctoolFileFormat::UsctoolFileFormatAuto => usctool::Usc::from_any(input)?.1,
            UsctoolFileFormat::UsctoolFileFormatSus => usctool::Usc::from_sus(input)?,
            UsctoolFileFormat::UsctoolFileFormatChs => usctool::Usc::from_chs(input)?,
            UsctoolFileFormat::UsctoolFileFormatMmws
            | UsctoolFileFormat::UsctoolFileFormatCcmmws => usctool::Usc::from_mmws(input)?,
        };
        let data = data.to_vusc(None)?;

        Ok(data)
    })
}
/// Migrate the input VUSC file to the specified version.
///
/// If successful, it returns a pointer to a Null-terminated string.
/// The pointer must be freed with `usctool_free`.
/// If it fails, it returns `nullptr`.
///
/// # Arguments
///
/// * `input` - The pointer to the input file.
/// * `to` - The version to migrate to.
#[no_mangle]
extern "C" fn usctool_migrate(input: *const u8, to: u32) -> *const c_char {
    let input = unsafe { std::ffi::CStr::from_ptr(input as _).to_bytes() };

    run(move || {
        let data = usctool::Usc::from_vusc(input)?;
        let data = data.to_vusc(Some(to))?;

        Ok(data)
    })
}

/// Detect the file format of the input file.
///
/// If successful, it returns the file format.
/// If it fails, it returns `0`.
///
/// # Arguments
///
/// * `input` - The pointer to the input file.
/// * `input_len` - The length of the input file.
#[no_mangle]
extern "C" fn usctool_detect(input: *const u8, input_len: usize) -> u32 {
    let input = unsafe { std::slice::from_raw_parts(input, input_len) };

    match usctool::Usc::from_any(input) {
        Ok((format, _)) => UsctoolFileFormat::try_from(format).unwrap() as u32,
        Err(_) => 0,
    }
}

/// Returns the last error message.
///
/// # Safety
///
/// The returned pointer must be freed with `usctool_free`.
#[no_mangle]
extern "C" fn usctool_last_error() -> *const c_char {
    LAST_ERROR.with(|last_error| {
        let last_error = last_error.borrow();
        if let Some(last_error) = &*last_error {
            let mut cstring_manager = strings::STRINGS_MANAGER.lock().unwrap();
            cstring_manager.add(last_error)
        } else {
            std::ptr::null()
        }
    })
}

impl TryFrom<usctool::FileFormat> for UsctoolFileFormat {
    type Error = ();

    fn try_from(value: usctool::FileFormat) -> Result<Self, Self::Error> {
        match value {
            usctool::FileFormat::Sus => Ok(UsctoolFileFormat::UsctoolFileFormatSus),
            usctool::FileFormat::Chs => Ok(UsctoolFileFormat::UsctoolFileFormatChs),
            usctool::FileFormat::Mmws => Ok(UsctoolFileFormat::UsctoolFileFormatMmws),
            usctool::FileFormat::Ccmmws => Ok(UsctoolFileFormat::UsctoolFileFormatCcmmws),
            _ => Err(()),
        }
    }
}

impl TryFrom<UsctoolFileFormat> for usctool::FileFormat {
    type Error = ();

    fn try_from(value: UsctoolFileFormat) -> Result<Self, Self::Error> {
        match value {
            UsctoolFileFormat::UsctoolFileFormatSus => Ok(usctool::FileFormat::Sus),
            UsctoolFileFormat::UsctoolFileFormatChs => Ok(usctool::FileFormat::Chs),
            UsctoolFileFormat::UsctoolFileFormatMmws => Ok(usctool::FileFormat::Mmws),
            UsctoolFileFormat::UsctoolFileFormatCcmmws => Ok(usctool::FileFormat::Ccmmws),
            _ => Err(()),
        }
    }
}
