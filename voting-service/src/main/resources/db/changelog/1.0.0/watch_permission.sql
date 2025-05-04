--liquibase formatted sql
--changeset Maria Belikova:1 logicalFilePath:1.0.0/watch_permission.sql

create table watch_permission
(
    id              uuid      not null default gen_random_uuid()
        constraint pk_watch_permission primary key,
    user_id         uuid      not null,
    voting_id       uuid      references voting (id) on delete cascade,
    status          text      not null
        constraint ch_watch_permission_status check (status in ('REQUESTED', 'APPROVED', 'REJECTED', 'CREATOR')),
    created_at      timestamp not null,
    last_updated_at timestamp not null
);

comment on table watch_permission is 'Разрешение на право наблюдать за голосованием';
comment on column watch_permission.id is 'Идентификатор';
comment on column watch_permission.user_id is 'Идентификатор пользователя';
comment on column watch_permission.voting_id is 'Идентификатор голосования';
comment on column watch_permission.status is 'Статус';
comment on column watch_permission.created_at is 'Время создания записи';
comment on column watch_permission.last_updated_at is 'Время последнего обновления записи';

--rollback drop table watch_permission;
