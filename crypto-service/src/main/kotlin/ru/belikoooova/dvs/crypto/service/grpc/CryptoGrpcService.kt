package ru.belikoooova.dvs.crypto.service.grpc

import io.grpc.stub.StreamObserver
import net.devh.boot.grpc.server.service.GrpcService
import ru.belikoooova.dvs.crypto.service.grpc.v1.CryptoServiceGrpc
import ru.belikoooova.dvs.crypto.service.grpc.v1.CryptoServiceV1
import ru.belikoooova.dvs.crypto.service.service.CryptoService

@GrpcService
class CryptoGrpcService(private val cryptoService: CryptoService) : CryptoServiceGrpc.CryptoServiceImplBase() {
    override fun checkSign(
        request: CryptoServiceV1.CheckSignRequest,
        responseObserver: StreamObserver<CryptoServiceV1.CheckResponse>
    ) {
        val valid = cryptoService.verify(request.originalMessage, request.signedPublicKey)
        responseObserver.onNext(
            CryptoServiceV1.CheckResponse.newBuilder()
                .setValid(valid)
                .setMessage(if (valid) "OK" else "Invalid signature")
                .build()
        )
        responseObserver.onCompleted()
    }

    // todo
    override fun checkZeroKnowledgeProof(
        request: CryptoServiceV1.CheckZeroKnowledgeProofRequest,
        responseObserver: StreamObserver<CryptoServiceV1.CheckResponse>
    ) {
        responseObserver.onNext(
            CryptoServiceV1.CheckResponse.newBuilder()
                .setValid(true)
                .setMessage("NOT IMPLEMENTED!!!")
                .build()
        )
        responseObserver.onCompleted()
    }

    override fun decrypt(
        request: CryptoServiceV1.DecryptRequest,
        responseObserver: StreamObserver<CryptoServiceV1.DecryptResponse>
    ) {
        responseObserver.onNext(
            CryptoServiceV1.DecryptResponse.newBuilder()
                .setAnswerId(
                    cryptoService.decrypt(
                        request.encryptedVote
                    )
                )
                .build()
        )
        responseObserver.onCompleted()
    }
}