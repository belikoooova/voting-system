package ru.belikoooova.dvs.voting.service.rest

import org.springframework.http.ResponseEntity
import ru.belikoooova.dvs.voting.service.api.v1.VotingResultApi
import ru.belikoooova.dvs.voting.service.api.v1.model.CheckVoteRequest
import ru.belikoooova.dvs.voting.service.api.v1.model.CheckVoteResponse
import ru.belikoooova.dvs.voting.service.api.v1.model.CheckVotingResultsResponse
import ru.belikoooova.dvs.voting.service.service.VotingResultService
import java.util.*

class VotingResultController(private val votingResultService: VotingResultService) :
    VotingResultApi {
    override fun checkVote(
        xUserId: String,
        votingId: String,
        checkVoteRequest: CheckVoteRequest
    ): ResponseEntity<CheckVoteResponse> =
        ResponseEntity.ok(
            votingResultService.checkVote(
                UUID.fromString(xUserId),
                UUID.fromString(votingId),
                checkVoteRequest
            )
        )

    override fun checkAllVotes(
        xUserId: String,
        votingId: String
    ): ResponseEntity<List<CheckVoteResponse>> =
        ResponseEntity.ok(
            votingResultService.checkAllVotes(
                UUID.fromString(xUserId),
                UUID.fromString(votingId)
            )
        )

    override fun checkVotingResults(
        xUserId: String,
        votingId: String
    ): ResponseEntity<CheckVotingResultsResponse> =
        ResponseEntity.ok(
            votingResultService.checkVotingResults(
                UUID.fromString(xUserId),
                UUID.fromString(votingId)
            )
        )
}