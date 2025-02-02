Пользователь А
1. /login или /register, получает access-token (auth-service) -> при register запись в user
2. /my/votes POST создает голосование (voting-service) -> запись в vote

Пользователь B
1. /login или /register, получает access-token
2. /votes GET смотрит все голосования (voting-service) -> чтение из vote
3. /votes/{vote_id}/request/vote (voting-service) -> запись в user_vote_permission со статусом ASKED

Пользователь А
1. /my/votes/permission-requests GET -> чтение из user_vote_permission (voting-service)
2. /my/votes/permission-requests POST -> изменение статусов в user_vote_permission на APPROVED/REJECTED (voting-service)

Пользователь B
1. /votes/{vote_id}/vote
  a) Фронт проверяет право на голосование
    i. Генерирует пару ключей
    ii. Слепит публичный ключ
    iii. /sign POST (crypto-service) -> обращение по grpc к voting-service
    iv. Расслепляет публичный ключ
  б) Фронт голосует
    i. /get-system-public-key GET (crypto-service) -> обращение к БД или Редис (где хранится паблик ки системы)?
    ii. Шифрует голос с помощью полученного system public key
    iii. /get-zero-knowledge-proof GET (crypto-service)
    iv. Наконец отправляет голос в voting-service
  в) voting-service верифицирует через crypto-service
    i. подпись
    ii. zk-proof
    iii. кидает в блокчейн
    iv. кидает ответ пользователю? (мб асинхронно это сделать)
2. /votes/{vote_id}/checkVote -> в voting-service (через blockchain)
3. /votes/{vote_id}/results -> в voting-service (через blockchain)

____________________________

## envoy

## auth-service
### REST
  - /me GET
  - /register POST
  - /login POST
### gRPC
  - /check 
### DB
  - user (id, login, password)

## voting-service
### REST
  - /my/votings POST
  - /my/votings GET
  - /my/votings/{votingId} GET
  - /my/votings/{votingId} PUT
  - /my/votings/{votingId} DELETE
  - /my/votings/requests/vote GET
  - /my/votings/requests/vote POST
  - /my/votings/requests/watch GET
  - /my/votings/requests/watch POST
  - /votings GET
  - /votings/{votingId} GET
  - /votings/{votingId}/request/vote POST
  - /votings/{votingId}/request/watch POST
  - /votings/{votingId}/vote POST
  - /votings/{votingId}/getToken GET
  - /votings/{votingId}/checkVote POST
  - /votings/{votingId}/checkAllVotes POST
  - /votings/{votingId}/results GET
### gRPC
  - /checkPermission
### DB
  - voting (id, name, description, question, startDate, endDate, creator)
  - answer (id, voting_id, text)
  - user_voting_permission (id, user_id, vote_id, type, status)

## crypto-service
### REST
  - /sign POST
  - /publicKey GET
  - /zkProof POST
### gRPC
  - /checkSign 
  - /checkZkProof

## blockchain-service
### gRPC
  - /save POST
  - /voting GET (by token)
  - /voting/block GET (by token)
### DB
  - blockchain
















