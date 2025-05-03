rootProject.name = "auth-service"

pluginManagement {
    repositories {
        gradlePluginPortal()
        google()
    }

    val `spring-boot-version`: String by settings
    val `dependency-management-version`: String by settings
    val `openapi-plugin-version`: String by settings
    val `jpa-version`: String by settings
    val `protobuf-plugin-version`: String by settings
    val `liquibase-plugin-version`: String by settings

    plugins {
        id("org.springframework.boot") version `spring-boot-version`
        id("io.spring.dependency-management") version `dependency-management-version`
        id("org.openapi.generator") version `openapi-plugin-version`
        id("org.jetbrains.kotlin.plugin.jpa") version `jpa-version`
        id("com.google.protobuf") version `protobuf-plugin-version`
        id("org.liquibase.gradle") version `liquibase-plugin-version`
    }
}

