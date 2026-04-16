package com.andyhuang.notifyme.repository

import com.andyhuang.notifyme.entity.AppSetting
import com.andyhuang.notifyme.entity.User
import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface AppSettingRepository : JpaRepository<AppSetting, UUID> {
    fun findByUser(user: User): List<AppSetting>
    fun findByUserAndPackageName(user: User, packageName: String): AppSetting?
}
