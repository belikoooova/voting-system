package ru.belikoooova.dvs.voting.service.grpc

import net.devh.boot.grpc.client.inject.GrpcClient
import org.springframework.stereotype.Service
import ru.belikoooova.dvs.blockchain.service.grpc.v1.BlockchainServiceGrpc
import ru.belikoooova.dvs.blockchain.service.grpc.v1.BlockchainServiceV1

@Service
class BlockchainGrpcClient {

    @GrpcClient("blockchain-client")
    private lateinit var stub: BlockchainServiceGrpc.BlockchainServiceBlockingStub

    fun saveVote(
        voteId: String,
        userId: String,
        encryptedVote: String,
        zeroKnowledgeProof: String
    ): String =
        stub.saveVote(BlockchainServiceV1.SaveVoteRequest.newBuilder()
            .setVoteId(voteId)
            .setUserId(userId)
            .setEncryptedVote(encryptedVote)
            .setZeroKnowledgeProof(zeroKnowledgeProof)
            .build()).voteToken

    fun getBlock(voteToken: String): BlockchainServiceV1.GetBlockResponse =
        stub.getBlock(BlockchainServiceV1.GetBlockRequest.newBuilder()
            .setVoteToken(voteToken)
            .build())

    fun getAllBlocks(votingId: String): List<BlockchainServiceV1.GetBlockResponse> =
        stub.getAllBlocks(
            BlockchainServiceV1.GetAllBlockRequest.newBuilder()
                .setVotingId(votingId)
                .build()
        ).blocksList
}