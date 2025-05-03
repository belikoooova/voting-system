import io.spring.gradle.dependencymanagement.dsl.DependencyManagementExtension
import com.google.protobuf.gradle.id

plugins {
    // kotlin
    kotlin("jvm") version "1.9.25"
    kotlin("plugin.spring") version "1.9.25"

    // spring
    id("org.springframework.boot")
    id("io.spring.dependency-management")

    // openapi
    id("org.openapi.generator")

    // grpc
    id("com.google.protobuf")

    // data
    id("org.liquibase.gradle")
    kotlin("plugin.jpa") version "1.9.25"
}

group = "ru.belikoooova.dvs"
version = "0.0.1-SNAPSHOT"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

repositories {
    mavenCentral()
}

// grpc
val `grpc-server-spring-boot-starter-version`: String by project
val `grpc-client-spring-boot-starter-version`: String by project
val `grpc-version`: String by project
val `javax-annotation-api-version`: String by project
val `kotlin-stub-version`: String by project
val `protobuf-version`: String by project

// openapi
val `swagger-version`: String by project

configure<DependencyManagementExtension> {
    dependencies {
        // grpc
        dependency("net.devh:grpc-server-spring-boot-starter:$`grpc-server-spring-boot-starter-version`")
        dependency("net.devh:grpc-client-spring-boot-starter:$`grpc-client-spring-boot-starter-version`")
        dependency("io.grpc:protoc-gen-grpc-java:$`grpc-version`")
        dependency("javax.annotation:javax.annotation-api:$`javax-annotation-api-version`")
        dependency("com.google.protobuf:protobuf-kotlin:$`protobuf-version`")
        dependency("io.grpc:grpc-kotlin-stub:$`kotlin-stub-version`")
        dependency("io.grpc:grpc-protobuf:$`grpc-version`")

        // openapi
        dependency("io.swagger.core.v3:swagger-core:$`swagger-version`")
    }
}

dependencies {
    // kotlin
    implementation("org.jetbrains.kotlin:kotlin-reflect")

    // grpc
    annotationProcessor("io.grpc:protoc-gen-grpc-java")
    implementation("net.devh:grpc-server-spring-boot-starter")
    implementation("net.devh:grpc-client-spring-boot-starter")
    implementation("io.grpc:grpc-protobuf")
    implementation("io.grpc:grpc-stub")
    implementation("javax.annotation:javax.annotation-api")
    implementation("com.google.protobuf:protobuf-kotlin")
    implementation("io.grpc:grpc-kotlin-stub")

    // data
    implementation("org.springframework.boot:spring-boot-starter-jdbc")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.liquibase:liquibase-core")
    implementation("org.postgresql:postgresql")

    // openapi
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("io.swagger.core.v3:swagger-core")
}

kotlin {
    compilerOptions {
        freeCompilerArgs.addAll("-Xjsr305=strict")
    }
    jvmToolchain(21)
}

sourceSets {
    main {
        kotlin {
            srcDir("src/main/kotlin")
            srcDir("$projectDir/build/generated/src/main/kotlin")
        }
        java {
            srcDir("src/main/kotlin")
            srcDir("$projectDir/build/generated/source")
        }
        proto {
            srcDir("$projectDir/src/main/resources/schema/proto")
        }
    }
}

tasks.compileKotlin {
    dependsOn(tasks.openApiGenerate)
}

tasks {
    openApiGenerate {
        generatorName = "kotlin-spring"
        packageName = "ru.belikoooova.dvs.voting.service.api.v1"
        outputDir = "$projectDir/build/generated"
        apiPackage = "ru.belikoooova.dvs.voting.service.api.v1"
        modelPackage = "ru.belikoooova.dvs.voting.service.api.v1.model"
        inputSpec = "$projectDir/src/main/resources/static/openapi/voting-service-v1.yaml"
        additionalProperties = mapOf(
            "useSpringBoot3" to true,
            "useSpringFox" to false,
            "useBeanValidation" to false,
            "gradleBuildFile" to false,
            "useSwaggerUI" to false,
            "reactive" to false,
            "library" to "spring-boot",
            "interfaceOnly" to true,
            "openApiNullable" to false,
            "exceptionHandler" to false,
            "dateLibrary" to "java21",
            "serializableModel" to "true",
            "serializationLibrary" to "jackson",
            "documentationProvider" to "springdoc",
            "annotationLibrary" to "swagger2",
            "useTags" to true,
            "hideGenerationTimestamp" to false,
            "enumPropertyNaming" to "UPPERCASE",
            "modelMutable" to true,
        )
    }
}

protobuf {
    protoc {
        val `protobuf-version`: String by project

        artifact = "com.google.protobuf:protoc:$`protobuf-version`"
    }
    plugins {
        id("grpc") {
            val `protoc-gen-grpc-java-version`: String by project

            artifact = if (osdetector.os == "osx") {
                "io.grpc:protoc-gen-grpc-java:$`protoc-gen-grpc-java-version`:osx-x86_64"
            } else {
                "io.grpc:protoc-gen-grpc-java:$`protoc-gen-grpc-java-version`"
            }
        }
        id("grpckt") {
            val `protoc-gen-grpc-kotlin-version`: String by project

            artifact = "io.grpc:protoc-gen-grpc-kotlin:$`protoc-gen-grpc-kotlin-version`:jdk8@jar"
        }
    }
    generateProtoTasks {
        all().forEach {
            it.plugins {
                id("grpc")
                id("grpckt")
            }
        }
    }
}