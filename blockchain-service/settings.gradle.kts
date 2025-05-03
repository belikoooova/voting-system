rootProject.name = "blockchain-service"

pluginManagement {
    repositories {
        gradlePluginPortal()
        google()
    }

    // spring
    val `spring-boot-version`: String by settings
    val `dependency-management-version`: String by settings

    // grpc
    val `protobuf-plugin-version`: String by settings

    plugins {
        // spring
        id("org.springframework.boot") version `spring-boot-version`
        id("io.spring.dependency-management") version `dependency-management-version`

        // grpc
        id("com.google.protobuf") version `protobuf-plugin-version`
    }
}

