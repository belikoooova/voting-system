package ru.belikoooova.dws.blockchain.service

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.boot.runApplication

@SpringBootApplication
@EnableConfigurationProperties
class BlockchainServiceApplication

fun main(args: Array<String>) {
    System.setProperty("org.web3j.ens.enabled", "false")
    runApplication<BlockchainServiceApplication>(*args)
}
