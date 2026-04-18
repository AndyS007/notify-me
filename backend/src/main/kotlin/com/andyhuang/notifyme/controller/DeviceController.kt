package com.andyhuang.notifyme.controller

import com.andyhuang.notifyme.entity.Device
import com.andyhuang.notifyme.entity.User
import com.andyhuang.notifyme.filter.ClerkAuthFilter
import com.andyhuang.notifyme.repository.DeviceRepository
import jakarta.servlet.http.HttpServletRequest
import org.springframework.http.ResponseEntity
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.time.Instant
import java.util.UUID

data class RegisterDeviceRequest(
    val deviceId: String,
    val deviceName: String?,
    val brand: String?,
    val model: String?,
    val osName: String?,
    val osVersion: String?,
    val appVersion: String?,
    val expoPushToken: String? = null,
    val platform: String? = null,
)

data class RegisterDeviceResponse(
    val id: String,
    val deviceId: String,
    val deviceName: String?,
    val brand: String?,
    val model: String?,
    val osName: String?,
    val osVersion: String?,
    val appVersion: String?,
    val expoPushToken: String?,
    val platform: String?,
    val pushEnabled: Boolean,
)

data class DeviceResponse(
    val id: String,
    val deviceId: String,
    val deviceName: String?,
    val brand: String?,
    val model: String?,
    val osName: String?,
    val osVersion: String?,
    val appVersion: String?,
    val expoPushToken: String?,
    val platform: String?,
    val pushEnabled: Boolean,
    val createdAt: String,
    val updatedAt: String,
)

data class UpdateDeviceRequest(
    val pushEnabled: Boolean? = null,
)

@RestController
@RequestMapping("/devices")
class DeviceController(
    private val deviceRepository: DeviceRepository
) {

    @GetMapping
    fun listDevices(httpRequest: HttpServletRequest): ResponseEntity<List<DeviceResponse>> {
        val user = httpRequest.getAttribute(ClerkAuthFilter.USER_ATTRIBUTE) as User
        val devices = deviceRepository.findByUser(user).map { it.toResponse() }
        return ResponseEntity.ok(devices)
    }

    @PostMapping("/register")
    fun registerDevice(
        @RequestBody request: RegisterDeviceRequest,
        httpRequest: HttpServletRequest
    ): ResponseEntity<RegisterDeviceResponse> {
        val user = httpRequest.getAttribute(ClerkAuthFilter.USER_ATTRIBUTE) as User

        val device = deviceRepository.findByUserAndDeviceId(user, request.deviceId)
            ?.also {
                it.expoPushToken = request.expoPushToken ?: it.expoPushToken
                it.platform = request.platform ?: it.platform
                it.updatedAt = Instant.now()
                deviceRepository.save(it)
            }
            ?: deviceRepository.save(
                Device(
                    user = user,
                    deviceId = request.deviceId,
                    deviceName = request.deviceName,
                    brand = request.brand,
                    model = request.model,
                    osName = request.osName,
                    osVersion = request.osVersion,
                    appVersion = request.appVersion,
                    expoPushToken = request.expoPushToken,
                    platform = request.platform,
                )
            )

        return ResponseEntity.ok(
            RegisterDeviceResponse(
                id = device.id.toString(),
                deviceId = device.deviceId,
                deviceName = device.deviceName,
                brand = device.brand,
                model = device.model,
                osName = device.osName,
                osVersion = device.osVersion,
                appVersion = device.appVersion,
                expoPushToken = device.expoPushToken,
                platform = device.platform,
                pushEnabled = device.pushEnabled,
            )
        )
    }

    @PatchMapping("/{id}")
    @Transactional
    fun updateDevice(
        @PathVariable id: UUID,
        @RequestBody request: UpdateDeviceRequest,
        httpRequest: HttpServletRequest,
    ): ResponseEntity<DeviceResponse> {
        val user = httpRequest.getAttribute(ClerkAuthFilter.USER_ATTRIBUTE) as User
        val device = deviceRepository.findById(id).orElse(null)
            ?: return ResponseEntity.notFound().build()

        if (device.user.id != user.id) {
            return ResponseEntity.notFound().build()
        }

        request.pushEnabled?.let { device.pushEnabled = it }
        device.updatedAt = Instant.now()
        deviceRepository.save(device)

        return ResponseEntity.ok(device.toResponse())
    }

    private fun Device.toResponse() = DeviceResponse(
        id = id.toString(),
        deviceId = deviceId,
        deviceName = deviceName,
        brand = brand,
        model = model,
        osName = osName,
        osVersion = osVersion,
        appVersion = appVersion,
        expoPushToken = expoPushToken,
        platform = platform,
        pushEnabled = pushEnabled,
        createdAt = createdAt.toString(),
        updatedAt = updatedAt.toString(),
    )
}
