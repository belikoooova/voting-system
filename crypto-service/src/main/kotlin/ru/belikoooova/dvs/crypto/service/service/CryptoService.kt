package ru.belikoooova.dvs.crypto.service.service

import org.springframework.stereotype.Service
import ru.belikoooova.dvs.crypto.service.api.v1.model.PublicKeyResponse
import ru.belikoooova.dvs.crypto.service.api.v1.model.SignRequest
import ru.belikoooova.dvs.crypto.service.api.v1.model.SignResponse
import ru.belikoooova.dvs.crypto.service.api.v1.model.ZeroKnowledgeProofResponse
import ru.belikoooova.dvs.crypto.service.config.CryptoProperties
import java.nio.charset.StandardCharsets
import java.security.KeyFactory
import java.security.MessageDigest
import java.security.PrivateKey
import java.security.PublicKey
import java.security.Signature
import java.security.spec.PKCS8EncodedKeySpec
import java.security.spec.X509EncodedKeySpec
import java.util.*
import javax.crypto.Cipher

private const val signAlgorithm = "SHA256withRSA"
private const val zkAlgorithm = "SHA-256"
private const val decryptAlgorithm = "RSA/ECB/OAEPWithSHA-256AndMGF1Padding"

@Service
class CryptoService(private val properties: CryptoProperties) {

    private val privateKey: PrivateKey by lazy { loadPrivateKey(properties.privateKey) }
    private val publicKey: PublicKey   by lazy { loadPublicKey(properties.publicKey) }

    fun getSystemPublicKey(): PublicKeyResponse = PublicKeyResponse(publicKey = properties.publicKey)

    fun sign(signRequest: SignRequest): SignResponse {
        val blindedBytes = Base64.getDecoder().decode(signRequest.blindedPublicKey)
        val sig = Signature.getInstance(signAlgorithm).apply { initSign(privateKey) }
        sig.update(blindedBytes)
        return SignResponse(blindSignature = Base64.getEncoder().encodeToString(sig.sign()))
    }

    fun verify(message: String, signedBase64: String): Boolean {
        val sig = Signature.getInstance(signAlgorithm).apply { initVerify(publicKey) }
        sig.update(message.toByteArray(Charsets.UTF_8))
        val bytes = Base64.getDecoder().decode(signedBase64)
        return sig.verify(bytes)
    }

    // todo
    fun generateZkProof(voteId: String): ZeroKnowledgeProofResponse {
        val md = MessageDigest.getInstance(zkAlgorithm)
        val input = voteId.toByteArray(Charsets.UTF_8) + properties.publicKey.toByteArray(Charsets.UTF_8)
        val hash = md.digest(input)
        return ZeroKnowledgeProofResponse(
            zeroKnowledgeProof = hash.joinToString("") { "%02x".format(it) }
        )
    }

    // todo
    fun verifyZkProof(voteId: String, proof: String): Boolean {
        return generateZkProof(voteId).zeroKnowledgeProof == proof
    }

    fun decrypt(encryptedBase64: String): String {
        val cipher = Cipher.getInstance(decryptAlgorithm).apply {
            init(Cipher.DECRYPT_MODE, privateKey)
        }
        val encryptedBytes = Base64.getDecoder().decode(encryptedBase64)
        val plain = cipher.doFinal(encryptedBytes)
        return String(plain, StandardCharsets.UTF_8)
    }

    private fun loadPrivateKey(pem: String): PrivateKey {
        val data = Base64.getDecoder()
            .decode(pem
                .replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replace("\\s".toRegex(), ""))
        return KeyFactory.getInstance("RSA")
            .generatePrivate(PKCS8EncodedKeySpec(data))
    }

    private fun loadPublicKey(pem: String): PublicKey {
        val data = Base64.getDecoder()
            .decode(pem
                .replace("-----BEGIN PUBLIC KEY-----", "")
                .replace("-----END PUBLIC KEY-----", "")
                .replace("\\s".toRegex(), ""))
        return KeyFactory.getInstance("RSA")
            .generatePublic(X509EncodedKeySpec(data))
    }
}