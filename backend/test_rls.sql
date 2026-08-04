-- 1. Quantas políticas existem no seu public schema
SELECT schemaname, tablename, count(*) AS policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY policy_count DESC;

-- 2. Se a tabela está com RLS ligado
SELECT tablename, rowsecurity
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE t.schemaname='public'
  AND tablename IN ('clients','delivery_drivers','addresses','orders','order_items','products');

-- 3. Grants para as roles padrão
SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema='public'
  AND table_name IN ('clients','delivery_drivers','addresses','orders','order_items','products')
  AND grantee IN ('anon','authenticated','service_role')
ORDER BY table_name, grantee, privilege_type;
