package ru.belikoooova.dws.blockchain.service.config

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.web3j.crypto.Credentials
import org.web3j.protocol.Web3j
import org.web3j.protocol.http.HttpService
import org.web3j.tx.gas.DefaultGasProvider
import ru.belikoooova.dvs.blockchain.service.contract.VoteContract

@Configuration
class BlockchainConfig(private val props: BlockchainProperties) {

    @Bean
    fun web3j(): Web3j =
        Web3j.build(HttpService(props.rpcUrl))

    @Bean
    fun credentials(): Credentials =
        Credentials.create(props.privateKey)

    @Bean
    fun voteContract(web3j: Web3j, credentials: Credentials): VoteContract {
        val address = props.contractAddress.ifBlank {
            val receipt = VoteContract.deploy(web3j, credentials, DefaultGasProvider()).send()
            props.contractAddress = receipt.contractAddress
            receipt.contractAddress
        }
        return VoteContract.load(address, web3j, credentials, DefaultGasProvider())
    }
}

@Configuration
@ConfigurationProperties("blockchain")
data class BlockchainProperties(
    var rpcUrl: String = "",
    var privateKey: String = "",
    var contractAddress: String = ""
)