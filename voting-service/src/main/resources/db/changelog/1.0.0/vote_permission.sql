--liquibase formatted sql
--changeset Maria Belikova:1 logicalFilePath:1.0.0/vote_permission.sql

create table vote_permission
(
    id              uuid         not null default gen_random_uuid()
        constraint pk_vote_permission primary key,
    user_id         uuid         not null,
    voting_id       uuid         references voting (id) on delete cascade,
    status          text         not null
        constraint ch_vote_permission_status check (status in ('REQUESTED', 'APPROVED', 'REJECTED', 'CREATOR')),
    token           varchar(255) null,
    created_at      timestamp    not null,
    last_updated_at timestamp    not null,
    is_used         boolean      not null
);

comment on table vote_permission is 'Разрешение на право участвовать в голосовании';
comment on column vote_permission.id is 'Идентификатор';
comment on column vote_permission.user_id is 'Идентификатор пользователя';
comment on column vote_permission.voting_id is 'Идентификатор голосования';
comment on column vote_permission.status is 'Статус';
comment on column vote_permission.token is 'Уникальный токен, связывающий голосование и пользователя';
comment on column vote_permission.created_at is 'Время создания записи';
comment on column vote_permission.last_updated_at is 'Время последнего обновления записи';
comment on column vote_permission.is_used is 'Голосовал ли уже пользователь';

--rollback drop table watch_permission;
