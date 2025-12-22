'use client';

import axios, { endpoints } from 'src/lib/axios';

export type DepartmentFromApiRaw = {
  id: number;
  name: string;
  description: string | null;
  is_deleted: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

export async function getDepartments(): Promise<DepartmentFromApiRaw[]> {
  const res = await axios.get<DepartmentFromApiRaw[]>(endpoints.departments.list);
  // just in case backend accidentally returns deleted too
  return (res.data ?? []).filter((d) => !d.is_deleted);
}
