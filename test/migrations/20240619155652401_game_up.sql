-- up SQL here
CREATE TABLE games (
    id  bigint PRIMARY KEY,
    name varchar(40) NOT NULL,
    author_name varchar(100) REFERENCES users (name) ON UPDATE CASCADE NOT NULL,
    url varchar(255),
    avatar_url varchar(255),
    about varchar(255),
    info varchar(2000),
    up_votes bigint NOT NULL DEFAULT 0,
    down_votes bigint NOT NULL DEFAULT 0,
    tags varchar(20)[],
    rom varchar(1000) NOT NULL,
    created_at timestamp(6) with time zone DEFAULT now() NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT now() NOT NULL
);