'use client';

import axios, { endpoints } from 'src/lib/axios';

export type RoleFromApiRaw = {
  // possible shapes
  id?: number;
  name?: string;

  role_id?: number;
  role_name?: string;

  description?: string | null;
  is_deleted?: boolean;
};

export type RoleItem = {
  id: number;
  name: string;
  description?: string | null;
};

export async function getRoles(): Promise<RoleItem[]> {
  const res = await axios.get<RoleFromApiRaw[]>(endpoints.roles.list);

  return (res.data ?? [])
    .map((r) => ({
      id: r.role_id ?? r.id ?? 0,
      name: r.role_name ?? r.name ?? '',
      description: r.description ?? null,
    }))
    .filter((r) => r.id > 0 && r.name.trim().length > 0);
}
