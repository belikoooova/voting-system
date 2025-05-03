package ru.belikoooova.dvs.voting.service.service

import ru.belikoooova.dvs.blockchain.service.grpc.v1.BlockchainServiceV1
import ru.belikoooova.dvs.voting.service.api.v1.model.CheckVoteRequest
import ru.belikoooova.dvs.voting.service.api.v1.model.CheckVoteResponse
import ru.belikoooova.dvs.voting.service.api.v1.model.CheckVotingResultsResponse
import ru.belikoooova.dvs.voting.service.api.v1.model.VotingStatus
import ru.belikoooova.dvs.voting.service.data.VotingRepository
import ru.belikoooova.dvs.voting.service.grpc.BlockchainGrpcClient
import ru.belikoooova.dvs.voting.service.grpc.CryptoGrpcClient
import java.time.Instant
import java.util.*

class VotingResultService(private val blockchainGrpcClient: BlockchainGrpcClient,
    private val votingRepository: VotingRepository,
private val cryptoGrpcClient: CryptoGrpcClient) {
    fun checkVote(
        userId: UUID,
        votingId: UUID,
        checkVoteRequest: CheckVoteRequest
    ): CheckVoteResponse =
        blockchainGrpcClient.getBlock(checkVoteRequest.voteToken).mapToRest()

    fun checkAllVotes(
        userId: UUID,
        votingId: UUID
    ): List<CheckVoteResponse> =
        blockchainGrpcClient.getAllBlocks(votingId = votingId.toString()).map {
            it.mapToRest()
        }

    fun checkVotingResults(
        userId: UUID,
        votingId: UUID
    ): CheckVotingResultsResponse {
        val voting = votingRepository.findById(votingId).get()

        val now = Instant.now()
        val status = when {
            now.isBefore(voting.startAt) -> VotingStatus.NOT_STARTED
            now.isBefore(voting.endAt)   -> VotingStatus.IN_PROGRESS
            else                            -> VotingStatus.FINISHED
        }

        if (status != VotingStatus.FINISHED) {
            return CheckVotingResultsResponse(
                status   = status,
                voteId   = votingId.toString(),
                voteName = voting.name,
                results  = mutableMapOf()
            )
        }

        val allBlocks = blockchainGrpcClient.getAllBlocks(votingId.toString())

        val counts = mutableMapOf<String, Int>()
        allBlocks.forEach { block ->
            val answerId = cryptoGrpcClient.decrypt(block.encryptedVote)
            counts[answerId] = counts.getOrDefault(answerId, 0) + 1
        }
        val total = allBlocks.size.toDouble()
        val results = counts.mapValues { (_, cnt) ->
            String.format("%.2f%%", cnt / total * 100)
        }.toMutableMap()

        return CheckVotingResultsResponse(
            status   = status,
            voteId   = votingId.toString(),
            voteName = voting.name,
            results  = results
        )

    }

    private fun BlockchainServiceV1.GetBlockResponse.mapToRest(): CheckVoteResponse =
        CheckVoteResponse(
            voteId = this.voteId,
            userId = this.userId,
            voteToken = this.voteToken,
            encryptedVote = this.encryptedVote,
            zeroKnowledgeProof = this.zeroKnowledgeProof,
            timestamp = this.timestamp,
            blockHash = this.blockHash
        )
}