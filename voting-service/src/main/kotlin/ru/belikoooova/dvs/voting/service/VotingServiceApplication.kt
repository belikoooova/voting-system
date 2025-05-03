package ru.belikoooova.dvs.voting.service

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.cache.annotation.EnableCaching

@SpringBootApplication
@EnableCaching
class VotingServiceApplication

fun main(args: Array<String>) {
    runApplication<VotingServiceApplication>(*args)
}
