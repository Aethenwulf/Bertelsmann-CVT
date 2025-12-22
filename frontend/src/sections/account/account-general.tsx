'use client';

import { z as zod } from 'zod';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isValidPhoneNumber } from 'react-phone-number-input/input';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import { fData } from 'src/utils/format-number';
import { toast } from 'src/components/snackbar';
import { Form, Field, schemaHelper } from 'src/components/hook-form';
import { useAuthContext } from 'src/auth/hooks';
import axios, { endpoints } from 'src/lib/axios';
import { API_BASE } from 'src/global-config';

import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';

import { updateUser } from 'src/api/users';

// ----------------------------------------------------
// Schemas
// ----------------------------------------------------

const BaseSchema = zod.object({
  email: zod.string().min(1).email(),
  photoURL: schemaHelper.file().optional(), // File OR string URL in practice

  phoneNumber: schemaHelper.phoneNumber({ isValid: isValidPhoneNumber }).optional(),
  address: zod.string().optional(),
  state: zod.string().optional(),
  city: zod.string().optional(),
  zipCode: zod.string().optional(),

  birthday: zod.string().optional(),
  isPublic: zod.boolean().optional(),
});

const EmployeeSchema = BaseSchema.extend({
  firstName: zod.string().min(1, { message: 'First name is required!' }),
  lastName: zod.string().min(1, { message: 'Last name is required!' }),
  about: zod.string().optional(),
});

const CustomerSchema = BaseSchema.extend({
  customerName: zod.string().min(1, { message: 'Customer name is required!' }),
  dba: zod.string().optional(),
});

type EmployeeForm = zod.infer<typeof EmployeeSchema>;
type CustomerForm = zod.infer<typeof CustomerSchema>;

function splitName(fullName: string) {
  const full = String(fullName || '').trim();
  if (!full) return { firstName: '', lastName: '' };
  const parts = full.split(/\s+/);
  return { firstName: parts.shift() || '', lastName: parts.join(' ') || '' };
}

function toAbsoluteUrl(url: string | null | undefined) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
}

export function AccountGeneral() {
  const { user, refresh, checkUserSession } = useAuthContext() as any;
  const router = useRouter();

  const isCustomer = Number(user?.role) === 2;

  const profileCompleted = Boolean(user?.profile_completed);
  const isIncomplete = !profileCompleted;

  const defaultValues = useMemo(() => {
    const avatarAbs = toAbsoluteUrl(user?.avatarUrl);

    if (isCustomer) {
      const customerName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();

      const values: CustomerForm = {
        customerName,
        email: user?.email ?? '',
        photoURL: (avatarAbs as any) ?? null,

        phoneNumber: user?.phoneNumber ?? '',
        address: user?.address ?? '',
        state: user?.state ?? '',
        city: user?.city ?? '',
        zipCode: user?.zipCode ?? '',

        dba: user?.about ?? '',
        birthday: user?.birthday ?? '',
        isPublic: user?.isPublic ?? false,
      };

      return values;
    }

    const values: EmployeeForm = {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      email: user?.email ?? '',
      photoURL: (avatarAbs as any) ?? null,

      phoneNumber: user?.phoneNumber ?? '',
      address: user?.address ?? '',
      state: user?.state ?? '',
      city: user?.city ?? '',
      zipCode: user?.zipCode ?? '',

      about: user?.about ?? '',
      birthday: user?.birthday ?? '',
      isPublic: user?.isPublic ?? false,
    };

    return values;
  }, [isCustomer, user]);

  const methods = useForm<EmployeeForm | CustomerForm>({
    mode: 'all',
    resolver: zodResolver(isCustomer ? CustomerSchema : EmployeeSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  async function uploadAvatar(userId: number, file: File): Promise<string> {
    const form = new FormData();
    form.append('avatar', file);

    const res = await axios.post<{ success: boolean; avatarUrl: string }>(
      `${endpoints.users.root}/${userId}/avatar`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );

    return res.data.avatarUrl;
  }

  const onSubmit = handleSubmit(async (data) => {
    try {
      const userId = Number(user?.id ?? user?.user_id);
      if (!userId) throw new Error('Missing user id');

      let firstName = '';
      let lastName = '';

      if (isCustomer) {
        const s = splitName((data as CustomerForm).customerName);
        firstName = s.firstName;
        lastName = s.lastName;
      } else {
        firstName = (data as EmployeeForm).firstName;
        lastName = (data as EmployeeForm).lastName;
      }

      // 1) Upload avatar first
      const picked = (data as any).photoURL as File | string | null | undefined;

      if (picked instanceof File) {
        const newRelative = await uploadAvatar(userId, picked);
        const newAbsolute = toAbsoluteUrl(newRelative);

        // immediate preview (do not mark dirty)
        methods.setValue('photoURL', (newAbsolute as any) ?? null, { shouldDirty: false });
      }

      // 2) Update /auth/me fields (NO photoURL)
      const payload: any = {
        firstName,
        lastName,
        email: data.email,

        phoneNumber: data.phoneNumber || null,
        address: data.address || null,
        state: data.state || null,
        city: data.city || null,
        zipCode: data.zipCode || null,
        birthday: data.birthday || null,
        isPublic: data.isPublic ?? false,

        about: isCustomer
          ? (data as CustomerForm).dba || null
          : (data as EmployeeForm).about || null,
      };

      await axios.put(endpoints.auth.me, payload);

      // 3) If completing profile, mark it in /users/:id
      if (isIncomplete) {
        await updateUser(userId, { profile_completed: true });

        // refresh session so guards/layout see the updated value
        await checkUserSession?.();
        await refresh?.();

        toast.success('Profile completed!');
        router.replace(paths.dashboard.root);
        return;
      }

      // 4) Normal refresh
      await checkUserSession?.();
      await refresh?.();

      toast.success('Update success!');
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message ?? 'Failed to update profile');
    }
  });

  useEffect(() => {
    methods.reset(defaultValues);
  }, [defaultValues, methods]);

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ pt: 10, pb: 5, px: 3, textAlign: 'center' }}>
            <Field.UploadAvatar
              name="photoURL"
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
          </Card>
        </Grid>

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
              {isCustomer ? (
                <>
                  <Field.Text name="customerName" label="Customer Name" />
                  <Field.Text name="email" label="Email" />

                  <Field.Phone name="phoneNumber" label="Phone Number" />
                  <Field.Text name="dba" label="DBA" placeholder="Doing Business As" />

                  <Field.Text name="address" label="Address" />
                  <Field.Text name="state" label="State" />

                  <Field.Text name="city" label="City" />
                  <Field.Text name="zipCode" label="Postal Code" />
                </>
              ) : (
                <>
                  <Field.Text name="firstName" label="First name" />
                  <Field.Text name="lastName" label="Last name" />
                  <Field.Text name="email" label="Email address" />

                  <Field.Phone name="phoneNumber" label="Phone number" />
                  <Field.Text name="address" label="Address" />
                  <Field.Text name="state" label="State/region" />
                  <Field.Text name="city" label="City" />
                  <Field.Text name="zipCode" label="Zip/code" />
                  <Field.Text
                    name="birthday"
                    label="Birthday"
                    type="date"
                    placeholder="YYYY-MM-DD"
                  />
                </>
              )}
            </Box>

            <Stack spacing={3} sx={{ mt: 3, alignItems: 'flex-end' }}>
              {!isCustomer && <Field.Text name="about" multiline rows={4} label="About" />}

              <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
                {isIncomplete ? 'Complete' : isCustomer ? 'Update' : 'Save changes'}
              </LoadingButton>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Form>
  );
}
