package ru.belikoooova.dvs.voting.service.grpc

import net.devh.boot.grpc.client.inject.GrpcClient
import org.springframework.cache.annotation.Caching
import org.springframework.stereotype.Service
import ru.belikoooova.dvs.crypto.service.grpc.v1.CryptoServiceGrpc
import ru.belikoooova.dvs.crypto.service.grpc.v1.CryptoServiceV1

@Service
class CryptoGrpcClient {
    @GrpcClient("crypto-client")
    private lateinit var stub: CryptoServiceGrpc.CryptoServiceBlockingStub

    fun checkSign(signedPublicKey: String, originalMessage: String): Pair<Boolean, String> {
        val req = CryptoServiceV1.CheckSignRequest.newBuilder()
            .setSignedPublicKey(signedPublicKey)
            .setOriginalMessage(originalMessage)
            .build()

        val resp: CryptoServiceV1.CheckResponse = stub.checkSign(req)
        return resp.valid to resp.message
    }

    fun checkZeroKnowledgeProof(encryptedVote: String, zkProof: String): Pair<Boolean, String> {
        val req = CryptoServiceV1.CheckZeroKnowledgeProofRequest.newBuilder()
            .setEncryptedVote(encryptedVote)
            .setZkProof(zkProof)
            .build()

        val resp: CryptoServiceV1.CheckResponse = stub.checkZeroKnowledgeProof(req)
        return resp.valid to resp.message
    }

    @Caching
    fun decrypt(encryptedVote: String): String =
        stub.decrypt(
            CryptoServiceV1.DecryptRequest.newBuilder().setEncryptedVote(encryptedVote).build()
        ).answerId

    @Caching
    fun encrypt(vote: String): String =
        stub.encrypt(
            CryptoServiceV1.EncryptRequest.newBuilder().setAnswerId(vote).build()
        ).encryptedVote
}
