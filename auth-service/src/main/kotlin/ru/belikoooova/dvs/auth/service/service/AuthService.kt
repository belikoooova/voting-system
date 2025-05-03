package ru.belikoooova.dvs.auth.service.service

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException
import ru.belikoooova.dvs.auth.service.api.v1.model.AuthResponse
import ru.belikoooova.dvs.auth.service.api.v1.model.LoginRequest
import ru.belikoooova.dvs.auth.service.api.v1.model.MeResponse
import ru.belikoooova.dvs.auth.service.api.v1.model.RegisterRequest
import ru.belikoooova.dvs.auth.service.model.User
import ru.belikoooova.dvs.auth.service.repository.UserRepository
import java.util.*

@Service
class AuthService(
    private val userRepository: UserRepository,
    private val jwtProvider: JwtProvider
) {
    private val passwordEncoder: PasswordEncoder = BCryptPasswordEncoder()

    fun register(registerRequest: RegisterRequest): ResponseEntity<AuthResponse> {
        if (userRepository.findByEmail(registerRequest.email).isPresent) {
            throw ResponseStatusException(HttpStatus.CONFLICT, "User with this email already exists")
        }

        val user = User(
            email = registerRequest.email,
            password = passwordEncoder.encode(registerRequest.password),
            username = registerRequest.username,
            isLegal = registerRequest.isLegal
        )

        val savedUser = userRepository.save(user)
        val token = jwtProvider.generateToken(savedUser.id.toString())

        return ResponseEntity.ok(AuthResponse(token))
    }

    fun login(loginRequest: LoginRequest): ResponseEntity<AuthResponse> {
        val user = userRepository.findByEmail(loginRequest.email)
            .orElseThrow { ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password") }

        if (!passwordEncoder.matches(loginRequest.password, user.password)) {
            throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password")
        }

        val token = jwtProvider.generateToken(user.id.toString())
        return ResponseEntity.ok(AuthResponse(token))
    }

    fun me(userId: UUID): ResponseEntity<MeResponse> {
        val user = userRepository.findById(userId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "User not found") }

        return ResponseEntity.ok(
            MeResponse(
                email = user.email,
                username = user.username,
                isLegal = user.isLegal
            )
        )
    }
}