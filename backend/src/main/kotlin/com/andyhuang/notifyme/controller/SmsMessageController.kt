package com.andyhuang.notifyme.controller

import com.andyhuang.notifyme.entity.SmsMessage
import com.andyhuang.notifyme.entity.User
import com.andyhuang.notifyme.filter.ClerkAuthFilter
import com.andyhuang.notifyme.repository.DeviceRepository
import com.andyhuang.notifyme.repository.SmsMessageRepository
import jakarta.servlet.http.HttpServletRequest
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*
import java.util.UUID

// ---- DTOs ----

data class CreateSmsRequest(
    val deviceId: String? = null,
    val address: String,
    val body: String,
    val timestamp: Long,
)

data class BatchCreateSmsRequest(
    val messages: List<CreateSmsRequest>,
)

data class SmsResponse(
    val id: String,
    val deviceId: String?,
    val address: String,
    val body: String,
    val timestamp: Long,
    val createdAt: String,
    val updatedAt: String,
)

data class BatchCreateSmsResponse(
    val created: Int,
    val duplicates: Int,
)

data class DeleteSmsResponse(
    val deleted: Long,
)

data class SmsPageResponse(
    val content: List<SmsResponse>,
    val page: Int,
    val size: Int,
    val totalElements: Long,
    val totalPages: Int,
)

// ---- Controller ----

@RestController
@RequestMapping("/sms")
class SmsMessageController(
    private val smsRepository: SmsMessageRepository,
    private val deviceRepository: DeviceRepository,
) {

    // POST /sms — create single SMS
    @PostMapping
    fun createSms(
        @RequestBody request: CreateSmsRequest,
        httpRequest: HttpServletRequest,
    ): ResponseEntity<SmsResponse> {
        val user = httpRequest.getAttribute(ClerkAuthFilter.USER_ATTRIBUTE) as User
        val device = request.deviceId?.let { deviceRepository.findByUserAndDeviceId(user, it) }

        if (smsRepository.existsByNaturalKey(user, device, request.address, request.timestamp)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build()
        }

        val sms = smsRepository.save(
            SmsMessage(
                user = user,
                device = device,
                address = request.address,
                body = request.body,
                timestamp = request.timestamp,
            )
        )

        return ResponseEntity.status(HttpStatus.CREATED).body(sms.toResponse())
    }

    // POST /sms/batch — batch sync
    @PostMapping("/batch")
    @Transactional
    fun batchCreateSms(
        @RequestBody request: BatchCreateSmsRequest,
        httpRequest: HttpServletRequest,
    ): ResponseEntity<BatchCreateSmsResponse> {
        val user = httpRequest.getAttribute(ClerkAuthFilter.USER_ATTRIBUTE) as User
        var created = 0
        var duplicates = 0

        for (item in request.messages) {
            val device = item.deviceId?.let { deviceRepository.findByUserAndDeviceId(user, it) }

            if (smsRepository.existsByNaturalKey(user, device, item.address, item.timestamp)) {
                duplicates++
                continue
            }

            smsRepository.save(
                SmsMessage(
                    user = user,
                    device = device,
                    address = item.address,
                    body = item.body,
                    timestamp = item.timestamp,
                )
            )
            created++
        }

        return ResponseEntity.ok(BatchCreateSmsResponse(created = created, duplicates = duplicates))
    }

    // GET /sms — paginated list
    @GetMapping
    fun listSms(
        @RequestParam(required = false) address: String?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "50") size: Int,
        httpRequest: HttpServletRequest,
    ): ResponseEntity<SmsPageResponse> {
        val user = httpRequest.getAttribute(ClerkAuthFilter.USER_ATTRIBUTE) as User
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"))

        val result = if (address != null) {
            smsRepository.findByUserAndAddress(user, address, pageable)
        } else {
            smsRepository.findByUser(user, pageable)
        }

        return ResponseEntity.ok(
            SmsPageResponse(
                content = result.content.map { it.toResponse() },
                page = result.number,
                size = result.size,
                totalElements = result.totalElements,
                totalPages = result.totalPages,
            )
        )
    }

    // GET /sms/{id} — single SMS
    @GetMapping("/{id}")
    fun getSms(
        @PathVariable id: UUID,
        httpRequest: HttpServletRequest,
    ): ResponseEntity<SmsResponse> {
        val user = httpRequest.getAttribute(ClerkAuthFilter.USER_ATTRIBUTE) as User
        val sms = smsRepository.findByIdAndUser(id, user)
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(sms.toResponse())
    }

    // DELETE /sms/{id} — delete single
    @DeleteMapping("/{id}")
    @Transactional
    fun deleteSms(
        @PathVariable id: UUID,
        httpRequest: HttpServletRequest,
    ): ResponseEntity<Void> {
        val user = httpRequest.getAttribute(ClerkAuthFilter.USER_ATTRIBUTE) as User
        val deleted = smsRepository.deleteByIdAndUser(id, user)
        return if (deleted > 0) ResponseEntity.noContent().build()
        else ResponseEntity.notFound().build()
    }

    // DELETE /sms — bulk delete
    @DeleteMapping
    @Transactional
    fun deleteSmsBulk(
        @RequestParam(required = false) address: String?,
        httpRequest: HttpServletRequest,
    ): ResponseEntity<DeleteSmsResponse> {
        val user = httpRequest.getAttribute(ClerkAuthFilter.USER_ATTRIBUTE) as User
        val deleted = if (address != null) {
            smsRepository.deleteByUserAndAddress(user, address)
        } else {
            smsRepository.deleteByUser(user)
        }
        return ResponseEntity.ok(DeleteSmsResponse(deleted = deleted))
    }

    private fun SmsMessage.toResponse() = SmsResponse(
        id = id.toString(),
        deviceId = device?.deviceId,
        address = address,
        body = body,
        timestamp = timestamp,
        createdAt = createdAt.toString(),
        updatedAt = updatedAt.toString(),
    )
}
