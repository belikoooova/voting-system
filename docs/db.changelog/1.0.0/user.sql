--liquibase formatted sql
--changeset Maria Belikova:1 logicalFilePath:1.0.0/user.sql

create table "user"
(
    id                     uuid         not null default gen_random_uuid()
        constraint pk_user primary key,
    email                  varchar(255) not null,
    password               varchar(255) not null,
    created_at                      timestamp       not null,
    last_updated_at                 timestamp       not null
);

comment on table "user" is 'Пользователь';
comment on column "user".id is 'Идентификатор';
comment on column "user".email is 'Электронная почта';
comment on column "user".password is 'Пароль';
comment on column "user".created_at is 'Время создания записи';
comment on column "user".last_updated_at is 'Время последнего обновления записи';

--rollback drop table "user";
