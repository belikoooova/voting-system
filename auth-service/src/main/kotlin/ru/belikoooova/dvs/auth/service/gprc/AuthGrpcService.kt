package ru.belikoooova.dvs.auth.service.gprc

import com.google.rpc.Code
import com.google.rpc.Status
import io.envoyproxy.envoy.config.core.v3.HeaderValue
import io.envoyproxy.envoy.config.core.v3.HeaderValueOption
import io.envoyproxy.envoy.service.auth.v3.*
import io.envoyproxy.envoy.type.v3.HttpStatus
import io.envoyproxy.envoy.type.v3.StatusCode
import io.grpc.stub.StreamObserver
import net.devh.boot.grpc.server.service.GrpcService
import ru.belikoooova.dvs.auth.service.service.JwtProvider

@GrpcService
class AuthGrpcService(
    private val jwtProvider: JwtProvider,
    private val votingGrpcClient: VotingGrpcClient
) : AuthorizationGrpc.AuthorizationImplBase() {

    override fun check(request: CheckRequest, responseObserver: StreamObserver<CheckResponse>) {
        val headers = request.attributes.request?.http?.headersMap
        val authHeader = headers?.get("authorization") ?: ""
        val token = authHeader.removePrefix("Bearer ").trim()

        if (token.isEmpty()) {
            sendUnauthenticated(responseObserver)
            return
        }

        val userId = jwtProvider.validateTokenAndGetUserId(token)
        if (userId == null) {
            sendUnauthenticated(responseObserver)
            return
        }

        lateinit var ok: OkHttpResponse
        val path = request.attributes.request?.http?.path!!
        if (path.contains("/vote") or path.contains("/getToken") or path.contains("/checkVote")) {
            val (isAccepted, voteToken) = votingGrpcClient.checkVotePermission(
                path.extractVotingId(),
                userId
            )
            if (!isAccepted) {
                sendUnauthenticated(responseObserver)
                return
            }

            ok = OkHttpResponse.newBuilder()
                .addHeadersToRemove("authorization")
                .addHeaders(buildXUserIdHeader(userId))
                .addHeaders(buildXUserVoteTokenHeader(voteToken))
                .build()
        } else {
            if (path.contains("/checkAllVotes")) {
                if (!(votingGrpcClient.checkWatchPermission(path.extractVotingId(), userId))) {
                    sendUnauthenticated(responseObserver)
                    return
                }
            }

            ok = OkHttpResponse.newBuilder()
                .addHeadersToRemove("authorization")
                .addHeaders(buildXUserIdHeader(userId))
                .build()
        }

        val response = CheckResponse
            .newBuilder()
            .setStatus(Status.newBuilder().setCode(Code.OK_VALUE).build())
            .setOkResponse(ok)
            .build()

        responseObserver.onNext(response)
        responseObserver.onCompleted()
    }

    private fun sendUnauthenticated(responseObserver: StreamObserver<CheckResponse>) {
        responseObserver.onNext(
            CheckResponse
                .newBuilder()
                .setStatus(Status.newBuilder().setCode(Code.UNAUTHENTICATED_VALUE).build())
                .setDeniedResponse(
                    DeniedHttpResponse.newBuilder()
                        .setStatus(HttpStatus.newBuilder().setCode(StatusCode.Unauthorized).build())
                        .build()
                )
                .build()
        )
        responseObserver.onCompleted()
    }

    private fun buildXUserIdHeader(userId: String): HeaderValueOption =
        HeaderValueOption.newBuilder()
            .setHeader(
                HeaderValue.newBuilder()
                    .setKey("x-user-id")
                    .setValue(userId)
                    .build()
            )
            .build()

    private fun buildXUserVoteTokenHeader(token: String): HeaderValueOption =
        HeaderValueOption.newBuilder()
            .setHeader(
                HeaderValue.newBuilder()
                    .setKey("x-user-vote-token")
                    .setValue(token)
                    .build()
            )
            .build()

    private fun String.extractVotingId(): String {
        val regex = Regex("/votings/([^/]+)")
        return regex.find(this)?.groupValues?.get(1)!!
    }
}
