package ru.belikoooova.dvs.voting.service.data

import jakarta.persistence.*
import org.springframework.data.domain.Persistable
import org.springframework.data.jpa.repository.JpaRepository
import ru.belikoooova.dvs.voting.service.api.v1.model.GetVotingResponse
import ru.belikoooova.dvs.voting.service.api.v1.model.Permission
import ru.belikoooova.dvs.voting.service.api.v1.model.VotingStatus
import java.time.Instant
import java.util.*

@Entity
@Table(name = "voting")
class Voting(
    @Id
    @JvmField
    val id: UUID? = null,
    val name: String,
    val description: String,
    val question: String,
    val startAt: Instant,
    val endAt: Instant,
    val createdBy: UUID,
    val createdAt: Instant = Instant.now(),
    var lastUpdatedAt: Instant = Instant.now()
) : Persistable<UUID> {

    @OneToMany
    @JoinColumn(name = "voting_id")
    var answers: List<Answer> = emptyList()

    override fun getId(): UUID? = id

    override fun isNew(): Boolean = id == null

    fun mapToRest(votePermission: VotePermission?, watchPermission: WatchPermission?): GetVotingResponse =
        GetVotingResponse(
            id = this.id.toString(),
            name = this.name,
            description = this.description,
            question = this.question,
            answers = this.answers.map { it.mapToRest() }.toMutableList(),
            startDate = this.startAt.toEpochMilli(),
            endDate = this.endAt.toEpochMilli(),
            votePermission = votePermission.mapToRest(),
            watchPermissionQuote = watchPermission.mapToRest(),
            status = this.getStatus()
        )

    private fun Answer.mapToRest(): ru.belikoooova.dvs.voting.service.api.v1.model.Answer =
        ru.belikoooova.dvs.voting.service.api.v1.model.Answer(
            id = this.id.toString(),
            description = this.optionText
        )

    private fun VotePermission?.mapToRest(): Permission? =
        when (this?.status) {
            PermissionStatus.CREATOR -> Permission.CREATOR
            PermissionStatus.REQUESTED -> Permission.REQUESTED
            PermissionStatus.APPROVED -> Permission.APPROVED
            PermissionStatus.REJECTED -> Permission.REJECTED
            null -> null
        }

    private fun WatchPermission?.mapToRest(): Permission? =
        when (this?.status) {
            PermissionStatus.CREATOR -> Permission.CREATOR
            PermissionStatus.REQUESTED -> Permission.REQUESTED
            PermissionStatus.APPROVED -> Permission.APPROVED
            PermissionStatus.REJECTED -> Permission.REJECTED
            null -> null
        }

    private fun Voting.getStatus(): VotingStatus {
        val now = System.currentTimeMillis()
        return when {
            now < this.startAt.toEpochMilli() -> VotingStatus.NOT_STARTED
            now > this.endAt.toEpochMilli() -> VotingStatus.FINISHED
            else -> VotingStatus.IN_PROGRESS
        }
    }
}

interface VotingRepository : JpaRepository<Voting, UUID> {
    fun findAllByCreatedBy(userId: UUID): List<Voting>
}
