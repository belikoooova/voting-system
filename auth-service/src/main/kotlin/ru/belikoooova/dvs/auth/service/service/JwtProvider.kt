package ru.belikoooova.dvs.auth.service.service

import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import io.jsonwebtoken.security.SignatureException
import jakarta.annotation.PostConstruct
import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.stereotype.Service
import ru.belikoooova.dvs.auth.service.logger
import java.security.Key
import java.util.*

@Service
class JwtProvider(private val jwtTokenProperties: JwtTokenProperties) {
    private var log = logger()
    private lateinit var key: Key

    @PostConstruct
    private fun setup() {
        key = Keys.hmacShaKeyFor(jwtTokenProperties.secret.toByteArray())
    }

    fun generateToken(userId: String): String {
        val now = System.currentTimeMillis()
        val expiration = Date(now + jwtTokenProperties.timeoutMillis)

        return Jwts.builder()
            .setSubject(userId)
            .setIssuedAt(Date(now))
            .setExpiration(expiration)
            .signWith(key)
            .compact()
    }

    fun validateTokenAndGetUserId(token: String): String? {
        return try {
            val claims = Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)

            claims.body.subject
        } catch (ex: SignatureException) {
            log.error("Error while signature decrypting: $ex")
            null
        } catch (ex: Exception) {
            log.error("Error while token validation: $ex")
            null
        }
    }
}

@ConfigurationProperties(prefix = "jwt")
data class JwtTokenProperties(
    val secret: String,
    val timeoutMillis: Long
)