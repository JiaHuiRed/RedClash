//! Android 专属的启动胶水代码。
//!
//! reqwest 默认用 `rustls-platform-verifier` 校验证书，而它在 Android 上是通过
//! JNI 调系统的信任库。这个库必须先拿到 JNI 环境和 App `Context` 完成初始化，
//! 之后 `Verifier::new()` 才能工作，否则任何 Rust 侧的 HTTPS 请求都会 panic：
//!
//! ```text
//! Panic occurred at rustls-platform-verifier-0.7.0/src/android.rs:90:
//! Expect rustls-platform-verifier to be initialized
//! ```
//!
//! 官方的 Kotlin 配套组件没有发布到 Maven（rustls/rustls-platform-verifier#115），
//! 所以这里自己导出一个 JNI 入口，由 `MihomoPlugin.load()` 在插件装载时调用。

use clash_verge_logging::{Type, logging};
use jni::objects::{JClass, JObject};
use jni::{EnvUnowned, Outcome};

/// 用 App Context 初始化平台证书校验器。
///
/// 对应 Kotlin 侧的 `app.tauri.mihomo.MihomoPlugin.nativeInitVerifier`。
#[unsafe(no_mangle)]
pub extern "system" fn Java_app_tauri_mihomo_MihomoPlugin_nativeInitVerifier<'caller>(
    mut unowned_env: EnvUnowned<'caller>,
    _class: JClass<'caller>,
    context: JObject<'caller>,
) {
    match unowned_env
        .with_env(|env| {
            rustls_platform_verifier::android::init_with_env(env, context)?;
            Ok::<(), jni::errors::Error>(())
        })
        .into_outcome()
    {
        Outcome::Ok(()) => {}
        Outcome::Err(error) => logging!(error, Type::Setup, "初始化 Android 平台证书校验器失败: {error}"),
        Outcome::Panic(_) => logging!(
            error,
            Type::Setup,
            "初始化 Android 平台证书校验器失败: 初始化过程 panic"
        ),
    }
}
