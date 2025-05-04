package ru.belikoooova.dvs.voting.service.data

import jakarta.persistence.*
import org.springframework.data.domain.Persistable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.time.Instant
import java.util.*

@Entity
@Table(name = "answer")
class Answer(
    @Id
    @JvmField
    @GeneratedValue
    @Column(columnDefinition = "uuid", updatable = false)
    val id: UUID? = null,
    @Column(name = "voting_id")
    val votingId: UUID,
    val optionText: String,
    val createdAt: Instant = Instant.now(),
    var lastUpdatedAt: Instant = Instant.now()
) : Persistable<UUID> {

    override fun getId(): UUID? = id

    override fun isNew(): Boolean = id == null
}

@Repository
interface AnswerRepository : JpaRepository<Answer, UUID> {
    fun deleteAllByVotingId(votingId: UUID)
}