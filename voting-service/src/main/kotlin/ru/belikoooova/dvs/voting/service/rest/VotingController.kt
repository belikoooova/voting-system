package ru.belikoooova.dvs.voting.service.rest

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.RestController
import ru.belikoooova.dvs.voting.service.api.v1.VotingApi
import ru.belikoooova.dvs.voting.service.api.v1.model.GetVotingResponse
import ru.belikoooova.dvs.voting.service.api.v1.model.VoteSubmissionRequest
import ru.belikoooova.dvs.voting.service.api.v1.model.VotingFilter
import ru.belikoooova.dvs.voting.service.api.v1.model.VotingTokenResponse
import ru.belikoooova.dvs.voting.service.service.VotingService
import java.util.*

@RestController
class VotingController(private val votingService: VotingService) : VotingApi {
    override fun getVoting(xUserId: String, votingId: String): ResponseEntity<GetVotingResponse> =
        ResponseEntity.ok(
            votingService.getVoting(
                UUID.fromString(xUserId), UUID.fromString(votingId)
            )
        )

    override fun getVotings(
        xUserId: String,
        votingFilter: VotingFilter
    ): ResponseEntity<List<GetVotingResponse>> =
        ResponseEntity.ok(
            votingService.getVotings(
                UUID.fromString(xUserId), votingFilter
            )
        )

    override fun requestForVote(xUserId: String, votingId: String): ResponseEntity<Unit> {
        votingService.requestForVote(UUID.fromString(xUserId), UUID.fromString(votingId))
        return ResponseEntity(HttpStatus.OK)
    }

    override fun requestForWatch(xUserId: String, votingId: String): ResponseEntity<Unit> {
        votingService.requestForWatch(UUID.fromString(xUserId), UUID.fromString(votingId))
        return ResponseEntity(HttpStatus.OK)
    }

    override fun vote(
        xUserId: String,
        xUserVoteToken: String,
        votingId: String,
        voteSubmissionRequest: VoteSubmissionRequest
    ): ResponseEntity<VotingTokenResponse> =
        ResponseEntity.ok(votingService.vote(UUID.fromString(xUserId), UUID.fromString(xUserVoteToken), UUID.fromString(votingId), voteSubmissionRequest))
}