'use client';

import type { IUserItem } from 'src/types/user';

import { z as zod } from 'zod';
import { useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isValidPhoneNumber } from 'react-phone-number-input/input';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import FormControlLabel from '@mui/material/FormControlLabel';

import MenuItem from '@mui/material/MenuItem';

import { getDepartments, type DepartmentFromApiRaw } from 'src/api/departments';
import { getRoles, type RoleItem } from 'src/api/roles';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fData } from 'src/utils/format-number';

import { toast } from 'src/components/snackbar';
import { Label } from 'src/components/label';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

import { createUser, updateUser } from 'src/api/users';
import { countries, DEFAULT_COUNTRY_CODE, type CountryCode } from 'src/assets/data/countries';

// ----------------------------------------------------------------------

const splitName = (fullName: string) => {
  const parts = (fullName ?? '').trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' ') || '',
  };
};

const STATUS_ACTIVE = 'ACTIVE';
const STATUS_REMOVE = 'REMOVE';

// Make phoneCountry typed without relying on react-phone-number-input exports
const CountryCodeSchema = zod.custom<CountryCode>(
  (val) => {
    if (typeof val !== 'string') return false;
    return countries.some((c) => c.code === val);
  },
  { message: 'Invalid phone country code' }
);

// ----------------------------------------------------------------------

export const UserFormSchema = zod.object({
  avatarUrl: zod.any().nullable(),
  name: zod.string().min(1, { message: 'Name is required!' }),

  // ✅ NEW: username
  username: zod
    .string()
    .min(3, { message: 'Username is required' })
    .max(100, { message: 'Max 100 characters' })
    .regex(/^[a-zA-Z0-9._-]+$/, { message: 'Only letters, numbers, dot, underscore, dash' }),

  email: zod
    .string()
    .min(1, { message: 'Email is required!' })
    .email({ message: 'Email must be a valid email address!' }),

  phoneNumber: schemaHelper.phoneNumber({ isValid: isValidPhoneNumber }),
  phoneCountry: CountryCodeSchema.optional(),

  country: schemaHelper.nullableInput(zod.string().min(1, { message: 'Country is required!' }), {
    message: 'Country is required!',
  }),

  address: zod.string().min(1, { message: 'Address is required!' }),
  state: zod.string().min(1, { message: 'State is required!' }),
  city: zod.string().min(1, { message: 'City is required!' }),
  zipCode: zod.string().min(1, { message: 'Zip code is required!' }),

  department: zod.string().optional(),
  role: zod.string().min(1, { message: 'Role is required!' }),

  status: zod.string().optional(),
  isVerified: zod.boolean().optional(),

  password: zod.string().optional(),
  confirmPassword: zod.string().optional(),
});

export type UserFormValues = zod.infer<typeof UserFormSchema>;

// ----------------------------------------------------------------------

type Props = {
  currentUser?: IUserItem;
};

