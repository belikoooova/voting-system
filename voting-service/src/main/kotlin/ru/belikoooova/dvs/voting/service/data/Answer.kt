package ru.belikoooova.dvs.voting.service.data

import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import org.springframework.data.domain.Persistable
import org.springframework.data.jpa.repository.JpaRepository
import java.time.Instant
import java.util.*

@Entity
@Table(name = "answer")
class Answer(
    @Id
    @JvmField
    val id: UUID? = null,
    val votingId: UUID,
    val optionText: String,
    val createdAt: Instant = Instant.now(),
    var lastUpdatedAt: Instant = Instant.now()
) : Persistable<UUID> {

    override fun getId(): UUID? = id

    override fun isNew(): Boolean = id == null
}

interface AnswerRepository : JpaRepository<Answer, UUID>