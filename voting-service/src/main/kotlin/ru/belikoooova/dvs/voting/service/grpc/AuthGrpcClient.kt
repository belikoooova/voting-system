package ru.belikoooova.dvs.voting.service.grpc

import net.devh.boot.grpc.client.inject.GrpcClient
import org.springframework.stereotype.Service
import ru.belikoooova.dvs.auth.service.grpc.v1.AuthServiceGrpc
import ru.belikoooova.dvs.auth.service.grpc.v1.AuthServiceV1.UserInfoRequest
import ru.belikoooova.dvs.voting.service.dto.UserInfoDto

@Service
class AuthGrpcClient {
    @GrpcClient("auth-client")
    private lateinit var stub: AuthServiceGrpc.AuthServiceBlockingStub

    fun getUserInfo(userId: String): UserInfoDto =
        stub.getUserInfo(
            UserInfoRequest.newBuilder()
                .setId(userId)
                .build()
        ).let {
            UserInfoDto(
                id = it.id,
                username = it.username,
                email = it.email
            )
        }
}