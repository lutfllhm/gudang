-- Update password untuk admin
-- Password: admin123
UPDATE users SET password = '$2a$10$JYRiUoejjhdE1RUxdxWFMualZ95mQmb73BZLxqsUJnJ5yiLPKNiE.' WHERE email = 'admin@iware.id';

SELECT 'Password updated!' as status;
SELECT id, nama, email, role, status FROM users WHERE email = 'admin@iware.id';
