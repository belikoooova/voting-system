## How to run
```
> cd dev-env
> npm install --save-dev truffle
> docker-compose up -d ganache
> npx truffle networks
> npx truffle migrate --network development

VoteContract deployed at: 0xFe1098727Bad86593Ee8713545BaE7Abb42632D6 – get the address and paste to ../blockchain-service/src/main/resources/application.yaml in contract-addresss

> cd ..
> ./gradlew clean build auth-service
> ./gradlew clean build blockchain-service
> ./gradlew clean build voting-service
> ./gradlew clean build crypto-service
> cd dev-env
> docker compose up --build -d
```