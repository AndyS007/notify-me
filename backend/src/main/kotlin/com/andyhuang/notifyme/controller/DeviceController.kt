package com.andyhuang.notifyme.controller

import com.andyhuang.notifyme.entity.Device
import com.andyhuang.notifyme.entity.User
import com.andyhuang.notifyme.filter.ClerkAuthFilter
import com.andyhuang.notifyme.repository.DeviceRepository
import jakarta.servlet.http.HttpServletRequest
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.time.Instant

data class RegisterDeviceRequest(
    val deviceId: String,
    val deviceName: String?,
    val brand: String?,
    val model: String?,
    val osName: String?,
    val osVersion: String?,
    val appVersion: String?,
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
    val createdAt: String,
    val updatedAt: String,
)

@RestController
@RequestMapping("/devices")
class DeviceController(
    private val deviceRepository: DeviceRepository
) {

    @GetMapping
    fun listDevices(httpRequest: HttpServletRequest): ResponseEntity<List<DeviceResponse>> {
        val user = httpRequest.getAttribute(ClerkAuthFilter.USER_ATTRIBUTE) as User
        val devices = deviceRepository.findByUser(user).map { device ->
            DeviceResponse(
                id = device.id.toString(),
                deviceId = device.deviceId,
                deviceName = device.deviceName,
                brand = device.brand,
                model = device.model,
                osName = device.osName,
                osVersion = device.osVersion,
                appVersion = device.appVersion,
                createdAt = device.createdAt.toString(),
                updatedAt = device.updatedAt.toString(),
            )
        }
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
            )
        )
    }
}
