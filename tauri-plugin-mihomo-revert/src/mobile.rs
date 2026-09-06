use serde::{Deserialize, de::DeserializeOwned};
use tauri::{
    AppHandle, Runtime,
    plugin::{PluginApi, PluginHandle},
};

const PLUGIN_IDENTIFIER: &str = "app.tauri.mihomo";

pub fn init<R: Runtime, C: DeserializeOwned>(
    _app: &AppHandle<R>,
    api: PluginApi<R, C>,
) -> crate::Result<AndroidVpn<R>> {
    let handle = api
        .register_android_plugin(PLUGIN_IDENTIFIER, "MihomoPlugin")
        .map_err(|e| crate::Error::FailedResponse(e.to_string()))?;
    Ok(AndroidVpn(handle))
}

pub struct AndroidVpn<R: Runtime>(PluginHandle<R>);

#[derive(Debug, Deserialize)]
struct StartVpnResponse {
    fd: i32,
}

impl<R: Runtime> AndroidVpn<R> {
    pub async fn start_vpn(&self) -> crate::Result<i32> {
        let response: StartVpnResponse = self
            .0
            .run_mobile_plugin_async("startVpn", ())
            .await
            .map_err(|e| crate::Error::FailedResponse(e.to_string()))?;

        if response.fd <= 0 {
            return Err(crate::Error::FailedResponse(format!(
                "Invalid VPN file descriptor: {}",
                response.fd
            )));
        }

        Ok(response.fd)
    }

    pub fn stop_vpn(&self) -> crate::Result<()> {
        self.0
            .run_mobile_plugin("stopVpn", ())
            .map_err(|e| crate::Error::FailedResponse(e.to_string()))
    }
}
