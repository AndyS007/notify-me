package com.andyhuang.notifyme.controller

import com.andyhuang.notifyme.entity.AppSetting
import com.andyhuang.notifyme.entity.User
import com.andyhuang.notifyme.filter.ClerkAuthFilter
import com.andyhuang.notifyme.repository.AppSettingRepository
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
    val updatedAt: Long,
)

data class SyncAppSettingsRequest(
    val settings: List<AppSettingItem>,
)

data class SyncAppSettingsResponse(
    val created: Int,
    val updated: Int,
)

@RestController
@RequestMapping("/app-settings")
class AppSettingController(
    private val appSettingRepository: AppSettingRepository,
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
                // Only update if the incoming record is newer
                val incomingUpdatedAt = Instant.ofEpochMilli(item.updatedAt)
                if (incomingUpdatedAt.isAfter(existing.updatedAt)) {
                    existing.enabled = item.enabled
                    existing.isSystemApp = item.isSystemApp
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
                        updatedAt = Instant.ofEpochMilli(item.updatedAt),
                    )
                )
                created++
            }
        }

        return ResponseEntity.ok(SyncAppSettingsResponse(created = created, updated = updated))
    }

    private fun AppSetting.toItem() = AppSettingItem(
        packageName = packageName,
        appName = appName,
        enabled = enabled,
        isSystemApp = isSystemApp,
        updatedAt = updatedAt.toEpochMilli(),
    )
}
