package com.andyhuang.notifyme.repository

import com.andyhuang.notifyme.entity.User
import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface UserRepository : JpaRepository<User, UUID> {
    fun findByClerkUserId(clerkUserId: String): User?
}
