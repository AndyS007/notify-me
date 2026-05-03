package com.andyhuang.notifyme.service

import jakarta.annotation.PostConstruct
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Service

/**
 * Hands out monotonic, globally-unique revision numbers from a Postgres
 * sequence. Sync clients use these as cursors: each pull asks for
 * `revision > lastSeen` and the server returns rows in revision order.
 *
 * Hibernate's `ddl-auto=update` won't create a free-standing sequence, so
 * we ensure it exists ourselves on startup. We use [JdbcTemplate] (not
 * [jakarta.persistence.EntityManager]) so the call doesn't need an outer
 * transaction — `@Transactional` doesn't apply to `@PostConstruct` methods
 * because the AOP proxy isn't in play yet at init time.
 */
@Service
class NotificationRevisionService(
    private val jdbcTemplate: JdbcTemplate,
) {

    @PostConstruct
    fun ensureSequence() {
        jdbcTemplate.execute(
            "CREATE SEQUENCE IF NOT EXISTS notification_revision_seq START 1"
        )
    }

    /**
     * Returns the next revision value, atomically. Postgres sequences hand
     * out distinct, monotonically increasing numbers to concurrent callers,
     * which is exactly what sync cursors need.
     */
    fun next(): Long =
        jdbcTemplate.queryForObject(
            "SELECT nextval('notification_revision_seq')",
            Long::class.java,
        ) ?: 0L

    /**
     * Reads the current sequence head without advancing it. Used by the
     * pull endpoint to return `serverRevision` so a client that just drained
     * the stream knows where to resume from.
     */
    fun peek(): Long =
        jdbcTemplate.queryForObject(
            "SELECT last_value FROM notification_revision_seq",
            Long::class.java,
        ) ?: 0L
}
