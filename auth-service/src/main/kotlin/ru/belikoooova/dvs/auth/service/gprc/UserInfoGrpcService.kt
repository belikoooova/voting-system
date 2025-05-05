package ru.belikoooova.dvs.auth.service.gprc

import io.grpc.stub.StreamObserver
import net.devh.boot.grpc.server.service.GrpcService
import ru.belikoooova.dvs.auth.service.grpc.v1.AuthServiceGrpc
import ru.belikoooova.dvs.auth.service.grpc.v1.AuthServiceV1
import ru.belikoooova.dvs.auth.service.grpc.v1.AuthServiceV1.UserInfoResponse
import ru.belikoooova.dvs.auth.service.repository.UserRepository
import java.util.*

@GrpcService
class UserInfoGrpcService(
    private val userRepository: UserRepository
) : AuthServiceGrpc.AuthServiceImplBase() {
    override fun getUserInfo(
        request: AuthServiceV1.UserInfoRequest,
        responseObserver: StreamObserver<UserInfoResponse>
    ) {
        val user = userRepository.findById(UUID.fromString(request.id)).get()
        responseObserver.onNext(
            UserInfoResponse.newBuilder()
                .setId(user.id.toString())
                .setUsername(user.username)
                .setEmail(user.email)
                .build()
        )
        responseObserver.onCompleted()
    }
}