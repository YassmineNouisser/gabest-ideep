import { supabase, isSupabaseConfigured } from './supabase';

export type RoleId = 'farmer' | 'industry' | 'recycling' | 'admin';
export type UserStatus = 'active' | 'pending' | 'suspended';

export type PlatformUser = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  role: RoleId;
  status: UserStatus;
  zone: string;
  volume: string;
  joined: string;
};

export type NewPlatformUser = {
  name: string;
  email: string;
  role: RoleId;
  status: UserStatus;
  zone?: string;
  volume?: string;
};

const TABLE = 'platform_users';

export { isSupabaseConfigured };

export async function fetchUsers(): Promise<PlatformUser[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as PlatformUser[];
}

export async function createUser(u: NewPlatformUser): Promise<PlatformUser> {
  const payload = {
    name: u.name,
    email: u.email,
    role: u.role,
    status: u.status,
    zone: u.zone?.trim() || '—',
    volume: u.volume?.trim() || '—'
  };
  const { data, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as PlatformUser;
}

export async function updateUser(
  id: string,
  patch: Partial<Pick<PlatformUser, 'role' | 'status' | 'name' | 'email' | 'zone' | 'volume'>>
): Promise<PlatformUser> {
  const { data, error } = await supabase
    .from(TABLE)
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as PlatformUser;
}

export async function deleteUser(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw error;
}

export function subscribeUsers(onChange: () => void) {
  if (!isSupabaseConfigured) return () => {};
  const channel = supabase
    .channel('platform_users_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: TABLE },
      () => onChange()
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
