package com.andyhuang.notifyme.repository

import com.andyhuang.notifyme.entity.Device
import com.andyhuang.notifyme.entity.Notification
import com.andyhuang.notifyme.entity.User
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.util.UUID

interface NotificationRepository : JpaRepository<Notification, UUID> {

    fun findByUser(user: User, pageable: Pageable): Page<Notification>

    fun findByUserAndPackageName(user: User, packageName: String, pageable: Pageable): Page<Notification>

    fun findByIdAndUser(id: UUID, user: User): Notification?

    fun deleteByIdAndUser(id: UUID, user: User): Long

    fun deleteByUser(user: User): Long

    fun deleteByUserAndPackageName(user: User, packageName: String): Long

    @Query(
        """
        SELECT CASE WHEN COUNT(n) > 0 THEN true ELSE false END
        FROM Notification n
        WHERE n.user = :user
          AND n.packageName = :packageName
          AND n.timestamp = :timestamp
          AND (n.device = :device OR (n.device IS NULL AND :device IS NULL))
        """
    )
    fun existsByNaturalKey(user: User, device: Device?, packageName: String, timestamp: Long): Boolean
}
