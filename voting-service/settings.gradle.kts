rootProject.name = "voting-service"

pluginManagement {
    repositories {
        gradlePluginPortal()
        google()
    }

    // spring
    val `spring-boot-version`: String by settings
    val `dependency-management-version`: String by settings

    // openapi
    val `openapi-plugin-version`: String by settings

    // data
    val `jpa-version`: String by settings
    val `liquibase-plugin-version`: String by settings

    // grpc
    val `protobuf-plugin-version`: String by settings

    plugins {
        // spring
        id("org.springframework.boot") version `spring-boot-version`
        id("io.spring.dependency-management") version `dependency-management-version`

        // openapi
        id("org.openapi.generator") version `openapi-plugin-version`

        // data
        id("org.jetbrains.kotlin.plugin.jpa") version `jpa-version`
        id("org.liquibase.gradle") version `liquibase-plugin-version`

        // grpc
        id("com.google.protobuf") version `protobuf-plugin-version`
    }
}

