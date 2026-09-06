// Copyright 2019-2025 RedClash Project
// SPDX-License-Identifier: Apache-2.0

package app.tauri.mihomo

import android.app.Activity
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.net.VpnService
import android.os.Build
import android.os.ParcelFileDescriptor
import android.system.Os
import android.system.OsConstants
import android.webkit.WebView
import app.tauri.annotation.ActivityCallback
import app.tauri.annotation.Command
import app.tauri.plugin.Invoke
import app.tauri.plugin.Plugin
import androidx.activity.result.ActivityResult

class MihomoPlugin(activity: Activity) : Plugin(activity) {
  private val hostActivity = activity

  override fun load(webView: WebView) {
    // Rust 侧的 HTTPS（订阅下载等）依赖 rustls-platform-verifier，它必须先拿到
    // App Context 才能调 Android 的信任库。见 src-tauri/src/android.rs
    try {
      nativeInitVerifier(hostActivity)
    } catch (error: Throwable) {
      android.util.Log.e("MihomoPlugin", "init platform verifier failed", error)
    }
  }

  private external fun nativeInitVerifier(context: Context)

  @Command
  fun startVpn(invoke: Invoke) {
    synchronized(startLock) {
      val currentFd = MihomoVpnService.currentFd()
      if (currentFd != null) {
        invoke.resolveObject(mapOf("fd" to currentFd))
        return
      }

      if (pendingStart != null) {
        invoke.reject("A VPN start request is already in progress")
        return
      }
      pendingStart = invoke
    }

    val prepareIntent = VpnService.prepare(hostActivity)
    if (prepareIntent != null) {
      startActivityForResult(invoke, prepareIntent, "vpnPermissionResult")
    } else {
      startVpnService()
    }
  }

  @ActivityCallback
  fun vpnPermissionResult(invoke: Invoke, result: ActivityResult) {
    if (result.resultCode != Activity.RESULT_OK) {
      clearPendingStart()
      invoke.reject("VPN permission was not granted")
      return
    }

    startVpnService()
  }

  @Command
  fun stopVpn(invoke: Invoke) {
    clearPendingStart()?.reject("VPN start cancelled")
    MihomoVpnService.stop(hostActivity)
    invoke.resolve()
  }

  private fun startVpnService() {
    try {
      val intent = Intent(hostActivity, MihomoVpnService::class.java)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        hostActivity.startForegroundService(intent)
      } else {
        hostActivity.startService(intent)
      }
    } catch (error: Exception) {
      rejectPendingStart("Failed to start VPN service: ${error.message}")
    }
  }

  private fun clearPendingStart(): Invoke? =
    synchronized(startLock) {
      val pending = pendingStart
      pendingStart = null
      pending
    }

  companion object {
    private val startLock = Any()
    private var pendingStart: Invoke? = null

    fun resolvePendingStart(fd: Int) {
      val pending = synchronized(startLock) {
        val current = pendingStart
        pendingStart = null
        current
      }
      pending?.resolveObject(mapOf("fd" to fd))
    }

    fun rejectPendingStart(message: String) {
      val pending = synchronized(startLock) {
        val current = pendingStart
        pendingStart = null
        current
      }
      pending?.reject(message)
    }
  }
}

class MihomoVpnService : VpnService() {
  private var vpnInterface: ParcelFileDescriptor? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (vpnInterface != null) {
      MihomoPlugin.resolvePendingStart(vpnInterface!!.fd)
      return START_STICKY
    }

    try {
      vpnInterface = Builder()
        .setSession("RedClash")
        .addAddress("198.18.0.1", 30)
        .addRoute("0.0.0.0", 0)
        .addDnsServer("1.1.1.1")
        .addDisallowedApplication(packageName)
        .establish()
        ?: throw IllegalStateException("VpnService.Builder.establish() returned null")

      makeInheritable(vpnInterface!!.fileDescriptor)
      startForegroundServiceNotification()
      activeService = this
      MihomoPlugin.resolvePendingStart(vpnInterface!!.fd)
    } catch (error: Exception) {
      vpnInterface?.close()
      vpnInterface = null
      MihomoPlugin.rejectPendingStart("Failed to establish VPN: ${error.message}")
      stopSelf()
    }

    return START_STICKY
  }

  override fun onDestroy() {
    activeService = null
    vpnInterface?.close()
    vpnInterface = null
    MihomoPlugin.rejectPendingStart("VPN service stopped before it was ready")
    super.onDestroy()
  }

  override fun onRevoke() {
    stopSelf()
    super.onRevoke()
  }

  private fun startForegroundServiceNotification() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel = NotificationChannel(
        CHANNEL_ID,
        "RedClash VPN",
        NotificationManager.IMPORTANCE_LOW,
      )
      getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
    }

    val notification = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      Notification.Builder(this, CHANNEL_ID)
    } else {
      Notification.Builder(this)
    }
      .setSmallIcon(android.R.drawable.stat_sys_warning)
      .setContentTitle("RedClash")
      .setContentText("VPN is active")
      .setOngoing(true)
      .build()

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      startForeground(
        NOTIFICATION_ID,
        notification,
        ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE,
      )
    } else {
      startForeground(NOTIFICATION_ID, notification)
    }
  }

  private fun makeInheritable(fileDescriptor: java.io.FileDescriptor) {
    val flags = Os.fcntlInt(fileDescriptor, OsConstants.F_GETFD, 0)
    Os.fcntlInt(
      fileDescriptor,
      OsConstants.F_SETFD,
      flags and OsConstants.FD_CLOEXEC.inv(),
    )
  }

  companion object {
    private const val CHANNEL_ID = "redclash-vpn"
    private const val NOTIFICATION_ID = 1001
    @Volatile
    private var activeService: MihomoVpnService? = null

    fun currentFd(): Int? = activeService?.vpnInterface?.fd

    fun stop(context: Context) {
      activeService?.stopSelf()
      context.stopService(Intent(context, MihomoVpnService::class.java))
    }
  }
}
