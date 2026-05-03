package com.andyhuang.notifyme.service

import org.slf4j.LoggerFactory
import org.springframework.boot.CommandLineRunner
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component

/**
 * One-shot helper that wipes every notification on startup. Intended for
 * cutting over to the new sync schema where keeping the existing rows
 * around (with revision=0 and missing client UUIDs) would just confuse
 * pull/push semantics.
 *
 * Gated by `notifyme.notifications.purge=true` so it never fires
 * accidentally — flip the env var on for the deploy that needs it, then
 * remove it. The runner itself is idempotent (TRUNCATE on an empty table is
 * a no-op) but should not be left enabled in steady state.
 */
@Component
@ConditionalOnProperty(name = ["notifyme.notifications.purge"], havingValue = "true")
class NotificationsPurgeRunner(
    private val jdbcTemplate: JdbcTemplate,
) : CommandLineRunner {

    private val log = LoggerFactory.getLogger(javaClass)

    override fun run(vararg args: String) {
        log.warn("notifyme.notifications.purge=true — wiping notifications table")
        jdbcTemplate.execute("TRUNCATE TABLE notifications")
        // Reset the sync cursor so newly-inserted rows start at revision 1.
        // `IF EXISTS` keeps this safe on a brand-new database where the
        // sequence hasn't been created yet.
        jdbcTemplate.execute(
            "ALTER SEQUENCE IF EXISTS notification_revision_seq RESTART WITH 1"
        )
        log.warn("notifications table cleared and revision sequence reset")
    }
}
