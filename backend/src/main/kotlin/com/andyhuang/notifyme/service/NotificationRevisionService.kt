package com.andyhuang.notifyme.service

import jakarta.annotation.PostConstruct
import jakarta.persistence.EntityManager
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

/**
 * Hands out monotonic, globally-unique revision numbers from a Postgres
 * sequence. Sync clients use these as cursors: each pull asks for
 * `revision > lastSeen` and the server returns rows in revision order.
 *
 * Hibernate's `ddl-auto=update` won't create a free-standing sequence, so we
 * ensure it exists ourselves on startup.
 */
@Service
class NotificationRevisionService(
    private val entityManager: EntityManager,
) {

    @PostConstruct
    @Transactional
    fun ensureSequence() {
        entityManager
            .createNativeQuery("CREATE SEQUENCE IF NOT EXISTS notification_revision_seq START 1")
            .executeUpdate()
    }

    /**
     * Returns the next revision value, atomically. Postgres sequences hand
     * out distinct, monotonically increasing numbers to concurrent callers,
     * which is exactly what sync cursors need.
     */
    @Transactional
    fun next(): Long {
        val result = entityManager
            .createNativeQuery("SELECT nextval('notification_revision_seq')")
            .singleResult
        return (result as Number).toLong()
    }

    /**
     * Reads the current sequence head without advancing it. Used by the
     * pull endpoint to return `serverRevision` so a client that just drained
     * the stream knows where to resume from.
     */
    @Transactional(readOnly = true)
    fun peek(): Long {
        val result = entityManager
            .createNativeQuery("SELECT last_value FROM notification_revision_seq")
            .singleResult
        return (result as Number).toLong()
    }
}
