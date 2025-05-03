package ru.belikoooova.dvs.crypto.service.crypto

import org.springframework.stereotype.Service
import java.math.BigInteger
import java.security.MessageDigest
import java.security.SecureRandom

data class GroupParams(
    val p: BigInteger,
    val q: BigInteger,
    val g: BigInteger,
    val h: BigInteger
)

data class Ciphertext(
    val c1: BigInteger,
    val c2: BigInteger
)

data class ORProof(
    val a: List<BigInteger>,
    val b: List<BigInteger>,
    val e: List<BigInteger>,
    val s: List<BigInteger>
)

@Service
class ORMembership {
    private val rng = SecureRandom()

    private fun hashChallenge(elements: List<BigInteger>, q: BigInteger): BigInteger {
        val md = MessageDigest.getInstance("SHA-256")
        elements.forEach { e ->
            val bytes = e.toByteArray()
            md.update(bytes)
        }
        val hash = BigInteger(1, md.digest())
        return hash.mod(q)
    }

    private fun mapToMessage(opt: String, q: BigInteger): BigInteger {
        val md = MessageDigest.getInstance("SHA-256")
        md.update(opt.toByteArray(Charsets.UTF_8))
        return BigInteger(1, md.digest()).mod(q)
    }

    fun generateProof(
        options: List<String>,
        idx: Int,
        r: BigInteger,
        ctxt: Ciphertext,
        params: GroupParams
    ): ORProof {
        val N = options.size
        require(idx in 0 until N)
        val p = params.p
        val q = params.q
        val g = params.g
        val h = params.h

        val mList = options.map { mapToMessage(it, q) }
        val D = mList.map { mi -> ctxt.c2.multiply(g.modPow(mi.negate(), p)).mod(p) }

        val a = MutableList<BigInteger>(N) { BigInteger.ZERO }
        val b = MutableList<BigInteger>(N) { BigInteger.ZERO }
        val e = MutableList<BigInteger>(N) { BigInteger.ZERO }
        val s = MutableList<BigInteger>(N) { BigInteger.ZERO }

        var sumE = BigInteger.ZERO
        for (i in 0 until N) {
            if (i == idx) continue
            e[i] = BigInteger(q.bitLength(), rng).mod(q)
            s[i] = BigInteger(q.bitLength(), rng).mod(q)
            a[i] = g.modPow(s[i], p)
                .multiply(ctxt.c1.modPow(e[i].negate(), p)).mod(p)
            b[i] = h.modPow(s[i], p)
                .multiply(D[i].modPow(e[i].negate(), p)).mod(p)
            sumE = sumE.add(e[i]).mod(q)
        }

        val w = BigInteger(q.bitLength(), rng).mod(q)
        a[idx] = g.modPow(w, p)
        b[idx] = h.modPow(w, p)

        val allElems = mutableListOf<BigInteger>().apply {
            add(g); add(h); add(ctxt.c1); add(ctxt.c2)
            a.forEach { add(it) }
            b.forEach { add(it) }
        }
        val c = hashChallenge(allElems, q)
        e[idx] = c.subtract(sumE).mod(q)
        s[idx] = w.add(e[idx].multiply(r)).mod(q)

        return ORProof(a, b, e, s)
    }

    fun verifyProof(
        proof: ORProof,
        options: List<String>,
        ctxt: Ciphertext,
        params: GroupParams
    ): Boolean {
        val N = options.size
        val p = params.p
        val q = params.q
        val g = params.g
        val h = params.h

        val mList = options.map { mapToMessage(it, q) }
        val D = mList.map { mi -> ctxt.c2.multiply(g.modPow(mi.negate(), p)).mod(p) }

        var sumE = BigInteger.ZERO
        for (i in 0 until N) {
            val ai = proof.a[i]
            val bi = proof.b[i]
            val ei = proof.e[i]
            val si = proof.s[i]
            sumE = sumE.add(ei).mod(q)
            val lhsA = ai
            val rhsA = g.modPow(si, p)
                .multiply(ctxt.c1.modPow(ei.negate(), p)).mod(p)
            if (lhsA != rhsA) return false
            val lhsB = bi
            val rhsB = h.modPow(si, p)
                .multiply(D[i].modPow(ei.negate(), p)).mod(p)
            if (lhsB != rhsB) return false
        }

        val allElems = mutableListOf<BigInteger>().apply {
            add(g); add(h); add(ctxt.c1); add(ctxt.c2)
            proof.a.forEach { add(it) }
            proof.b.forEach { add(it) }
        }
        val c = hashChallenge(allElems, q)
        return sumE == c
    }
}
