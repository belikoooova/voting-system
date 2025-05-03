package ru.belikoooova.dvs.auth.service.service

import org.springframework.http.ResponseEntity
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
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

    fun register(registerRequest: RegisterRequest?): ResponseEntity<AuthResponse> {
        registerRequest ?: return ResponseEntity.badRequest().build()
        if (userRepository.findByEmail(registerRequest.email).isPresent) {
            return ResponseEntity.badRequest().build()
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

    fun login(loginRequest: LoginRequest?): ResponseEntity<AuthResponse> {
        loginRequest ?: return ResponseEntity.badRequest().build()
        val optionalUser = userRepository.findByEmail(loginRequest.email) // todo?
        if (optionalUser.isEmpty) {
            return ResponseEntity.badRequest().build()
        }
        val user = optionalUser.get()

        if (!passwordEncoder.matches(loginRequest.password, user.password)) {
            return ResponseEntity.badRequest().build()
        }

        val token = jwtProvider.generateToken(user.id.toString())
        return ResponseEntity.ok(AuthResponse(token))
    }

    fun me(userId: UUID): ResponseEntity<MeResponse> {
        val optionalUser = userRepository.findById(userId) // todo?
        if (optionalUser.isEmpty) {
            return ResponseEntity.badRequest().build()
        }
        val user = optionalUser.get()

        return ResponseEntity.ok(
            MeResponse(
                email = user.email,
                username = user.username,
                isLegal = user.isLegal
            )
        )
    }
}