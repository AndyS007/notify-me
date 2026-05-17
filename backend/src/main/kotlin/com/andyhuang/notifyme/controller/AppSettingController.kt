package com.andyhuang.notifyme.controller

import com.andyhuang.notifyme.entity.AppSetting
import com.andyhuang.notifyme.entity.User
import com.andyhuang.notifyme.filter.ClerkAuthFilter
import com.andyhuang.notifyme.repository.AppSettingRepository
import com.andyhuang.notifyme.service.S3IconService
import jakarta.servlet.http.HttpServletRequest
import org.springframework.http.ResponseEntity
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*
import java.time.Instant

data class AppSettingItem(
    val packageName: String,
    val appName: String,
    val enabled: Boolean,
    val isSystemApp: Boolean,
    val appIconUrl: String?,
    val updatedAt: Long,
)

data class SyncAppSettingsRequest(
    val settings: List<AppSettingItem>,
)

data class SyncAppSettingsResponse(
    val created: Int,
    val updated: Int,
)

data class UploadAppIconRequest(
    val packageName: String,
    val appName: String,
    val iconBase64: String,
)

data class UploadAppIconResponse(
    val packageName: String,
    val appIconUrl: String?,
)

@RestController
@RequestMapping("/app-settings")
class AppSettingController(
    private val appSettingRepository: AppSettingRepository,
    private val s3IconService: S3IconService,
) {

    @GetMapping
    fun getAppSettings(httpRequest: HttpServletRequest): ResponseEntity<List<AppSettingItem>> {
        val user = httpRequest.getAttribute(ClerkAuthFilter.USER_ATTRIBUTE) as User
        val settings = appSettingRepository.findByUser(user).map { it.toItem() }
        return ResponseEntity.ok(settings)
    }

    @PutMapping("/sync")
    @Transactional
    fun syncAppSettings(
        @RequestBody request: SyncAppSettingsRequest,
        httpRequest: HttpServletRequest,
    ): ResponseEntity<SyncAppSettingsResponse> {
        val user = httpRequest.getAttribute(ClerkAuthFilter.USER_ATTRIBUTE) as User
        var created = 0
        var updated = 0

        for (item in request.settings) {
            val existing = appSettingRepository.findByUserAndPackageName(user, item.packageName)
            if (existing != null) {
                val incomingUpdatedAt = Instant.ofEpochMilli(item.updatedAt)
                if (incomingUpdatedAt.isAfter(existing.updatedAt)) {
                    existing.enabled = item.enabled
                    existing.isSystemApp = item.isSystemApp
                    // Don't clobber a previously uploaded icon URL with null.
                    if (item.appIconUrl != null) existing.appIconUrl = item.appIconUrl
                    existing.updatedAt = incomingUpdatedAt
                    appSettingRepository.save(existing)
                    updated++
                }
            } else {
                appSettingRepository.save(
                    AppSetting(
                        user = user,
                        packageName = item.packageName,
                        appName = item.appName,
                        enabled = item.enabled,
                        isSystemApp = item.isSystemApp,
                        appIconUrl = item.appIconUrl,
                        updatedAt = Instant.ofEpochMilli(item.updatedAt),
                    )
                )
                created++
            }
        }

        return ResponseEntity.ok(SyncAppSettingsResponse(created = created, updated = updated))
    }

    /**
     * Uploads the app icon to S3 and persists the resulting URL on the user's
     * AppSetting row (creating one as enabled=true if missing). Returns the
     * URL so the device can store it locally and the next sync round-trip
     * stays consistent.
     */
    @PostMapping("/upload-icon")
    @Transactional
    fun uploadAppIcon(
        @RequestBody request: UploadAppIconRequest,
        httpRequest: HttpServletRequest,
    ): ResponseEntity<UploadAppIconResponse> {
        val user = httpRequest.getAttribute(ClerkAuthFilter.USER_ATTRIBUTE) as User
        val url = s3IconService.uploadAppIcon(request.packageName, request.iconBase64)

        val existing = appSettingRepository.findByUserAndPackageName(user, request.packageName)
        if (existing != null) {
            if (url != null) existing.appIconUrl = url
            existing.enabled = true
            existing.updatedAt = Instant.now()
            appSettingRepository.save(existing)
        } else {
            appSettingRepository.save(
                AppSetting(
                    user = user,
                    packageName = request.packageName,
                    appName = request.appName,
                    enabled = true,
                    isSystemApp = false,
                    appIconUrl = url,
                    updatedAt = Instant.now(),
                )
            )
        }

        return ResponseEntity.ok(UploadAppIconResponse(packageName = request.packageName, appIconUrl = url))
    }

    private fun AppSetting.toItem() = AppSettingItem(
        packageName = packageName,
        appName = appName,
        enabled = enabled,
        isSystemApp = isSystemApp,
        appIconUrl = appIconUrl,
        updatedAt = updatedAt.toEpochMilli(),
    )
}
