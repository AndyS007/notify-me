package com.andyhuang.notifyme.entity

import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

@Entity
@Table(
    name = "app_settings",
    uniqueConstraints = [
        UniqueConstraint(
            name = "uk_app_setting_user_pkg",
            columnNames = ["user_id", "package_name"]
        )
    ]
)
class AppSetting(
    @Id
    val id: UUID = UUID.randomUUID(),

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    val user: User,

    @Column(name = "package_name", nullable = false)
    val packageName: String,

    @Column(name = "app_name", nullable = false)
    val appName: String = "",

    @Column(name = "enabled", nullable = false)
    var enabled: Boolean = true,

    @Column(name = "is_system_app", nullable = false)
    var isSystemApp: Boolean = false,

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now()
)
