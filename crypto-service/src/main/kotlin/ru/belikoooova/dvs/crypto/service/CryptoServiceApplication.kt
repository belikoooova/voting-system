package ru.belikoooova.dvs.crypto.service

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.boot.runApplication

@EnableConfigurationProperties
@SpringBootApplication
class CryptoServiceApplication

fun main(args: Array<String>) {
    runApplication<CryptoServiceApplication>(*args)
}
