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
          AND n.device = :device
          AND n.packageName = :packageName
          AND n.timestamp = :timestamp
        """
    )
    fun existsByNaturalKey(user: User, device: Device, packageName: String, timestamp: Long): Boolean

    /**
     * For the notifications "chat list" view: returns one row per packageName for
     * the given user, choosing the row with the highest timestamp (ties broken by
     * id to stay deterministic). Pageable controls page/size; ordering is fixed
     * by latest timestamp DESC inside the query.
     */
    @Query(
        """
        SELECT n FROM Notification n
        WHERE n.user = :user
          AND n.timestamp = (
              SELECT MAX(n2.timestamp) FROM Notification n2
              WHERE n2.user = :user AND n2.packageName = n.packageName
          )
          AND n.id = (
              SELECT MIN(n3.id) FROM Notification n3
              WHERE n3.user = :user
                AND n3.packageName = n.packageName
                AND n3.timestamp = n.timestamp
          )
        ORDER BY n.timestamp DESC
        """,
        countQuery = """
        SELECT COUNT(DISTINCT n.packageName) FROM Notification n
        WHERE n.user = :user
        """
    )
    fun findLatestPerApp(user: User, pageable: Pageable): Page<Notification>

    /**
     * Returns total notification count grouped by packageName for the given user.
     * Used to attach per-app counts to the apps list.
     */
    @Query(
        """
        SELECT n.packageName, COUNT(n) FROM Notification n
        WHERE n.user = :user AND n.packageName IN :packageNames
        GROUP BY n.packageName
        """
    )
    fun countByUserGroupedByPackageNames(user: User, packageNames: Collection<String>): List<Array<Any>>
}
