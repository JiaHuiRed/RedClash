// Copyright 2019-2025 RedClash Project
// SPDX-License-Identifier: Apache-2.0

package app.tauri.mihomo

import android.app.Activity
import android.webkit.WebView
import app.tauri.plugin.Plugin

class MihomoPlugin(activity: Activity) : Plugin(activity) {
  override fun load(webView: WebView) {
    // The mihomo plugin is implemented in Rust and communicates via IPC.
    // No Android-side Kotlin logic is required; this class exists so the
    // plugin can be built as an Android library project.
  }
}
