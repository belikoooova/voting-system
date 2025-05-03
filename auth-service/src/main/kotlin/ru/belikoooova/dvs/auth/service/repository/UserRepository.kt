package ru.belikoooova.dvs.auth.service.repository

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import ru.belikoooova.dvs.auth.service.model.User
import java.util.Optional
import java.util.UUID

@Repository
interface UserRepository : JpaRepository<User, UUID> {
    fun findByEmail(email: String): Optional<User>
}