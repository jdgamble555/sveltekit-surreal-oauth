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



DEFINE FUNCTION OVERWRITE fn::github_upsert(
    $code: string,
    $github_client_id: string,
    $github_secret_id: string
) {
    -- 1) Exchange code for access token
    LET $token_res = http::post(
        'https://github.com/login/oauth/access_token',
        {
            "client_id": $github_client_id,
            "client_secret": $github_secret_id,
            "code": $code
        },
        {
            "Accept": "application/vnd.github+json"
        }
    );

    LET $access_token = $token_res.access_token;

    -- If GitHub didn't return a token, bubble up what it did return
    IF $access_token = NONE {
        RETURN $token_res;
    };

    -- 2) Fetch GitHub user with that token
    LET $headers = {
        "Accept": "application/vnd.github+json",
        "Authorization": string::concat("Bearer ", $access_token)
    };

    LET $u = http::get("https://api.github.com/user", $headers);

    IF $u = NONE {
        RETURN {
            stage: "user_fetch_failed",
            token_res: $token_res
        };
    };

    -- 3) Resolve email and return ONLY that
    LET $email =
        IF $u.email != NONE {
            $u.email
        } ELSE {
            string::concat($u.login, "@users.noreply.github")
        };

    -- 4) Deterministic user id
    LET $id = type::thing("users", ['github', $u.id]);

    -- 4.1) Check if user already exists
    LET $existing = (SELECT * FROM $id)[0];

    -- 5) UPSERT user
    LET $user =
        IF $existing = NONE THEN
            -- New record: include password so schema (password: string) is satisfied
            (UPSERT $id CONTENT {
                username:   $email,
                name:       $u.name,
                avatar_url: $u.avatar_url,
                profil_url: $u.html_url,
                password:   rand::string(32)
            } RETURN AFTER)[0]
        ELSE
            -- Existing record: don't touch password
            (UPSERT $id MERGE {
                username:   $email,
                name:       $u.name,
                avatar_url: $u.avatar_url,
                profil_url: $u.html_url
            } RETURN AFTER)[0]
        END;

    -- 6) Return user record
    RETURN $user;
};


DEFINE ACCESS github ON DATABASE TYPE RECORD
    SIGNUP (
        fn::github_upsert($code, $github_client_id, $github_secret_id)
    )
    SIGNIN (
        fn::github_upsert($code, $github_client_id, $github_secret_id)
    )
    DURATION
        FOR TOKEN 1h,
        FOR SESSION NONE;
;
