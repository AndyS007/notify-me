package com.andyhuang.notifyme.repository

import com.andyhuang.notifyme.entity.Device
import com.andyhuang.notifyme.entity.User
import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface DeviceRepository : JpaRepository<Device, UUID> {
    fun findByUserAndDeviceId(user: User, deviceId: String): Device?
}
