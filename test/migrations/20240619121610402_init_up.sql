-- up SQL here
CREATE TABLE users (
    id bigint PRIMARY KEY NOT NULL,
    name varchar(100) NOT NULL UNIQUE,
    github_url text NOT NULL,
    avatar text NOT NULL,
    bio text,
    created_at timestamp(6) with time zone DEFAULT now() NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT now() NOT NULL
);