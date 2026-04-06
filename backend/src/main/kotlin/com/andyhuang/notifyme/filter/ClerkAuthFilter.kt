package com.andyhuang.notifyme.filter

import com.andyhuang.notifyme.entity.User
import com.andyhuang.notifyme.repository.UserRepository
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

@Component
class ClerkAuthFilter(
    private val userRepository: UserRepository
) : OncePerRequestFilter() {

    companion object {
        const val USER_ATTRIBUTE = "currentUser"
    }

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        val authentication = SecurityContextHolder.getContext().authentication

        if (authentication is JwtAuthenticationToken) {
            val jwt = authentication.token as Jwt
            val clerkUserId = jwt.subject

            val user = userRepository.findByClerkUserId(clerkUserId)
                ?: userRepository.save(User(clerkUserId = clerkUserId))

            request.setAttribute(USER_ATTRIBUTE, user)
        }

        filterChain.doFilter(request, response)
    }
}
