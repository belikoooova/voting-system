package ru.belikoooova.dvs.voting.service.grpc

import io.grpc.stub.StreamObserver
import ru.belikoooova.dvs.voting.service.data.VotePermissionRepository
import ru.belikoooova.dvs.voting.service.data.WatchPermissionRepository
import ru.belikoooova.dvs.voting.service.grpc.v1.VotingServiceGrpc
import ru.belikoooova.dvs.voting.service.grpc.v1.VotingServiceV1
import java.util.*

class PermissionGrpcService(
    private val votePermissionRepository: VotePermissionRepository,
    private val watchPermissionRepository: WatchPermissionRepository
) : VotingServiceGrpc.VotingServiceImplBase() {

    override fun checkVotePermissionRequest(
        request: VotingServiceV1.PermissionRequest,
        responseObserver: StreamObserver<VotingServiceV1.VotePermissionResponse>
    ) {
        val permission = votePermissionRepository.findByUserIdAndVotingId(
            UUID.fromString(request.userId),
            UUID.fromString(request.voteId)
        )

        val response = if (permission == null) {
            VotingServiceV1.VotePermissionResponse.newBuilder()
                .setIsAccepted(false)
                .setUniqueVoteToken("")
                .build()
        } else {
            VotingServiceV1.VotePermissionResponse.newBuilder()
                .setIsAccepted(true)
                .setUniqueVoteToken(permission.token)
                .build()
        }

        responseObserver.onNext(response)
        responseObserver.onCompleted()
    }

    override fun checkWatchPermissionRequest(
        request: VotingServiceV1.PermissionRequest,
        responseObserver: StreamObserver<VotingServiceV1.WatchPermissionResponse>
    ) {
        val permission = watchPermissionRepository.findByUserIdAndVotingId(
            UUID.fromString(request.userId),
            UUID.fromString(request.voteId)
        )

        val response = if (permission == null) {
            VotingServiceV1.WatchPermissionResponse.newBuilder()
                .setIsAccepted(false)
                .build()
        } else {
            VotingServiceV1.WatchPermissionResponse.newBuilder()
                .setIsAccepted(true)
                .build()
        }

        responseObserver.onNext(response)
        responseObserver.onCompleted()
    }

}