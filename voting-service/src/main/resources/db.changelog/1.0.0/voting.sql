--liquibase formatted sql
--changeset Maria Belikova:1 logicalFilePath:1.0.0/voting.sql
create table voting
(
    id              uuid         not null default gen_random_uuid()
        constraint pk_voting primary key,
    name            varchar(255) not null,
    description     text         not null,
    question        text         not null,
    start_at        timestamp    not null,
    end_at          timestamp    not null,
    created_by      uuid         not null,
    created_at      timestamp    not null,
    last_updated_at timestamp    not null
);

comment on table voting is 'Голосование';
comment on column voting.id is 'Идентификатор';
comment on column voting.name is 'Название';
comment on column voting.description is 'Описание';
comment on column voting.question is 'Вопрос';
comment on column voting.start_at is 'Начало';
comment on column voting.end_at is 'Окончание';
comment on column voting.created_by is 'Создатель';
comment on column voting.created_at is 'Время создания записи';
comment on column voting.last_updated_at is 'Время последнего обновления записи';

--rollback drop table voting;
