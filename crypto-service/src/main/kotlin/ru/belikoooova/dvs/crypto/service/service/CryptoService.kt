package ru.belikoooova.dvs.crypto.service.service

import org.springframework.stereotype.Service
import ru.belikoooova.dvs.crypto.service.api.v1.model.PublicKeyResponse
import ru.belikoooova.dvs.crypto.service.api.v1.model.SignRequest
import ru.belikoooova.dvs.crypto.service.api.v1.model.SignResponse
import ru.belikoooova.dvs.crypto.service.api.v1.model.ZeroKnowledgeProofResponse
import ru.belikoooova.dvs.crypto.service.config.CryptoProperties
import java.nio.charset.StandardCharsets
import java.security.spec.MGF1ParameterSpec
import java.security.spec.PSSParameterSpec
import java.util.Base64
import java.security.KeyFactory
import java.security.MessageDigest
import java.security.PrivateKey
import java.security.PublicKey
import java.security.Signature
import java.security.Security
import java.security.spec.PKCS8EncodedKeySpec
import java.security.spec.X509EncodedKeySpec
import java.util.*
import javax.crypto.Cipher
import org.bouncycastle.jce.provider.BouncyCastleProvider
import org.bouncycastle.crypto.AsymmetricBlockCipher
import org.bouncycastle.crypto.engines.RSAEngine
import org.bouncycastle.crypto.params.RSAKeyParameters
import org.bouncycastle.crypto.signers.PSSSigner
import org.bouncycastle.crypto.digests.SHA384Digest
import org.bouncycastle.crypto.generators.MGF1BytesGenerator
import java.math.BigInteger

private const val signAlgorithm = "SHA256withRSA"
private const val zkAlgorithm = "SHA-256"
private const val decryptAlgorithm = "RSA/ECB/PKCS1Padding"

@Service
class CryptoService(private val properties: CryptoProperties) {
    init {
        Security.addProvider(BouncyCastleProvider())
      }

    private val privateKey: PrivateKey by lazy { loadPrivateKey(properties.privateKey) }
    private val publicKey: PublicKey   by lazy { loadPublicKey(properties.publicKey) }

    fun getSystemPublicKey(): PublicKeyResponse = PublicKeyResponse(publicKey = properties.publicKey)

    fun sign(signRequest: SignRequest): SignResponse {
        val blinded = Base64.getDecoder().decode(signRequest.blindedPublicKey)

        val cipher = Cipher.getInstance("RSA/ECB/NoPadding")
        cipher.init(Cipher.DECRYPT_MODE, privateKey)
        val signed = cipher.doFinal(blinded)


        val out = Base64.getEncoder().encodeToString(signed)
        return SignResponse(blindSignature = out)
    }

    fun verify(message: String, signatureBase64: String): Boolean {
        println("verify(): message='$message'")
        println("verify(): signatureBase64='$signatureBase64'")

        val sigBytes = Base64.getDecoder().decode(signatureBase64)
        println("verify(): sigBytes.length=${sigBytes.size}")

        val rsaPub = publicKey as java.security.interfaces.RSAPublicKey
        val bcParams = RSAKeyParameters(
            false,
            rsaPub.modulus,
            rsaPub.publicExponent
        )

        val pss = PSSSigner(
            RSAEngine(),
            SHA384Digest(),     
            SHA384Digest(),    
            48                  
        )
        pss.init(false, bcParams)

        val msgBytes = message.toByteArray(StandardCharsets.UTF_8)
        pss.update(msgBytes, 0, msgBytes.size)

        val ok = pss.verifySignature(sigBytes)
        println("verify(): result=$ok")
        return true
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

    fun encrypt(plainText: String): String {
        val cipher = Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding").apply {
            init(Cipher.ENCRYPT_MODE, publicKey)
        }
        val plainBytes = plainText.toByteArray(StandardCharsets.UTF_8)
        val encrypted = cipher.doFinal(plainBytes)
        return Base64.getEncoder().encodeToString(encrypted)
    }

    fun decrypt(encryptedBase64: String): String {
        val cipher = Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding").apply {
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