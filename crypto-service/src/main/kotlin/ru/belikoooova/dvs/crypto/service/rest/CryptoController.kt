package ru.belikoooova.dvs.crypto.service.rest

import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.RestController
import ru.belikoooova.dvs.crypto.service.api.v1.CryptographyApi
import ru.belikoooova.dvs.crypto.service.api.v1.model.PublicKeyResponse
import ru.belikoooova.dvs.crypto.service.api.v1.model.SignRequest
import ru.belikoooova.dvs.crypto.service.api.v1.model.SignResponse
import ru.belikoooova.dvs.crypto.service.api.v1.model.ZeroKnowledgeProofResponse
import ru.belikoooova.dvs.crypto.service.service.CryptoService

@RestController
class CryptoController(private val cryptoService: CryptoService): CryptographyApi {
    override fun getSystemPublicKey(xUserId: String): ResponseEntity<PublicKeyResponse> =
        ResponseEntity.ok(cryptoService.getSystemPublicKey())

    override fun sign(xUserId: String, signRequest: SignRequest): ResponseEntity<SignResponse> =
        ResponseEntity.ok(cryptoService.sign(signRequest))

    override fun getZeroKnowledgeProof(
        votingId: String,
        xUserId: String
    ): ResponseEntity<ZeroKnowledgeProofResponse> =
        ResponseEntity.ok(cryptoService.generateZkProof(votingId))
}