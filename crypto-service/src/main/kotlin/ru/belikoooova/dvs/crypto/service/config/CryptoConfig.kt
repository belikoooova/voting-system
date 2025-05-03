package ru.belikoooova.dvs.crypto.service.config

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.context.annotation.Configuration
import org.springframework.stereotype.Component

@Configuration
@ConfigurationProperties(prefix = "crypto")
data class CryptoProperties(
    var publicKey: String = "",
    var privateKey: String = ""
)