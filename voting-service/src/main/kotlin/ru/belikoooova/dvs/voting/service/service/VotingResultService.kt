package ru.belikoooova.dvs.voting.service.service

import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
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

@Service
class VotingResultService(private val blockchainGrpcClient: BlockchainGrpcClient,
    private val votingRepository: VotingRepository,
private val cryptoGrpcClient: CryptoGrpcClient) {
    @Transactional
    fun checkVote(
        userId: UUID,
        votingId: UUID,
        checkVoteRequest: CheckVoteRequest
    ): CheckVoteResponse {
        val voting = votingRepository.findById(votingId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Voting not found") }

        val block = blockchainGrpcClient.getBlock(checkVoteRequest.voteToken)
            ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "Vote not found")

        return block.mapToRest()
    }

    @Transactional
    fun checkAllVotes(
        userId: UUID,
        votingId: UUID
    ): List<CheckVoteResponse> {
        val voting = votingRepository.findById(votingId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Voting not found") }

        val blocks = blockchainGrpcClient.getAllBlocks(votingId.toString())
        if (blocks.isEmpty()) {
            throw ResponseStatusException(HttpStatus.NOT_FOUND, "No votes found for this voting")
        }

        return blocks.map { it.mapToRest() }
    }

    @Transactional
    fun checkVotingResults(
        userId: UUID,
        votingId: UUID
    ): CheckVotingResultsResponse {
        val voting = votingRepository.findById(votingId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Voting not found") }

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
        if (allBlocks.isEmpty()) {
            throw ResponseStatusException(HttpStatus.NOT_FOUND, "No votes found for this voting")
        }

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