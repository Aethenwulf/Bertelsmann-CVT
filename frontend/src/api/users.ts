'use client';

import axios, { endpoints } from 'src/lib/axios';
import type { IUserItem } from 'src/types/user';

// Just treat phone country as a simple 2-letter string
const DEFAULT_PHONE_COUNTRY = 'PH';

// Shape from backend /users and /users/:id
export type UserFromApi = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string | null;
  phone_country: string | null;
  company: string | null;
  role_id: number | null;
  department_id: number | null;
  status: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  address_line: string | null;
  zip_code: string | null;

  // Option B avatar meta
  avatar_mime?: string | null;
  avatar_size_bytes?: string | number | null;

  about: string | null;
  is_public: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  is_deleted: boolean | null;

  username?: string;
};

// Map backend → table row
export function mapUserToTableRow(user: UserFromApi): IUserItem {
  const fullName = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim();
  const hasAvatar = !!user.avatar_size_bytes && Number(user.avatar_size_bytes) > 0;
  const v = user.updated_at ? encodeURIComponent(user.updated_at) : String(Date.now());

  return {
    id: String(user.id),
    name: fullName || user.email,
    email: user.email,
    username: user.username ?? '',
    phoneNumber: user.phone_number ?? '',
    phoneCountry: user.phone_country ?? DEFAULT_PHONE_COUNTRY,
    city: user.city ?? '',
    state: user.state ?? '',
    address: user.address_line ?? '',
    country: user.country ?? '',
    zipCode: user.zip_code ?? '',
    company: user.company ?? '',
    department: user.department_id ? String(user.department_id) : '',
    role: user.role_id ? String(user.role_id) : '',
    status: (user.status ?? 'ACTIVE') as 'ACTIVE' | 'REMOVE',
    avatarUrl: hasAvatar ? `${endpoints.users.root}/${user.id}/avatar?v=${v}` : undefined,
    isVerified: user.is_public ?? false,
    firstName: user.first_name,
    lastName: user.last_name,
  };
}

// ------- API calls -------

export async function getUsers(): Promise<IUserItem[]> {
  const res = await axios.get<UserFromApi[]>(endpoints.users.list);
  return res.data.map(mapUserToTableRow);
}

export async function getUser(id: string | number): Promise<IUserItem | null> {
  try {
    const res = await axios.get<UserFromApi>(`${endpoints.users.root}/${id}`);
    return mapUserToTableRow(res.data);
  } catch (error: any) {
    if (error?.response?.status === 404) return null;
    throw error;
  }
}

export async function deleteUser(id: string | number): Promise<void> {
  await axios.delete(`${endpoints.users.root}/${id}`);
}

// ------- Update -------

export type UpdateUserPayload = {
  firstName?: string;
  lastName?: string;
  email?: string;

  phoneNumber?: string | null;
  phoneCountry?: string | null;

  country?: string | null;
  state?: string | null;
  city?: string | null;
  address?: string | null;
  zipCode?: string | null;

  about?: string | null;

  departmentId?: number | null;
  roleId?: number | null;

  status?: string | null;
  isPublic?: boolean;

  password?: string;
  username?: string;

  profile_completed?: boolean;
};

export async function updateUser(
  id: string | number,
  payload: UpdateUserPayload
): Promise<IUserItem> {
  const res = await axios.put<{ success: boolean; user: UserFromApi }>(
    `${endpoints.users.root}/${id}`,
    payload
  );

  return mapUserToTableRow(res.data.user);
}

// ------- Create -------

export type CreateUserPayload = {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string | null;
  phone_country?: string | null;
  company?: string | null;

  country?: string | null;
  state?: string | null;
  city?: string | null;
  address_line?: string | null;
  zip_code?: string | null;
  
  role_id?: number | null;
  department_id?: number | null;
  status?: string | null;
};

export async function createUser(payload: CreateUserPayload): Promise<IUserItem> {
  const res = await axios.post<UserFromApi>(endpoints.users.list, payload);
  return mapUserToTableRow(res.data);
}

// ------- Upload Avatar -------

export async function uploadUserAvatar(
  id: string | number,
  file: File
): Promise<string> {
  const form = new FormData();
  form.append('avatar', file);

  const res = await axios.post<{ success: boolean; avatarUrl: string }>(
    `${endpoints.users.root}/${id}/avatar`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );

  return `${res.data.avatarUrl}?v=${Date.now()}`;
}

export async function deleteUserAvatar(id: string | number): Promise<void> {
  await axios.delete(`${endpoints.users.root}/${id}/avatar`);
}