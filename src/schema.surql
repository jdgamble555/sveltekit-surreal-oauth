-- 🔐 ACCESS RULE
DEFINE ACCESS user
    ON DATABASE
    TYPE RECORD
    SIGNUP (
        CREATE users SET
            username = $username,
            password = crypto::argon2::generate($password)
    )
    SIGNIN (
        SELECT * FROM users
        WHERE username = $username
          AND crypto::argon2::compare(password, $password)
    )
    WITH JWT
        DURATION
            FOR TOKEN 1h,
            FOR SESSION NONE;

-- 👤 USERS TABLE
DEFINE TABLE users
    TYPE NORMAL
    SCHEMAFULL
    PERMISSIONS
        FOR select, update WHERE id = $auth.id,
        FOR create, delete NONE;

-- 🧩 FIELD DEFINITIONS
DEFINE FIELD username
    ON users
    TYPE string
    ASSERT $value != ''
    PERMISSIONS FULL;

DEFINE FIELD password
    ON users
    TYPE string
    ASSERT $value != ''
    PERMISSIONS FULL;

-- 🔎 UNIQUE INDEX
DEFINE INDEX usernameIndex
    ON TABLE users
    COLUMNS username
    UNIQUE;