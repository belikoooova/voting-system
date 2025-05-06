package ru.belikoooova.dvs.voting.service.service

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import ru.belikoooova.dvs.voting.service.api.v1.model.*
import ru.belikoooova.dvs.voting.service.data.*
import ru.belikoooova.dvs.voting.service.grpc.BlockchainGrpcClient
import ru.belikoooova.dvs.voting.service.grpc.CryptoGrpcClient
import java.time.Instant
import java.util.*

@Service
class VotingService(
    private val votePermissionRepository: VotePermissionRepository,
    private val watchPermissionRepository: WatchPermissionRepository,
    private val votingRepository: VotingRepository,
    private val cryptoGrpcClient: CryptoGrpcClient,
    private val blockchainGrpcClient: BlockchainGrpcClient
) {
    @Transactional
    fun getVoting(userId: UUID, votingId: UUID): GetVotingResponse {
        val voting = votingRepository.findById(votingId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Voting not found") }

        return voting.mapToRest( 
            votePermission = votePermissionRepository.findByUserIdAndVotingId(
                userId,
                votingId
            ),
            watchPermission = watchPermissionRepository.findByUserIdAndVotingId(
                userId,
                votingId
            ),
        )
    }

    @Transactional
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
            if (filter.approvedForVoting != null) {
                if (filter.approvedForVoting!!) {
                    it.votePermission == Permission.APPROVED || it.votePermission == Permission.CREATOR
                } else {
                    it.votePermission == Permission.REJECTED || it.votePermission == Permission.REQUESTED
                }
            } else {
                true
            }
        }.filter {
            if (filter.approvedForWatching != null) {
                if (filter.approvedForWatching!!) {
                    it.watchPermissionQuote == Permission.APPROVED || it.watchPermissionQuote == Permission.CREATOR
                } else {
                    it.watchPermissionQuote == Permission.REJECTED || it.watchPermissionQuote == Permission.REQUESTED
                }
            } else {
                true
            }
        }

    @Transactional
    fun getRequestForVoteStatus(userId: UUID, votingId: UUID): PermissionRequestStatusResponse {
        votingRepository.findById(votingId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Voting not found") }

        val existingPermission = votePermissionRepository.findByUserIdAndVotingId(userId, votingId)
        return if (existingPermission == null) {
            PermissionRequestStatusResponse(
                status = PermissionRequestStatus.NOT_REQUESTED
            )
        } else if (!existingPermission.isUsed) {
            PermissionRequestStatusResponse(
                status = when (existingPermission.status) {
                    PermissionStatus.CREATOR -> PermissionRequestStatus.CREATOR
                    PermissionStatus.REQUESTED -> PermissionRequestStatus.REQUESTED
                    PermissionStatus.APPROVED -> PermissionRequestStatus.APPROVED
                    PermissionStatus.REJECTED -> PermissionRequestStatus.REJECTED
                }
            )
        } else {
            PermissionRequestStatusResponse(status = PermissionRequestStatus.USED)
        }
    }

    @Transactional
    fun getRequestForWatchStatus(userId: UUID, votingId: UUID): PermissionRequestStatusResponse {
        votingRepository.findById(votingId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Voting not found") }

        val existingPermission = watchPermissionRepository.findByUserIdAndVotingId(userId, votingId)
        return if (existingPermission == null) {
            PermissionRequestStatusResponse(
                status = PermissionRequestStatus.NOT_REQUESTED
            )
        } else {
            PermissionRequestStatusResponse(
                status = when (existingPermission.status) {
                    PermissionStatus.CREATOR -> PermissionRequestStatus.CREATOR
                    PermissionStatus.REQUESTED -> PermissionRequestStatus.REQUESTED
                    PermissionStatus.APPROVED -> PermissionRequestStatus.APPROVED
                    PermissionStatus.REJECTED -> PermissionRequestStatus.REJECTED
                }
            )
        }
    }

    @Transactional
    fun requestForVote(userId: UUID, votingId: UUID) {
        val voting = votingRepository.findById(votingId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Voting not found") }

        if (voting.createdBy == userId) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "You are the creator of this voting")
        }

        val existingPermission = votePermissionRepository.findByUserIdAndVotingId(userId, votingId)
        if (existingPermission != null) {
            throw ResponseStatusException(HttpStatus.CONFLICT, "You have already requested permission to vote")
        }

        votePermissionRepository.save(
            VotePermission(
                userId = userId,
                votingId = votingId,
                status = PermissionStatus.REQUESTED
            )
        )
    }

    @Transactional
    fun requestForWatch(userId: UUID, votingId: UUID) {
        val voting = votingRepository.findById(votingId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Voting not found") }

        if (voting.createdBy == userId) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "You are the creator of this voting")
        }

        val existingPermission = watchPermissionRepository.findByUserIdAndVotingId(userId, votingId)
        if (existingPermission != null) {
            throw ResponseStatusException(HttpStatus.CONFLICT, "You have already requested permission to watch")
        }

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
        val voting = votingRepository.findById(votingId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Voting not found") }

        val now = Instant.now()
        if (now.isBefore(voting.startAt)) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Voting has not started yet")
        }
        if (now.isAfter(voting.endAt)) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Voting has already ended")
        }

        val perm = votePermissionRepository.findByUserIdAndVotingId(userId, votingId)
            ?: throw ResponseStatusException(HttpStatus.FORBIDDEN, "You don't have permission to vote")

        if (perm.isUsed) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "You have already voted")
        }

        if (perm.token != userVoteToken.toString()) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid vote token")
        }

        val (sigOk, sigMsg) = cryptoGrpcClient.checkSign(
            signedPublicKey = voteSubmissionRequest.signature,
            originalMessage = voteSubmissionRequest.encryptedVote
        )
        if (!sigOk) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid signature: $sigMsg")
        }

        val (zkOk, zkMsg) = cryptoGrpcClient.checkZeroKnowledgeProof(
            encryptedVote = voteSubmissionRequest.encryptedVote,
            zkProof = voteSubmissionRequest.zeroKnowledgeProof
        )
        if (!zkOk) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid zero-knowledge proof: $zkMsg")
        }

        val voteToken = blockchainGrpcClient.saveVote(
            voteId = votingId.toString(),
            userId = userId.toString(),
            encryptedVote = cryptoGrpcClient.encrypt(voteSubmissionRequest.answerId),
            zeroKnowledgeProof = voteSubmissionRequest.zeroKnowledgeProof
        )

        perm.isUsed = true
        perm.lastUpdatedAt = Instant.now()
        votePermissionRepository.save(perm)

        return VotingTokenResponse(
            status = VoteStatus.APPROVED,
            token = voteToken
        )
    }
}