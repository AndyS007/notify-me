package com.andyhuang.notifyme.filter

import com.andyhuang.notifyme.entity.User
import com.andyhuang.notifyme.repository.UserRepository
import com.clerk.backend_api.helpers.security.AuthenticateRequest
import com.clerk.backend_api.helpers.security.models.AuthenticateRequestOptions
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.beans.factory.annotation.Value
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

@Component
class ClerkAuthFilter(
    private val userRepository: UserRepository,
    @Value("\${clerk.secret-key}") private val clerkSecretKey: String
) : OncePerRequestFilter() {

    companion object {
        const val USER_ATTRIBUTE = "currentUser"
    }

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        val headers = request.headerNames.asIterator().asSequence()
            .associateWith { name -> request.getHeaders(name).toList() }

        val requestState = AuthenticateRequest.authenticateRequest(
            headers,
            AuthenticateRequestOptions.secretKey(clerkSecretKey).build()
        )

        if (requestState.isSignedIn) {
            val clerkUserId = requestState.claims().get().subject

            val user = userRepository.findByClerkUserId(clerkUserId)
                ?: userRepository.save(User(clerkUserId = clerkUserId))

            request.setAttribute(USER_ATTRIBUTE, user)

            val auth = UsernamePasswordAuthenticationToken(user, null, emptyList())
            SecurityContextHolder.getContext().authentication = auth
        }

        filterChain.doFilter(request, response)
    }
}