export function UserNewEditForm({ currentUser }: Props) {
  const router = useRouter();
  const isEdit = !!currentUser?.id;
  const [departments, setDepartments] = useState<DepartmentFromApiRaw[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);

  const defaultValues: UserFormValues = useMemo(
    () => ({
      avatarUrl: null,
      isVerified: true,

      name: '',
      username: '',
      email: '',
      phoneNumber: '',
      phoneCountry: DEFAULT_COUNTRY_CODE,

      country: '',
      state: '',
      city: '',
      address: '',
      zipCode: '',

      department: '',
      role: '',
      status: STATUS_ACTIVE,
      password: '',
      confirmPassword: '',
    }),
    []
  );

  const methods = useForm<UserFormValues>({
    mode: 'onSubmit',
    resolver: zodResolver(UserFormSchema),
    defaultValues,
  });

  const {
    reset,
    watch,
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const values = watch();

  const onSubmit = handleSubmit(async (data) => {
    const pwd = (data.password ?? '').trim();
    const cpwd = (data.confirmPassword ?? '').trim();

    if (!isEdit) {
      if (!pwd || pwd.length < 8) {
        toast.error('Password must be at least 8 characters');
        return;
      }
      if (pwd !== cpwd) {
        toast.error('Passwords do not match');
        return;
      }
    } else {
      if (pwd) {
        if (pwd.length < 8) {
          toast.error('Password must be at least 8 characters');
          return;
        }
        if (pwd !== cpwd) {
          toast.error('Passwords do not match');
          return;
        }
      }
    }

    try {
      const { firstName, lastName } = splitName(data.name);

      if (isEdit) {
        // ---- UPDATE ----
        await updateUser(currentUser!.id, {
          firstName,
          lastName,
          email: data.email,

          phoneNumber: data.phoneNumber || null,
          phoneCountry: data.phoneCountry || DEFAULT_COUNTRY_CODE,

          country: data.country || null,
          state: data.state || null,
          city: data.city || null,
          address: data.address || null,
          zipCode: data.zipCode || null,

          departmentId: data.department ? Number(data.department) : null,
          roleId: data.role ? Number(data.role) : null,
          username: data.username,

          status: data.status ?? STATUS_ACTIVE,
          ...(pwd ? { password: pwd } : {}),
        });

        toast.success('Update success!');
      } else {
        // ---- CREATE ----
        await createUser({
          username: data.username.trim(), // ✅ use username from form
          email: data.email,
          password: pwd,
          first_name: firstName,
          last_name: lastName,
          phone_number: data.phoneNumber || null,
          phone_country: data.phoneCountry || DEFAULT_COUNTRY_CODE,

          country: data.country || null,
          state: data.state || null,
          city: data.city || null,
          address_line: data.address || null,
          zip_code: data.zipCode || null,

          status: STATUS_ACTIVE,
          role_id: data.role ? Number(data.role) : null,
          department_id: data.department ? Number(data.department) : null,
        });

        toast.success('Create success!');
      }

      router.push(paths.dashboard.user.list);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.error ?? error?.message ?? 'Something went wrong');
      console.log('Users error response:', error?.response?.data);
      console.log('Users error status:', error?.response?.status);
    }
  });

  // ----------------------------------------------------------------------

  useEffect(() => {
    if (currentUser) {
      reset({
        status: currentUser.status ?? STATUS_ACTIVE,
        avatarUrl: (currentUser.avatarUrl as any) ?? null,
        isVerified: currentUser.isVerified ?? true,

        name: currentUser.name ?? '',
        username: currentUser.username ?? '',
        email: currentUser.email ?? '',
        phoneNumber: currentUser.phoneNumber ?? '',
        phoneCountry: (currentUser.phoneCountry as CountryCode | undefined) ?? DEFAULT_COUNTRY_CODE,

        country: currentUser.country ?? '',
        state: currentUser.state ?? '',
        city: currentUser.city ?? '',
        address: currentUser.address ?? '',
        zipCode: currentUser.zipCode ?? '',

        department: currentUser.department ?? '',
        role: currentUser.role ?? '',

        password: '',
        confirmPassword: '',
      });
    } else {
      reset(defaultValues);
    }
  }, [currentUser, reset, defaultValues]);

  useEffect(() => {
    (async () => {
      try {
        const data = await getDepartments();
        setDepartments(data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load departments');
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const data = await getRoles();
        setRoles(data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load roles');
      }
    })();
  }, []);

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        {/* LEFT */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ pt: 10, pb: 5, px: 3 }}>
            {isEdit && (
              <Label
                color={
                  (values.status === 'ACTIVE' && 'success') ||
                  (values.status === 'REMOVE' && 'error') ||
                  'default'
                }
                sx={{ position: 'absolute', top: 24, right: 24 }}
              >
                {values.status}
              </Label>
            )}

            <Box sx={{ mb: 5 }}>
              <Field.UploadAvatar
                name="avatarUrl"
                maxSize={3145728}
                helperText={
                  <Typography
                    variant="caption"
                    sx={{
                      mt: 3,
                      mx: 'auto',
                      display: 'block',
                      textAlign: 'center',
                      color: 'text.disabled',
                    }}
                  >
                    Allowed *.jpeg, *.jpg, *.png, *.gif
                    <br /> max size of {fData(3145728)}
                  </Typography>
                }
              />
            </Box>

            {isEdit && (
              <FormControlLabel
                labelPlacement="start"
                control={
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        checked={field.value === STATUS_REMOVE}
                        onChange={(event) =>
                          field.onChange(event.target.checked ? STATUS_REMOVE : STATUS_ACTIVE)
                        }
                      />
                    )}
                  />
                }
                label={
                  <>
                    <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                      Banned
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Apply disable account
                    </Typography>
                  </>
                }
                sx={{ mx: 0, mb: 3, width: 1, justifyContent: 'space-between' }}
              />
            )}

            <Field.Switch
              name="isVerified"
              labelPlacement="start"
              label={
                <>
                  <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                    Email verified
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Disabling this will automatically send the user a verification email
                  </Typography>
                </>
              }
              sx={{ mx: 0, width: 1, justifyContent: 'space-between' }}
            />

            {isEdit && (
              <Stack sx={{ mt: 3, alignItems: 'center', justifyContent: 'center' }}>
                <Button variant="soft" color="error">
                  Delete user
                </Button>
              </Stack>
            )}
          </Card>
        </Grid>

        {/* RIGHT */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ p: 3 }}>
            <Box
              sx={{
                rowGap: 3,
                columnGap: 2,
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
              }}
            >
              <Field.Text name="name" label="Full name" />
              <Field.Text name="username" label="Username" />

              <Field.Text name="email" label="Email address" />

              <Field.Phone
                name="phoneNumber"
                label="Phone number"
                country={(values.phoneCountry ?? DEFAULT_COUNTRY_CODE) as any}
              />

              <Field.CountrySelect
                fullWidth
                name="country"
                label="Country"
                placeholder="Choose a country"
              />

              <Field.Text name="state" label="State/region" />
              <Field.Text name="city" label="City" />
              <Field.Text name="address" label="Address" />
              <Field.Text name="zipCode" label="Zip/code" />

              <Field.Select name="department" label="Department">
                {departments.map((d) => (
                  <MenuItem key={d.id} value={String(d.id)}>
                    {d.name}
                  </MenuItem>
                ))}
              </Field.Select>

              <Field.Select name="role" label="Role">
                {roles.map((role) => (
                  <MenuItem key={role.id} value={String(role.id)}>
                    {role.name}
                  </MenuItem>
                ))}
              </Field.Select>

              <Field.Text name="password" label="Password" type="password" />
              <Field.Text name="confirmPassword" label="Confirm password" type="password" />
            </Box>

            <Stack sx={{ mt: 3, alignItems: 'flex-end' }}>
              <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
                {isEdit ? 'Save changes' : 'Create user'}
              </LoadingButton>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Form>
  );
}
