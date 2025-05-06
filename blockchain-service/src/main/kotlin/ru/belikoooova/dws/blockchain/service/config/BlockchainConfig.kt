package ru.belikoooova.dws.blockchain.service.config

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.web3j.crypto.Credentials
import org.web3j.protocol.Web3j
import org.web3j.protocol.http.HttpService
import org.web3j.tx.gas.DefaultGasProvider
import org.web3j.tx.gas.StaticGasProvider
import ru.belikoooova.dvs.blockchain.service.contract.VoteContract
import java.math.BigInteger

@Configuration
class BlockchainConfig(private val props: BlockchainProperties) {

    @Bean
    fun staticGasProvider(): StaticGasProvider =
        StaticGasProvider(
            DefaultGasProvider.GAS_PRICE,
            BigInteger.valueOf(7_500_000)
        )

    @Bean
    fun web3j(): Web3j {
        System.setProperty("org.web3j.ens.enabled", "false")
        return Web3j.build(HttpService(props.rpcUrl))
    }

    @Bean
    fun credentials(): Credentials =
        Credentials.create(props.privateKey)

    @Bean
    fun voteContract(web3j: Web3j, credentials: Credentials, gasProvider: StaticGasProvider): VoteContract {
        return VoteContract.load(
            props.contractAddress,
            web3j,
            credentials,
            gasProvider
        )
    }
}

@Configuration
@ConfigurationProperties("blockchain")
data class BlockchainProperties(
    var rpcUrl: String = "",
    var privateKey: String = "",
    var contractAddress: String = ""
)