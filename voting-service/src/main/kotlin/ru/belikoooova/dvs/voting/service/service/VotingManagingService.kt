package ru.belikoooova.dvs.voting.service.service;

import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException
import ru.belikoooova.dvs.voting.service.api.v1.model.AnswerForWatchOrVoteRequestResponse
import ru.belikoooova.dvs.voting.service.api.v1.model.CreateOrEditVotingRequest
import ru.belikoooova.dvs.voting.service.api.v1.model.GetVotingResponse
import ru.belikoooova.dvs.voting.service.api.v1.model.WatchOrVoteRequestResponse
import ru.belikoooova.dvs.voting.service.data.*
import ru.belikoooova.dvs.voting.service.dto.UserInfoDto
import ru.belikoooova.dvs.voting.service.grpc.AuthGrpcClient
import java.time.Instant
import java.util.*

@Service
class VotingManagingService(
    private val votePermissionRepository: VotePermissionRepository,
    private val watchPermissionRepository: WatchPermissionRepository,
    private val votingRepository: VotingRepository,
    private val authGrpcClient: AuthGrpcClient
) {
    fun getVoteRequests(userId: UUID): List<WatchOrVoteRequestResponse> =
        votePermissionRepository.findAllNonAnsweredByVotingCreator(userId)
            .map {
                val voting = votingRepository.findById(it.votingId)
                    .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Voting not found") }
                val userInfoDto = authGrpcClient.getUserInfo(it.userId.toString())
                WatchOrVoteRequestResponse(
                    permissionId = it.id.toString(),
                    voteId = voting.id.toString(),
                    voteName = voting.name,
                    userId = userInfoDto.id,
                    userName = userInfoDto.username,
                    userEmail = userInfoDto.email,
                    requestDate = it.createdAt.toEpochMilli()
                )
            }

    fun getWatchRequests(userId: UUID): List<WatchOrVoteRequestResponse> =
        watchPermissionRepository.findAllNonAnsweredByVotingCreator(userId)
            .map {
                val voting = votingRepository.findById(it.votingId)
                    .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Voting not found") }
                val userInfoDto = authGrpcClient.getUserInfo(it.userId.toString())
                WatchOrVoteRequestResponse(
                    permissionId = it.id.toString(),
                    voteId = voting.id.toString(),
                    voteName = voting.name,
                    userId = userInfoDto.id,
                    userName = userInfoDto.username,
                    userEmail = userInfoDto.email,
                    requestDate = it.createdAt.toEpochMilli()
                )
            }
    // todo fix this duplicated shiiiiit?

    fun answerVoteRequests(
        userId: UUID,
        request: List<AnswerForWatchOrVoteRequestResponse>
    ) {
        // todo create uuid type for openapi?
        request.forEach {
            val permission = votePermissionRepository.findById(UUID.fromString(it.permissionId))
                .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Vote permission not found") }
            
            if (permission.votingId != userId) {
                throw ResponseStatusException(HttpStatus.FORBIDDEN, "You are not the creator of this voting")
            }

            votePermissionRepository.save(
                permission.apply {
                    if (it.approve) {
                        this.status = PermissionStatus.APPROVED
                        this.token = UUID.randomUUID().toString()
                    } else {
                        this.status = PermissionStatus.REJECTED
                    }
                    this.lastUpdatedAt = Instant.now()
                }
            )
        }
    }

    fun answerWatchRequests(
        userId: UUID,
        request: List<AnswerForWatchOrVoteRequestResponse>
    ) {
        request.forEach {
            val permission = watchPermissionRepository.findById(UUID.fromString(it.permissionId))
                .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Watch permission not found") }
            
            if (permission.votingId != userId) {
                throw ResponseStatusException(HttpStatus.FORBIDDEN, "You are not the creator of this voting")
            }

            watchPermissionRepository.save(
                permission.apply {
                    if (it.approve) {
                        this.status = PermissionStatus.APPROVED
                    } else {
                        this.status = PermissionStatus.REJECTED
                    }
                    this.lastUpdatedAt = Instant.now()
                }
            )
        }
    }

    fun createVoting(
        userId: UUID,
        request: CreateOrEditVotingRequest
    ): GetVotingResponse {
        val voting = votingRepository.save(request.mapToDataModel(userId))
        val votePermission = votePermissionRepository.save(
            VotePermission(
                userId = userId,
                votingId = voting.id!!,
                status = PermissionStatus.CREATOR,
                token = UUID.randomUUID().toString() // todo
            )
        )
        val watchPermission = watchPermissionRepository.save(
            WatchPermission(
                userId = userId,
                votingId = voting.id,
                status = PermissionStatus.CREATOR
            )
        )
        return voting.mapToRest(votePermission, watchPermission)
    }

    fun editVoting(
        userId: UUID,
        votingId: UUID,
        request: CreateOrEditVotingRequest
    ): GetVotingResponse {
        val voting = votingRepository.findById(votingId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Voting not found") }
        
        if (voting.createdBy != userId) {
            throw ResponseStatusException(HttpStatus.FORBIDDEN, "You are not the creator of this voting")
        }

        return votingRepository.save(request.mapToDataModel(userId)).mapToRest(
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

    fun deleteCreatedVoting(userId: UUID, votingId: UUID) {
        val voting = votingRepository.findById(votingId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Voting not found") }
        
        if (voting.createdBy != userId) {
            throw ResponseStatusException(HttpStatus.FORBIDDEN, "You are not the creator of this voting")
        }

        votingRepository.deleteById(votingId)
    }

    fun getCreatedVoting(
        userId: UUID,
        votingId: UUID
    ): GetVotingResponse {
        val voting = votingRepository.findById(votingId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Voting not found") }
        
        if (voting.createdBy != userId) {
            throw ResponseStatusException(HttpStatus.FORBIDDEN, "You are not the creator of this voting")
        }

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

    fun getCreatedVotings(userId: UUID): List<GetVotingResponse> =
        votingRepository.findAllByCreatedBy(userId).map {
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
        }

    private fun CreateOrEditVotingRequest.mapToDataModel(userId: UUID): Voting =
        Voting(
            name = this.name,
            description = this.description,
            question = this.question,
            startAt = Instant.ofEpochMilli(this.startDate),
            endAt = Instant.ofEpochMilli(this.endDate),
            createdBy = userId
        )
}