package com.andyhuang.notifyme.repository

import com.andyhuang.notifyme.entity.Device
import com.andyhuang.notifyme.entity.SmsMessage
import com.andyhuang.notifyme.entity.User
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.util.UUID

interface SmsMessageRepository : JpaRepository<SmsMessage, UUID> {

    fun findByUser(user: User, pageable: Pageable): Page<SmsMessage>

    fun findByUserAndAddress(user: User, address: String, pageable: Pageable): Page<SmsMessage>

    fun findByIdAndUser(id: UUID, user: User): SmsMessage?

    fun deleteByIdAndUser(id: UUID, user: User): Long

    fun deleteByUser(user: User): Long

    fun deleteByUserAndAddress(user: User, address: String): Long

    @Query(
        """
        SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END
        FROM SmsMessage s
        WHERE s.user = :user
          AND s.address = :address
          AND s.timestamp = :timestamp
          AND (s.device = :device OR (s.device IS NULL AND :device IS NULL))
        """
    )
    fun existsByNaturalKey(user: User, device: Device?, address: String, timestamp: Long): Boolean
}
