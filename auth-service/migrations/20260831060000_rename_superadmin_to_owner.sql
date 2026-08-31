-- SuperAdmin diganti Owner. Urutan wewenang: Maintainer > Owner > Admin > Member > User.
-- Constraint dilepas dulu supaya baris lama bisa dipindahkan ke nilai baru.
ALTER TABLE users.users DROP CONSTRAINT IF EXISTS users_role_check;

UPDATE users.users SET role = 'Owner' WHERE role = 'SuperAdmin';

ALTER TABLE users.users ADD CONSTRAINT users_role_check CHECK (role IN ('Maintainer', 'Owner', 'Admin', 'Member', 'User'));
