-- Run AFTER creating your user in Authentication → Users.
-- Replace the email with the one you used there.
insert into public.admins (user_id)
select id from auth.users where email = 'YOUR_EMAIL_HERE';

-- Check it worked: this should return one row.
select u.email from public.admins a join auth.users u on u.id = a.user_id;
