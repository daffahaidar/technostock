ALTER TABLE users.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users.users ADD CONSTRAINT users_role_check CHECK (role IN ('Admin', 'SuperAdmin', 'User', 'Maintainer', 'Member'));
