package ru.belikoooova.dvs.auth.service.model

import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "\"user\"")
data class User @JvmOverloads constructor(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID? = null,

    @Column(nullable = false, unique = true)
    val email: String = "",

    @Column(nullable = false)
    var password: String = "",

    @Column(nullable = false)
    val username: String = "",

    @Column(name = "is_legal", nullable = false)
    val isLegal: Boolean = false,

    @Column(name = "created_at", nullable = false)
    val createdAt: Instant = Instant.now(),

    @Column(name = "last_updated_at", nullable = false)
    var lastUpdatedAt: Instant = Instant.now()
)