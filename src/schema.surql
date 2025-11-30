-- =====================================
-- USERS TABLE
-- =====================================

DEFINE TABLE users SCHEMAFULL
    PERMISSIONS
        FOR select WHERE $auth.id = id OR $auth.role = 'admin'
        FOR create, update, delete WHERE $auth.role = 'admin' OR $auth.scope = 'auth';

DEFINE FIELD email
    ON TABLE users
    TYPE string
    ASSERT $value != '' AND string::is::email($value)
    PERMISSIONS
        FOR select, create, update, delete FULL;

DEFINE FIELD password
    ON TABLE users
    TYPE string
    ASSERT $value != ''
    PERMISSIONS
        FOR select, create, update, delete FULL;

DEFINE FIELD name
    ON TABLE users
    TYPE option<string>
    PERMISSIONS
        FOR select, create, update, delete FULL;

DEFINE FIELD avatar_url
    ON TABLE users
    TYPE option<string>
    PERMISSIONS
        FOR select, create, update, delete FULL;

DEFINE FIELD OVERWRITE created_at
  ON TABLE users
  TYPE datetime
  DEFAULT time::now()
    PERMISSIONS
        FOR select, create, update, delete FULL;

DEFINE FIELD OVERWRITE updated_at
    ON TABLE users
    TYPE datetime
    VALUE time::now()
    PERMISSIONS
        FOR select, create, update, delete FULL;

DEFINE INDEX users_email_unique
    ON TABLE users
    COLUMNS email
    UNIQUE;

DEFINE ACCESS OVERWRITE user
    ON DATABASE
    TYPE RECORD
    SIGNUP (
        CREATE users CONTENT {
            email:    string::lowercase($email),
            password: crypto::argon2::generate($password)
        } RETURN AFTER
    )
    SIGNIN (
        SELECT * FROM users
        WHERE email = string::lowercase($email)
          AND crypto::argon2::compare(password, $password)
        LIMIT 1
    )
    DURATION
        FOR TOKEN 1h,
        FOR SESSION NONE;

-- =====================================
-- AUTH_ACCOUNTS TABLE
-- (per provider login -> user)
-- =====================================

DEFINE TABLE auth_accounts SCHEMAFULL
    PERMISSIONS
        FOR select WHERE $auth.role = 'admin' OR $auth.scope = 'auth'
        FOR create, update, delete WHERE $auth.role = 'admin' OR $auth.scope = 'auth';

DEFINE FIELD user
    ON TABLE auth_accounts
    TYPE record<users>
    ASSERT $value != NONE
    PERMISSIONS
        FOR select, create, update, delete FULL;

DEFINE FIELD provider
    ON TABLE auth_accounts
    TYPE string
    ASSERT $value != ''
    PERMISSIONS
        FOR select, create, update, delete FULL;

DEFINE FIELD provider_id
    ON TABLE auth_accounts
    TYPE string
    ASSERT $value != ''
    PERMISSIONS
        FOR select, create, update, delete FULL;

DEFINE FIELD created_at
    ON TABLE auth_accounts
    TYPE datetime
    DEFAULT time::now()
    PERMISSIONS
        FOR select, create, update, delete FULL;

DEFINE INDEX auth_accounts_provider_unique
    ON TABLE auth_accounts
    COLUMNS provider, provider_id
    UNIQUE;

DEFINE INDEX auth_accounts_user_idx
    ON TABLE auth_accounts
    COLUMNS user;

-- =====================================
-- AUTH_PROVIDERS TABLE
-- (stores client/secret for GitHub etc.)
-- =====================================

DEFINE TABLE auth_providers SCHEMAFULL
    PERMISSIONS
        FOR select WHERE $auth.role = 'admin' OR $auth.scope = 'auth'
        FOR create, update, delete WHERE $auth.role = 'admin';

DEFINE FIELD provider
    ON TABLE auth_providers
    TYPE string
    ASSERT $value != ''
    PERMISSIONS
        FOR select, create, update, delete FULL;

DEFINE FIELD client_id
    ON TABLE auth_providers
    TYPE string
    ASSERT $value != ''
    PERMISSIONS
        FOR select, create, update, delete FULL;

DEFINE FIELD client_secret
    ON TABLE auth_providers
    TYPE string
    ASSERT $value != ''
    PERMISSIONS
        FOR select, create, update, delete FULL;

DEFINE INDEX auth_providers_provider_unique
    ON TABLE auth_providers
    COLUMNS provider
    UNIQUE;

CREATE auth_providers SET
    provider = "github",
    client_id = "<YOUR_GITHUB_CLIENT_ID>",
    client_secret = "<YOUR_GITHUB_CLIENT_SECRET>";



