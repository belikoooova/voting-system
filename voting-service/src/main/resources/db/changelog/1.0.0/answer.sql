--liquibase formatted sql
--changeset Maria Belikova:1 logicalFilePath:1.0.0/answer.sql

create table answer
(
    id              uuid      not null default gen_random_uuid()
        constraint pk_answer primary key,
    voting_id       uuid      references voting (id) on delete cascade,
    option_text     text      not null,
    created_at      timestamp not null,
    last_updated_at timestamp not null
);

comment on table answer is 'Вариант ответа';
comment on column answer.id is 'Идентификатор';
comment on column answer.voting_id is 'Идентификатор голосования';
comment on column answer.option_text is 'Вариант ответа';
comment on column answer.created_at is 'Время создания записи';
comment on column answer.last_updated_at is 'Время последнего обновления записи';

--rollback drop table answer;
