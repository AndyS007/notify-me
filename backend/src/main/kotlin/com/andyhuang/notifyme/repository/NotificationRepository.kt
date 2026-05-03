package com.andyhuang.notifyme.repository

import com.andyhuang.notifyme.entity.Notification
import com.andyhuang.notifyme.entity.User
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.util.UUID

interface NotificationRepository : JpaRepository<Notification, UUID> {

    fun findByIdAndUser(id: UUID, user: User): Notification?

    /**
     * Incremental sync: items the client hasn't seen yet, in insertion order
     * so the client can advance its cursor monotonically.
     */
    @Query(
        """
        SELECT n FROM Notification n
        WHERE n.user = :user AND n.revision > :since
        ORDER BY n.revision ASC
        """
    )
    fun findByUserSinceRevision(
        user: User,
        since: Long,
        pageable: Pageable,
    ): List<Notification>

    /**
     * Bootstrap sync: items older than the given revision, newest first, so a
     * fresh device can populate its UI starting from the most recent
     * notifications and page backwards through history.
     */
    @Query(
        """
        SELECT n FROM Notification n
        WHERE n.user = :user AND n.revision < :before
        ORDER BY n.revision DESC
        """
    )
    fun findByUserBeforeRevision(
        user: User,
        before: Long,
        pageable: Pageable,
    ): List<Notification>

    /** Count of non-deleted items per package, used by the apps summary. */
    @Query(
        """
        SELECT n.packageName, COUNT(n) FROM Notification n
        WHERE n.user = :user
          AND n.deletedAt IS NULL
          AND n.packageName IN :packageNames
        GROUP BY n.packageName
        """
    )
    fun countByUserGroupedByPackageNames(user: User, packageNames: Collection<String>): List<Array<Any>>

    /** Latest non-deleted notification per app for the chat-list view. */
    @Query(
        """
        SELECT n FROM Notification n
        WHERE n.user = :user
          AND n.deletedAt IS NULL
          AND n.timestamp = (
              SELECT MAX(n2.timestamp) FROM Notification n2
              WHERE n2.user = :user
                AND n2.packageName = n.packageName
                AND n2.deletedAt IS NULL
          )
          AND n.id = (
              SELECT MIN(n3.id) FROM Notification n3
              WHERE n3.user = :user
                AND n3.packageName = n.packageName
                AND n3.timestamp = n.timestamp
                AND n3.deletedAt IS NULL
          )
        ORDER BY n.timestamp DESC
        """,
        countQuery = """
        SELECT COUNT(DISTINCT n.packageName) FROM Notification n
        WHERE n.user = :user AND n.deletedAt IS NULL
        """,
    )
    fun findLatestPerApp(
        user: User,
        pageable: Pageable,
    ): org.springframework.data.domain.Page<Notification>
}
