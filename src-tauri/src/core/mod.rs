#[cfg(not(any(target_os = "android", target_os = "ios")))]
pub mod autostart;
pub mod backup;
pub mod handle;
#[cfg(not(any(target_os = "android", target_os = "ios")))]
pub mod hotkey;
pub mod logger;
pub mod manager;
mod notification;
#[cfg(not(any(target_os = "android", target_os = "ios")))]
pub mod service;
#[cfg(not(any(target_os = "android", target_os = "ios")))]
pub mod sysopt;
pub mod timer;
#[cfg(not(any(target_os = "android", target_os = "ios")))]
pub mod tray;
pub mod validate;
#[cfg(target_os = "windows")]
pub mod win_uwp;

pub use self::{manager::CoreManager, timer::Timer};
