package com.andyhuang.notifyme.service

import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider
import software.amazon.awssdk.core.sync.RequestBody
import software.amazon.awssdk.regions.Region
import software.amazon.awssdk.services.s3.S3Client
import software.amazon.awssdk.services.s3.model.PutObjectRequest
import java.util.Base64

@Service
class S3IconService(
    @Value("\${aws.s3.bucket:}") private val bucket: String,
    @Value("\${aws.s3.region:}") private val region: String,
    @Value("\${aws.s3.access-key-id:}") private val accessKeyId: String,
    @Value("\${aws.s3.secret-access-key:}") private val secretAccessKey: String,
    @Value("\${aws.s3.public-url-base:}") private val publicUrlBase: String,
) {
    private val log = LoggerFactory.getLogger(javaClass)

    private val client: S3Client? by lazy {
        if (bucket.isBlank() || region.isBlank() || accessKeyId.isBlank() || secretAccessKey.isBlank()) {
            log.warn("S3 credentials not configured — icon uploads will return null URLs.")
            null
        } else {
            S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(
                    StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKeyId, secretAccessKey)
                    )
                )
                .build()
        }
    }

    /**
     * Uploads a base64-encoded PNG app icon under `app-icons/<packageName>.png`
     * and returns the public URL. Returns null when S3 isn't configured so the
     * caller can still persist the setting without blocking on infra.
     */
    fun uploadAppIcon(packageName: String, iconBase64: String): String? {
        val s3 = client ?: return null

        val bytes = try {
            Base64.getDecoder().decode(iconBase64.substringAfter(','))
        } catch (e: IllegalArgumentException) {
            log.warn("Invalid base64 for icon {}: {}", packageName, e.message)
            return null
        }

        val key = "app-icons/$packageName.png"
        s3.putObject(
            PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .contentType("image/png")
                .build(),
            RequestBody.fromBytes(bytes),
        )

        return if (publicUrlBase.isNotBlank()) {
            "${publicUrlBase.trimEnd('/')}/$key"
        } else {
            "https://$bucket.s3.$region.amazonaws.com/$key"
        }
    }
}
