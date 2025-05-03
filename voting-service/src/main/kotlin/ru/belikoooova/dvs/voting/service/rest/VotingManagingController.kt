package ru.belikoooova.dvs.voting.service.rest

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.RestController
import ru.belikoooova.dvs.voting.service.api.v1.VotingManagingApi
import ru.belikoooova.dvs.voting.service.api.v1.model.AnswerForWatchOrVoteRequestResponse
import ru.belikoooova.dvs.voting.service.api.v1.model.CreateOrEditVotingRequest
import ru.belikoooova.dvs.voting.service.api.v1.model.GetVotingResponse
import ru.belikoooova.dvs.voting.service.api.v1.model.WatchOrVoteRequestResponse
import ru.belikoooova.dvs.voting.service.service.VotingManagingService
import java.util.*

@RestController
class VotingManagingController(
    private val votingManagingService: VotingManagingService
) : VotingManagingApi {
    override fun getVoteRequests(xUserId: String): ResponseEntity<List<WatchOrVoteRequestResponse>> =
        ResponseEntity.ok(votingManagingService.getVoteRequests(UUID.fromString(xUserId)))

    override fun getWatchRequests(xUserId: String): ResponseEntity<List<WatchOrVoteRequestResponse>> =
        ResponseEntity.ok(votingManagingService.getWatchRequests(UUID.fromString(xUserId)))

    override fun answerVoteRequests(
        xUserId: String,
        answerForWatchOrVoteRequestResponse: List<AnswerForWatchOrVoteRequestResponse>
    ): ResponseEntity<Unit> {
        votingManagingService.answerVoteRequests(
            UUID.fromString(xUserId),
            answerForWatchOrVoteRequestResponse
        )
        return ResponseEntity(HttpStatus.OK)
    }

    override fun answerWatchRequests(
        xUserId: String,
        answerForWatchOrVoteRequestResponse: List<AnswerForWatchOrVoteRequestResponse>
    ): ResponseEntity<Unit> {
        votingManagingService.answerWatchRequests(
            UUID.fromString(xUserId),
            answerForWatchOrVoteRequestResponse
        )
        return ResponseEntity(HttpStatus.OK)
    }

    override fun createVoting(
        xUserId: String,
        createOrEditVotingRequest: CreateOrEditVotingRequest?
    ): ResponseEntity<GetVotingResponse> =
        ResponseEntity.ok(
            votingManagingService.createVoting(
                UUID.fromString(xUserId),
                createOrEditVotingRequest!!
            )
        )

    override fun deleteCreatedVoting(xUserId: String, votingId: String): ResponseEntity<Unit> {
        votingManagingService.deleteCreatedVoting(
            UUID.fromString(xUserId),
            UUID.fromString(votingId)
        )
        return ResponseEntity(HttpStatus.OK)
    }

    override fun editCreatedVoting(
        xUserId: String,
        votingId: String,
        createOrEditVotingRequest: CreateOrEditVotingRequest?
    ): ResponseEntity<GetVotingResponse> =
        ResponseEntity.ok(
            votingManagingService.editVoting(
                UUID.fromString(xUserId),
                UUID.fromString(votingId),
                createOrEditVotingRequest!!
            )
        )

    override fun getCreatedVoting(
        xUserId: String,
        votingId: String
    ): ResponseEntity<GetVotingResponse> =
        ResponseEntity.ok(
            votingManagingService.getCreatedVoting(
                UUID.fromString(xUserId),
                UUID.fromString(votingId)
            )
        )

    override fun getCreatedVotings(xUserId: String): ResponseEntity<List<GetVotingResponse>> =
        ResponseEntity.ok(
            votingManagingService.getCreatedVotings(
                UUID.fromString(xUserId)
            )
        )
}