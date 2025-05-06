package ru.belikoooova.dws.blockchain.service.gprc

import io.grpc.stub.StreamObserver
import net.devh.boot.grpc.server.service.GrpcService
import org.web3j.tuples.generated.Tuple5
import ru.belikoooova.dvs.blockchain.service.contract.VoteContract
import ru.belikoooova.dvs.blockchain.service.grpc.v1.BlockchainServiceGrpc
import ru.belikoooova.dvs.blockchain.service.grpc.v1.BlockchainServiceV1
import java.math.BigInteger

@GrpcService
class BlockchainGrpcService(private val voteContract: VoteContract) :
    BlockchainServiceGrpc.BlockchainServiceImplBase() {
    private val hashesByVoteToken: HashMap<String, String> = HashMap() // todo

    override fun saveVote(
        request: BlockchainServiceV1.SaveVoteRequest,
        responseObserver: StreamObserver<BlockchainServiceV1.SaveVoteResponse>
    ) {
        val receipt = voteContract
            .saveVote(
                request.voteId,
                request.userId,
                request.encryptedVote,
                request.zeroKnowledgeProof
            )
            .send()

        val events = VoteContract.getVoteSavedEvents(receipt)
        if (events.isEmpty()) {
            throw IllegalStateException("VoteSaved not found")
        }
        val token = events[0].voteToken
        hashesByVoteToken[token] = receipt.blockHash

        responseObserver.onNext(
            BlockchainServiceV1.SaveVoteResponse.newBuilder().setVoteToken(token).build()
        )
        responseObserver.onCompleted()
    }

    override fun getBlock(
        request: BlockchainServiceV1.GetBlockRequest,
        responseObserver: StreamObserver<BlockchainServiceV1.GetBlockResponse>
    ) {
        val voteToken = request.voteToken

        val resp = getBlockResponse(voteToken)

        responseObserver.onNext(resp)
        responseObserver.onCompleted()
    }

    override fun getAllBlocks(
        request: BlockchainServiceV1.GetAllBlockRequest,
        responseObserver: StreamObserver<BlockchainServiceV1.GetAllBlocksResponse>
    ) {
        val voteId = request.votingId

        val rawTokens = voteContract.getAllBlocks(voteId).send()
        val tokens: List<String> = rawTokens.filterIsInstance<String>()

        val respBuilder = BlockchainServiceV1.GetAllBlocksResponse.newBuilder()
        for (token in tokens) {
            respBuilder.addBlocks(getBlockResponse(token))
        }

        responseObserver.onNext(respBuilder.build())
        responseObserver.onCompleted()
    }

    private fun getBlockResponse(token: String): BlockchainServiceV1.GetBlockResponse? {
        val result: Tuple5<String, String, String, String, BigInteger> =
            voteContract.getBlock(token).send()

        val (vId, uId, encVote, zk, ts) = result

        return BlockchainServiceV1.GetBlockResponse.newBuilder()
            .setVoteId(vId)
            .setUserId(uId)
            .setVoteToken(token)
            .setEncryptedVote(encVote)
            .setZeroKnowledgeProof(zk)
            .setTimestamp(ts.longValueExact())
            .setBlockHash(hashesByVoteToken[token])
            .build()
    }
}