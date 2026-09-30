ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

UPDATE users
SET first_name = COALESCE(first_name, split_part(COALESCE(name, ''), ' ', 1)),
    last_name = COALESCE(last_name, NULLIF(trim(substr(COALESCE(name, ''), length(split_part(COALESCE(name, ''), ' ', 1)) + 1)), '')),
    name = COALESCE(name, trim(concat_ws(' ', first_name, last_name))),
    role = COALESCE(role, 'user'),
    updated_at = NOW()
WHERE email IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_idx ON users (LOWER(email));
