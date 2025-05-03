import io.spring.gradle.dependencymanagement.dsl.DependencyManagementExtension
import com.google.protobuf.gradle.id

plugins {
    kotlin("jvm") version "1.9.25"
    kotlin("plugin.spring") version "1.9.25"
    id("org.springframework.boot") version "3.4.3"
    id("io.spring.dependency-management") version "1.1.7"
    id("org.openapi.generator")
    id("com.google.protobuf")
    id("org.liquibase.gradle")
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

val `jjwt-version`: String by project
val `grpc-server-spring-boot-starter-version`: String by project
val `grpc-client-spring-boot-starter-version`: String by project
val `grpc-version`: String by project
val `javax-annotation-api-version`: String by project
val `kotlin-stub-version`: String by project
val `protobuf-version`: String by project
val `swagger-version`: String by project
val `envoy-version`: String by project

configure<DependencyManagementExtension> {
    dependencies {
        dependency("io.jsonwebtoken:jjwt-api:$`jjwt-version`")
        dependency("io.jsonwebtoken:jjwt-impl:$`jjwt-version`")
        dependency("io.jsonwebtoken:jjwt-jackson:$`jjwt-version`")
        dependency("net.devh:grpc-server-spring-boot-starter:$`grpc-server-spring-boot-starter-version`")
        dependency("net.devh:grpc-client-spring-boot-starter:$`grpc-client-spring-boot-starter-version`")
        dependency("io.grpc:protoc-gen-grpc-java:$`grpc-version`")
        dependency("javax.annotation:javax.annotation-api:$`javax-annotation-api-version`")
        dependency("com.google.protobuf:protobuf-kotlin:$`protobuf-version`")
        dependency("io.grpc:grpc-kotlin-stub:$`kotlin-stub-version`")
        dependency("io.grpc:grpc-protobuf:$`grpc-version`")
        dependency("io.swagger.core.v3:swagger-core:$`swagger-version`")
        dependency("io.envoyproxy.controlplane:api:$`envoy-version`")
    }
}

dependencies {
    annotationProcessor("io.grpc:protoc-gen-grpc-java")

    implementation("org.springframework.boot:spring-boot-starter-jdbc")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.jetbrains.kotlin:kotlin-reflect")
    implementation("org.liquibase:liquibase-core")
    implementation("io.jsonwebtoken:jjwt-api")
    implementation("io.jsonwebtoken:jjwt-impl")
    implementation("io.jsonwebtoken:jjwt-jackson")
    implementation("net.devh:grpc-server-spring-boot-starter")
    implementation("net.devh:grpc-client-spring-boot-starter")
    implementation("io.grpc:grpc-protobuf")
    implementation("io.grpc:grpc-stub")
    implementation("javax.annotation:javax.annotation-api")
    implementation("com.google.protobuf:protobuf-kotlin")
    implementation("io.grpc:grpc-kotlin-stub")
    implementation("io.swagger.core.v3:swagger-core")
    implementation("org.postgresql:postgresql")
    implementation("io.envoyproxy.controlplane:api")
}

kotlin {
    compilerOptions {
        freeCompilerArgs.addAll("-Xjsr305=strict")
    }
}

sourceSets {
    main {
        kotlin {
            srcDir("src/main/kotlin")
            srcDir("$projectDir/build/generated/src/main/kotlin")
        }
    }
}

tasks.compileKotlin {
    dependsOn(tasks.openApiGenerate)
}

tasks {
    openApiGenerate {
        generatorName = "kotlin-spring"
        packageName = "ru.belikoooova.dvs.auth.service.api.v1"
        outputDir = "$projectDir/build/generated"
        apiPackage = "ru.belikoooova.dvs.auth.service.api.v1"
        modelPackage = "ru.belikoooova.dvs.auth.service.api.v1.model"
        inputSpec = "$projectDir/src/main/resources/static/openapi/auth-service-v1.yaml"
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


sourceSets {
    main {
        java.srcDirs(
            "src/main/kotlin",
            "$projectDir/build/generated/source"
        )
        proto {
            srcDir("$projectDir/src/main/resources/schema/proto")
        }
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

kotlin { jvmToolchain(21) }
