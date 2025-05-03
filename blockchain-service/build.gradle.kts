import io.spring.gradle.dependencymanagement.dsl.DependencyManagementExtension
import com.google.protobuf.gradle.id
import org.web3j.solidity.gradle.plugin.SoliditySourceSet

plugins {
    // kotlin
    kotlin("jvm") version "1.9.25"
    kotlin("plugin.spring") version "1.9.25"

    // spring
    id("org.springframework.boot")
    id("io.spring.dependency-management")

    // grpc
    id("com.google.protobuf")

    // blockchain
    id("org.web3j") version "4.14.0"
}

group = "ru.belikoooova.dvs"
version = "0.0.1-SNAPSHOT"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

repositories {
    gradlePluginPortal()
    mavenCentral()
}

// grpc
val `grpc-server-spring-boot-starter-version`: String by project
val `grpc-version`: String by project
val `javax-annotation-api-version`: String by project
val `kotlin-stub-version`: String by project
val `protobuf-version`: String by project

// blockchain
val `web3j-version`: String by project

configure<DependencyManagementExtension> {
    dependencies {
        // grpc
        dependency("net.devh:grpc-server-spring-boot-starter:$`grpc-server-spring-boot-starter-version`")
        dependency("io.grpc:protoc-gen-grpc-java:$`grpc-version`")
        dependency("javax.annotation:javax.annotation-api:$`javax-annotation-api-version`")
        dependency("com.google.protobuf:protobuf-kotlin:$`protobuf-version`")
        dependency("io.grpc:grpc-kotlin-stub:$`kotlin-stub-version`")
        dependency("io.grpc:grpc-protobuf:$`grpc-version`")

        // blockchain
        dependency("org.web3j:core:$`web3j-version`")
    }
}

dependencies {
    // kotlin
    implementation("org.jetbrains.kotlin:kotlin-reflect:1.9.0")
    implementation("org.jetbrains.kotlin:kotlin-stdlib:1.9.0")

    // grpc
    annotationProcessor("io.grpc:protoc-gen-grpc-java")
    implementation("net.devh:grpc-server-spring-boot-starter")
    implementation("io.grpc:grpc-protobuf")
    implementation("io.grpc:grpc-stub")
    implementation("javax.annotation:javax.annotation-api")
    implementation("com.google.protobuf:protobuf-kotlin")
    implementation("io.grpc:grpc-kotlin-stub")

    // blockchain
    implementation("org.web3j:core")
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

web3j {
    generatedFilesBaseDir = "$projectDir/build/generated"
    generatedPackageName = "$group.blockchain.service.contract"
}

afterEvaluate {
    tasks.named("extractSolidityImports") {
        dependsOn(tasks.named("generateProto"))
        dependsOn(tasks.named("processResources"))
    }

    tasks.matching { it.name == "extractSolidityImports" }.configureEach {
        dependsOn(tasks.named("generateProto"))
        dependsOn(tasks.named("processResources"))
    }
}

tasks.compileKotlin {
    dependsOn(tasks.named("generateContractWrappers"))
}
