package ru.belikoooova.dvs.auth.service.rest

import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RestController
import ru.belikoooova.dvs.auth.service.api.v1.AuthenticationApi
import ru.belikoooova.dvs.auth.service.api.v1.model.AuthResponse
import ru.belikoooova.dvs.auth.service.api.v1.model.LoginRequest
import ru.belikoooova.dvs.auth.service.api.v1.model.MeResponse
import ru.belikoooova.dvs.auth.service.api.v1.model.RegisterRequest
import ru.belikoooova.dvs.auth.service.service.AuthService
import java.util.*

@RestController
class AuthController(
    private val authService: AuthService
): AuthenticationApi {
    override fun register(registerRequest: RegisterRequest?): ResponseEntity<AuthResponse> =
        authService.register(registerRequest)

    override fun login(loginRequest: LoginRequest?): ResponseEntity<AuthResponse> =
        authService.login(loginRequest)

    override fun me(@RequestHeader(required = false, value = "X-User-Id") xUserId: String?
    ): ResponseEntity<MeResponse> {
        xUserId ?: return ResponseEntity.badRequest().build()
        return authService.me(UUID.fromString(xUserId))
    }
}