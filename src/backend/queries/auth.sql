-- name: GetUserByID :one
SELECT
    id,
    email,
    username,
    avatar_url,
    last_login_at,
    created_at,
    updated_at
FROM users
WHERE id = $1;

-- name: GetUserByEmail :one
SELECT
    id,
    email,
    username,
    avatar_url,
    last_login_at,
    created_at,
    updated_at
FROM users
WHERE email = $1;

-- name: CreateUser :one
INSERT INTO users (email, username, avatar_url)
VALUES ($1, $2, $3)
RETURNING id;

-- name: UpdateLastLogin :exec
UPDATE users
SET last_login_at = now(), updated_at = now()
WHERE id = $1;

-- name: GetOAuthAccountByProvider :one
SELECT
    oa.id,
    oa.user_id,
    oa.provider,
    oa.provider_user_id,
    oa.provider_username,
    oa.access_token,
    oa.scope,
    oa.created_at,
    oa.updated_at
FROM oauth_accounts oa
WHERE oa.provider = $1 AND oa.provider_user_id = $2;

-- name: GetOAuthAccountByUserID :one
SELECT
    oa.id,
    oa.user_id,
    oa.provider,
    oa.provider_user_id,
    oa.provider_username,
    oa.access_token,
    oa.scope,
    oa.created_at,
    oa.updated_at
FROM oauth_accounts oa
WHERE oa.user_id = $1 AND oa.provider = $2;

-- name: UpsertOAuthAccount :one
INSERT INTO oauth_accounts (user_id, provider, provider_user_id, provider_username, access_token, scope)
VALUES ($1, $2, $3, $4, $5, $6)
ON CONFLICT (provider, provider_user_id) DO UPDATE SET
    provider_username = EXCLUDED.provider_username,
    access_token = EXCLUDED.access_token,
    scope = EXCLUDED.scope,
    updated_at = now()
RETURNING id;
