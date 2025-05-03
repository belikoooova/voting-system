\c postgres

create user auth_liquibase with password 'auth_liquibase';
create user auth with password 'auth';

create database auth with owner = 'postgres';

\c auth

grant usage, create on schema public to auth_liquibase;
alter default privileges for role auth_liquibase in schema public grant select, update, insert, delete on tables to auth;
