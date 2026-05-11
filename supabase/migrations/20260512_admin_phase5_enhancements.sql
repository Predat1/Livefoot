-- ═══════════════════════════════════════════════════════════════
-- PHASE 5 : Enhancements — Notifications temps réel, Export CSV, Cache
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. Table admin_notifications ──────────────────────────────
create table if not exists public.admin_notifications (
  id uuid default gen_random_uuid() primary key,
  type text not null,                      -- 'user_signup', 'vip_purchase', 'report', 'system_alert'
  severity text default 'info',            -- 'info', 'warning', 'critical'
  title text not null,
  message text,
  data jsonb,                              -- données additionnelles
  read boolean default false,
  read_at timestamptz,
  created_at timestamptz default now()
);

create index admin_notifications_unread_idx on public.admin_notifications(read, created_at desc);
create index admin_notifications_type_idx on public.admin_notifications(type);

-- RLS
alter table public.admin_notifications enable row level security;

create policy "Admins can view notifications"
  on public.admin_notifications for select
  using (public.is_admin());

create policy "Admins can update notifications"
  on public.admin_notifications for update
  using (public.is_admin());

-- ─── 2. RPC admin_notifications_list ─────────────────────────
create or replace function public.admin_notifications_list(
  p_limit int default 50,
  p_unread_only boolean default false
)
returns table (
  id uuid,
  type text,
  severity text,
  title text,
  message text,
  data jsonb,
  read boolean,
  created_at timestamptz
)
language sql
security definer
as $$
  select 
    n.id, n.type, n.severity, n.title, n.message, n.data, n.read, n.created_at
  from public.admin_notifications n
  where 
    public.is_admin()
    and (not p_unread_only or n.read = false)
  order by n.created_at desc
  limit p_limit;
$$;

-- ─── 3. RPC admin_mark_notification_read ────────────────────
create or replace function public.admin_mark_notification_read(p_notification_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  if not public.is_admin() then
    raise exception 'Acces refuse';
  end if;
  
  update public.admin_notifications
  set read = true, read_at = now()
  where id = p_notification_id;
end;
$$;

-- ─── 4. RPC admin_export_users_csv ───────────────────────────
create or replace function public.admin_export_users_csv()
returns text
language plpgsql
security definer
as $$
declare
  result text;
begin
  if not public.is_admin() then
    raise exception 'Acces refuse';
  end if;

  select string_agg(
    u.email || ',' || 
    p.display_name || ',' || 
    p.username || ',' || 
    p.is_vip::text || ',' || 
    p.is_banned::text || ',' || 
    p.created_at::text,
    e'\n'
  )
  into result
  from auth.users u
  left join public.profiles p on u.id = p.id
  limit 10000;

  return 'email,display_name,username,is_vip,is_banned,created_at' || e'\n' || coalesce(result, '');
end;
$$;

-- ─── 5. RPC admin_purge_cache ───────────────────────────────
create or replace function public.admin_purge_cache()
returns json
language plpgsql
security definer
as $$
begin
  if not public.is_admin() then
    raise exception 'Acces refuse';
  end if;

  -- Log l'action
  insert into public.admin_audit_log (admin_id, action, target_type, target_id, details)
  values (auth.uid(), 'cache_purge', 'system', 'cache', jsonb_build_object('timestamp', now()));

  return json_build_object('success', true, 'message', 'Cache purge logged', 'timestamp', now());
end;
$$;

-- ─── 6. Trigger: Notification sur nouveau signup ─────────────
create or replace function public.notify_admin_on_signup()
returns trigger
language plpgsql
as $$
begin
  insert into public.admin_notifications (type, severity, title, message, data)
  values (
    'user_signup',
    'info',
    'Nouvel utilisateur',
    coalesce(new.display_name, 'Un utilisateur') || ' vient de s\'inscrire',
    jsonb_build_object('user_id', new.id, 'email', (select email from auth.users where id = new.id))
  );
  return new;
end;
$$;

-- Appliquer le trigger
-- drop trigger if exists admin_notify_signup on public.profiles;
-- create trigger admin_notify_signup
--   after insert on public.profiles
--   for each row execute function public.notify_admin_on_signup();

-- ─── 7. Trigger: Notification sur achat VIP ─────────────────
create or replace function public.notify_admin_on_vip_purchase()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'completed' and new.type = 'vip_subscription' then
    insert into public.admin_notifications (type, severity, title, message, data)
    values (
      'vip_purchase',
      'info',
      'Nouvel achat VIP',
      'Achat de ' || new.amount_eur || ' EUR',
      jsonb_build_object('user_id', new.user_id, 'amount', new.amount_eur, 'transaction_id', new.id)
    );
  end if;
  return new;
end;
$$;

-- drop trigger if exists admin_notify_vip on public.transactions;
-- create trigger admin_notify_vip
--   after insert or update on public.transactions
--   for each row execute function public.notify_admin_on_vip_purchase();

-- ─── 8. Seed notifications de test ────────────────────────────
insert into public.admin_notifications (type, severity, title, message, data, read)
values 
  ('system_alert', 'info', 'Migrations déployées', 'Les migrations Phase 5 sont actives', '{"version": "5.0"}', true),
  ('user_signup', 'info', 'Nouveau test', 'Test de notification', '{"test": true}', false)
on conflict do nothing;

-- ─── NOTE : Activer Realtime sur admin_notifications ───────
-- Dashboard Supabase → Database → Replication → Add table admin_notifications
