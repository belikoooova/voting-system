package ru.belikoooova.dvs.voting.service.data

import jakarta.persistence.*
import org.springframework.data.domain.Persistable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.Instant
import java.util.*

@Entity
@Table(name = "vote_permission")
class VotePermission(
    @Id
    @JvmField
    @GeneratedValue
    @Column(columnDefinition = "uuid", updatable = false)
    val id: UUID? = null,
    val userId: UUID,
    val votingId: UUID,
    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "text", nullable = false)
    var status: PermissionStatus,
    var token: String? = null,
    val createdAt: Instant = Instant.now(),
    var lastUpdatedAt: Instant = Instant.now(),
    var isUsed: Boolean = false
) : Persistable<UUID> {

    override fun getId(): UUID? = id

    override fun isNew(): Boolean = id == null
}

@Entity
@Table(name = "watch_permission")
class WatchPermission(
    @Id
    @JvmField
    @GeneratedValue
    @Column(columnDefinition = "uuid", updatable = false)
    val id: UUID? = null,
    val userId: UUID,
    val votingId: UUID,
    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "text", nullable = false)
    var status: PermissionStatus,
    val createdAt: Instant = Instant.now(),
    var lastUpdatedAt: Instant = Instant.now()
) : Persistable<UUID> {

    override fun getId(): UUID? = id

    override fun isNew(): Boolean = id == null
}

enum class PermissionStatus {
    CREATOR, REQUESTED, APPROVED, REJECTED
}

@Repository
interface VotePermissionRepository : JpaRepository<VotePermission, UUID> {
    fun findByUserIdAndVotingId(userId: UUID, votingId: UUID): VotePermission?

    @Query("""
        SELECT vp
        FROM VotePermission vp
        JOIN Voting v
            ON vp.votingId = v.id
        WHERE v.createdBy = :creator
        AND vp.status = ru.belikoooova.dvs.voting.service.data.PermissionStatus.REQUESTED
        """) 
    fun findAllNonAnsweredVoteRequestsByVotingCreator(
        @Param("creator") creator: UUID
    ): List<VotePermission>
}

@Repository
interface WatchPermissionRepository : JpaRepository<WatchPermission, UUID> {
    fun findByUserIdAndVotingId(userId: UUID, votingId: UUID): WatchPermission?

    @Query("""
        SELECT wp
            FROM WatchPermission wp
            JOIN Voting v
            ON wp.votingId = v.id
            WHERE v.createdBy = :creator
            AND wp.status = ru.belikoooova.dvs.voting.service.data.PermissionStatus.REQUESTED
        """)
    fun findAllNonAnsweredWatchRequestsByCreator(
        @Param("creator") creator: UUID
    ): List<WatchPermission>
}