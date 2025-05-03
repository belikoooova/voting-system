package ru.belikoooova.dvs.auth.service.gprc

import net.devh.boot.grpc.client.inject.GrpcClient
import org.springframework.stereotype.Service
import ru.belikoooova.dvs.voting.service.grpc.v1.VotingServiceGrpc
import ru.belikoooova.dvs.voting.service.grpc.v1.VotingServiceV1.PermissionRequest

@Service
class VotingGrpcClient {
    @GrpcClient("voting-client")
    private lateinit var stub: VotingServiceGrpc.VotingServiceBlockingStub

    fun checkVotePermission(voteId: String, userId: String): Pair<Boolean, String> =
        stub.checkVotePermissionRequest(
            PermissionRequest.newBuilder()
                .setVoteId(voteId)
                .setUserId(userId)
                .build()
        ).let {
            Pair(it.isAccepted, it.uniqueVoteToken)
        }

    fun checkWatchPermission(voteId: String, userId: String): Boolean =
        stub.checkWatchPermissionRequest(
            PermissionRequest.newBuilder()
                .setVoteId(voteId)
                .setUserId(userId)
                .build()
        ).isAccepted
}