package ru.belikoooova.dvs.voting.service.service

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.server.ResponseStatusException
import ru.belikoooova.dvs.voting.service.api.v1.model.*
import ru.belikoooova.dvs.voting.service.data.*
import ru.belikoooova.dvs.voting.service.grpc.BlockchainGrpcClient
import ru.belikoooova.dvs.voting.service.grpc.CryptoGrpcClient
import java.time.Instant
import java.util.*

class VotingService(
    private val votePermissionRepository: VotePermissionRepository,
    private val watchPermissionRepository: WatchPermissionRepository,
    private val votingRepository: VotingRepository,
    private val cryptoGrpcClient: CryptoGrpcClient,
    private val blockchainGrpcClient: BlockchainGrpcClient
) {
    fun getVoting(userId: UUID, votingId: UUID): GetVotingResponse =
        votingRepository.findById(votingId).get().mapToRest(
            votePermission = votePermissionRepository.findByUserIdAndVotingId(
                userId,
                votingId
            ),
            watchPermission = watchPermissionRepository.findByUserIdAndVotingId(
                userId,
                votingId
            ),
        )

    fun getVotings(
        userId: UUID,
        filter: VotingFilter
    ): List<GetVotingResponse> =
        votingRepository.findAll().map {
            it.mapToRest(
                votePermission = votePermissionRepository.findByUserIdAndVotingId(
                    userId,
                    it.id!!
                ),
                watchPermission = watchPermissionRepository.findByUserIdAndVotingId(
                    userId,
                    it.id
                ),
            )
        }.filter {
            if (filter.status != null) {
                it.status == filter.status
            } else {
                true
            }
        }.filter {
            if (filter.approvedForVoting != null && filter.approvedForVoting!!) {
                it.votePermission == Permission.APPROVED || it.votePermission == Permission.CREATOR
            } else {
                true
            }
        }.filter {
            if (filter.approvedForWatching != null && filter.approvedForWatching!!) {
                it.watchPermissionQuote == Permission.APPROVED || it.watchPermissionQuote == Permission.CREATOR
            } else {
                true
            }
        }

    fun requestForVote(userId: UUID, votingId: UUID) {
        votePermissionRepository.save(
            VotePermission(
                userId = userId,
                votingId = votingId,
                status = PermissionStatus.REQUESTED
            )
        )
    }

    fun requestForWatch(userId: UUID, votingId: UUID) {
        watchPermissionRepository.save(
            WatchPermission(
                userId = userId,
                votingId = votingId,
                status = PermissionStatus.REQUESTED
            )
        )
    }

    fun vote(
        userId: UUID,
        userVoteToken: UUID,
        votingId: UUID,
        voteSubmissionRequest: VoteSubmissionRequest
    ): VotingTokenResponse {
        val perm = votePermissionRepository
            .findByUserIdAndVotingId(userId, votingId)
            ?: throw ResponseStatusException(
                HttpStatus.BAD_REQUEST, "Permission not found"
            )

        if (perm.status != PermissionStatus.APPROVED) {
            throw ResponseStatusException(
                HttpStatus.FORBIDDEN, "Voting not approved"
            )
        }

        if (perm.isUsed) {
            throw ResponseStatusException(
                HttpStatus.BAD_REQUEST, "This vote token has already been used"
            )
        }

        val (sigOk, sigMsg) = cryptoGrpcClient.checkSign(
            signedPublicKey   = voteSubmissionRequest.signature,
            originalMessage   = voteSubmissionRequest.encryptedVote
        )
        if (!sigOk) {
            throw ResponseStatusException(
                HttpStatus.BAD_REQUEST, "Invalid signature: $sigMsg"
            )
        }

        val (zkOk, zkMsg) = cryptoGrpcClient.checkZeroKnowledgeProof(
            encryptedVote = voteSubmissionRequest.encryptedVote,
            zkProof       = voteSubmissionRequest.zeroKnowledgeProof
        )
        if (!zkOk) {
            throw ResponseStatusException(
                HttpStatus.BAD_REQUEST, "Invalid zero-knowledge proof: $zkMsg"
            )
        }

        val voteToken = blockchainGrpcClient.saveVote(
            voteId            = votingId.toString(),
            userId            = userId.toString(),
            encryptedVote     = voteSubmissionRequest.encryptedVote,
            zeroKnowledgeProof = voteSubmissionRequest.zeroKnowledgeProof
        )

        perm.isUsed = true
        perm.token = voteToken
        perm.lastUpdatedAt = Instant.now()
        votePermissionRepository.save(perm)

        return VotingTokenResponse(
            status = VoteStatus.APPROVED,
            token  = voteToken
        )
    }
}