DEFINE FUNCTION OVERWRITE fn::github_login(
    $code: string
) {
    ------------------------------------------------------------
    -- 0) Load GitHub OAuth config from auth_providers
    ------------------------------------------------------------
    LET $provider = (
        SELECT client_id, client_secret
        FROM auth_providers
        WHERE provider = "github"
        LIMIT 1
    )[0];

    IF $provider = NONE {
        THROW {
            stage:   "missing_github_config",
            message: "No auth_providers row found for provider 'github'"
        };
    };

    IF $provider.client_id = NONE OR $provider.client_secret = NONE {
        THROW {
            stage:   "invalid_github_config",
            message: "auth_providers.github is missing client_id or client_secret",
            provider: $provider
        };
    };

    LET $github_client_id  = $provider.client_id;
    LET $github_secret_id  = $provider.client_secret;

    ------------------------------------------------------------
    -- 1) Exchange code for access token
    ------------------------------------------------------------
    LET $token_res = http::post(
        "https://github.com/login/oauth/access_token",
        {
            "client_id":     $github_client_id,
            "client_secret": $github_secret_id,
            "code":          $code
        },
        {
            "Accept": "application/vnd.github+json"
        }
    );

    IF $token_res = NONE {
        THROW {
            stage:   "token_request_failed",
            message: "GitHub /access_token returned NONE",
            token_res: $token_res
        };
    };

    LET $access_token = $token_res.access_token;

    IF $access_token = NONE {
        THROW {
            stage:   "missing_access_token",
            message: "GitHub did not return access_token",
            token_res: $token_res
        };
    };

    ------------------------------------------------------------
    -- 2) Fetch GitHub user profile
    ------------------------------------------------------------
    LET $headers = {
        "Accept":       "application/vnd.github+json",
        "Authorization": string::concat("Bearer ", $access_token)
    };

    LET $u = http::get("https://api.github.com/user", $headers);

    IF $u = NONE {
        THROW {
            stage:   "user_fetch_failed",
            message: "GitHub /user returned NONE",
            token_res: $token_res
        };
    };

    IF $u.id = NONE {
        THROW {
            stage:   "missing_github_id",
            message: "GitHub user has no id",
            user: $u
        };
    };

    ------------------------------------------------------------
    -- 3) Require email
    ------------------------------------------------------------
    IF $u.email = NONE {
        THROW {
            stage:   "missing_email",
            message: "GitHub account has no public email associated",
            user: $u
        };
    };

    LET $email     = string::lowercase($u.email);
    LET $github_id = type::string($u.id);

    ------------------------------------------------------------
    -- 4) If GitHub account already linked → load & return user
    ------------------------------------------------------------
    LET $existing_account = (
        SELECT *
        FROM auth_accounts
        WHERE provider    = "github"
          AND provider_id = $github_id
        LIMIT 1
    )[0];

    IF $existing_account != NONE {
        IF $existing_account.user = NONE {
            THROW {
                stage:   "linked_account_missing_user_ref",
                message: "auth_account exists but has no user field",
                account: $existing_account
            };
        };

        LET $user_from_account = (
            SELECT *
            FROM $existing_account.user
            LIMIT 1
        )[0];

        IF $user_from_account = NONE {
            THROW {
                stage:   "linked_account_missing_user",
                message: "auth_account exists but user record not found",
                account: $existing_account
            };
        };

        RETURN $user_from_account;
    };

    ------------------------------------------------------------
    -- 5) No auth_account yet → try to find user by email
    ------------------------------------------------------------
    LET $existing_user = (
        SELECT *
        FROM users
        WHERE email = $email
        LIMIT 1
    )[0];

    IF $existing_user != NONE {
        LET $linked_auth_account = (
            CREATE auth_accounts CONTENT {
                user:        $existing_user.id,
                provider:    "github",
                provider_id: $github_id
            } RETURN AFTER
        )[0];

        IF $linked_auth_account = NONE OR $linked_auth_account.id = NONE {
            THROW {
                stage:   "auth_account_link_existing_failed",
                message: "Failed to create auth_accounts row for existing user",
                user:    $existing_user
            };
        };

        RETURN $existing_user;
    };

    ------------------------------------------------------------
    -- 6) Still no user → create new user, link, return
    ------------------------------------------------------------
    LET $new_user = (
        CREATE users CONTENT {
            email:      $email,
            name:       $u.name,
            avatar_url: $u.avatar_url,
            password:   rand::string(32)
        } RETURN AFTER
    )[0];

    IF $new_user = NONE {
        THROW {
            stage:       "user_creation_failed",
            message:     "Failed to create user record from GitHub data",
            github_user: $u
        };
    };

    IF $new_user.id = NONE {
        THROW {
            stage:   "user_creation_missing_id",
            message: "Created users row has no id",
            user:    $new_user
        };
    };

    LET $new_auth_account = (
        CREATE auth_accounts CONTENT {
            user:        $new_user.id,
            provider:    "github",
            provider_id: $github_id
        } RETURN AFTER
    )[0];

    IF $new_auth_account = NONE OR $new_auth_account.id = NONE {
        THROW {
            stage:   "auth_account_creation_failed",
            message: "Failed to create auth_accounts row for new user",
            user:    $new_user
        };
    };

    RETURN $new_user;
};

DEFINE ACCESS OVERWRITE github ON DATABASE TYPE RECORD
    SIGNUP (
        fn::github_login($code)
    )
    SIGNIN (
        fn::github_login($code)
    )
    DURATION
        FOR TOKEN 1h,
        FOR SESSION NONE;
;