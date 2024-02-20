use std::{ffi::CString, sync::Mutex};

use once_cell::sync::Lazy;

pub struct StringsManager {
    strings: Vec<CString>,
}

pub static STRINGS_MANAGER: Lazy<Mutex<StringsManager>> =
    Lazy::new(|| Mutex::new(StringsManager::new()));

impl StringsManager {
    pub fn new() -> Self {
        Self {
            strings: Vec::new(),
        }
    }

    pub fn add(&mut self, string: &str) -> *const i8 {
        let cstring = CString::new(string).unwrap();
        let ptr = cstring.as_ptr();
        self.strings.push(cstring);
        ptr
    }

    pub fn free(&mut self, ptr: *const i8) -> bool {
        let cstring = unsafe { CString::from_raw(ptr as *mut i8) };
        if !self
            .strings
            .iter().any(|s| s.as_ptr() == cstring.as_ptr())
        {
            return false;
        }
        self.strings.retain(|s| s.as_ptr() != cstring.as_ptr());
        true
    }
}
