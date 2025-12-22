import type { IUserItem } from 'src/types/user';

import { z as zod } from 'zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isValidPhoneNumber } from 'react-phone-number-input/input';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { getRoles, type RoleItem } from 'src/api/roles';
import { getDepartments, type DepartmentFromApiRaw } from 'src/api/departments';
import { toast } from 'src/components/snackbar';
import { Form, Field, schemaHelper } from 'src/components/hook-form';
import { updateUser } from 'src/api/users';

// ----------------------------------------------------------------------

const DEFAULT_PHONE_COUNTRY = 'PH';
const STATUS = ['ACTIVE', 'REMOVE'] as const;

export const UserQuickEditSchema = zod.object({
  name: zod.string().min(1, { message: 'Name is required!' }),
  email: zod
    .string()
    .min(1, { message: 'Email is required!' })
    .email({ message: 'Email must be a valid email address!' }),
  username: zod
    .string()
    .min(3, { message: 'Username is required!' })
    .max(100)
    .regex(/^[a-zA-Z0-9._-]+$/, { message: 'Only letters, numbers, dot, underscore, dash' }),
  phoneNumber: schemaHelper.phoneNumber({ isValid: isValidPhoneNumber }),
  phoneCountry: zod.string().optional(),

  country: schemaHelper.nullableInput(zod.string().min(1, { message: 'Country is required!' }), {
    message: 'Country is required!',
  }),
  state: zod.string().min(1, { message: 'State is required!' }),
  city: zod.string().min(1, { message: 'City is required!' }),
  address: zod.string().min(1, { message: 'Address is required!' }),
  zipCode: zod.string().min(1, { message: 'Zip code is required!' }),
  department: zod.string().min(1, { message: 'Department is required!' }),
  role: zod.string().min(1, { message: 'Role is required!' }),
  status: zod.enum(STATUS),
});

export type UserQuickEditSchemaType = zod.infer<typeof UserQuickEditSchema>;

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  currentUser?: IUserItem;
  onUpdated?: (updated: IUserItem) => void;
};

export function UserQuickEditForm({ currentUser, open, onClose, onUpdated }: Props) {
  const [departments, setDepartments] = useState<DepartmentFromApiRaw[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const defaultValues: UserQuickEditSchemaType = {
    name: '',
    username: '',
    email: '',
    phoneNumber: '',
    phoneCountry: 'PH',
    address: '',
    country: '',
    state: '',
    city: '',
    zipCode: '',
    department: '',
    role: '',
    status: 'ACTIVE',
  };

  const methods = useForm<UserQuickEditSchemaType>({
    mode: 'all',
    resolver: zodResolver(UserQuickEditSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = methods;

  const values = watch();

  useEffect(() => {
    if (currentUser) {
      reset({
        name: currentUser.name ?? '',
        email: currentUser.email ?? '',
        username: currentUser.username ?? '',
        phoneNumber: currentUser.phoneNumber ?? '',
        phoneCountry: currentUser.phoneCountry ?? 'PH',
        address: currentUser.address ?? '',
        country: (currentUser.country as string | null) ?? '',
        state: currentUser.state ?? '',
        city: currentUser.city ?? '',
        zipCode: currentUser.zipCode ?? '',
        department: currentUser.department ?? '',
        role: currentUser.role ?? '',
        status: (currentUser.status as any) ?? 'ACTIVE',
      });
    } else {
      reset(defaultValues);
    }
  }, [currentUser, reset]);

  const onSubmit = handleSubmit(async (data) => {
    if (!currentUser?.id) {
      toast.error('Missing user id');
      return;
    }

    // split full name -> first/last (simple approach)
    const parts = (data.name ?? '').trim().split(/\s+/);
    const firstName = parts[0] ?? '';
    const lastName = parts.slice(1).join(' ') || '';

    const payload = {
      firstName,
      lastName,
      email: data.email,
      username: data.username,
      phoneNumber: data.phoneNumber || null,
      phoneCountry: data.phoneCountry || null,

      country: data.country || null,
      state: data.state || null,
      city: data.city || null,
      address: data.address || null,
      zipCode: data.zipCode || null,

      departmentId: data.department ? Number(data.department) : null,
      roleId: data.role ? Number(data.role) : null,

      status: data.status || null,
    };

    try {
      const promise = updateUser(currentUser.id, payload);

      toast.promise(promise, {
        loading: 'Updating...',
        success: 'Update success!',
        error: 'Update error!',
      });

      const updated = await promise;
      onUpdated?.(updated);
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message ?? 'Failed to update');
    }
  });

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
    <Dialog
      fullWidth
      maxWidth={false}
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { maxWidth: 720 } }}
    >
      <DialogTitle>Quick update</DialogTitle>

      <Form methods={methods} onSubmit={onSubmit}>
        <DialogContent>
          <Alert variant="outlined" severity="info" sx={{ mb: 3 }}>
            Account is waiting for confirmation
          </Alert>

          <Box
            sx={{
              rowGap: 3,
              columnGap: 2,
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
            }}
          >
            <Field.Text name="name" label="Full name" />
            <Field.Text name="email" label="Email address" />
            <Field.Text name="username" label="Username" />

            <Field.Phone
              name="phoneNumber"
              label="Phone number"
              country={(values.phoneCountry || DEFAULT_PHONE_COUNTRY) as any}
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
            <Field.Select name="status" label="Status">
              {STATUS.map((v) => (
                <MenuItem key={v} value={v}>
                  {v}
                </MenuItem>
              ))}
            </Field.Select>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>

          <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
            Update
          </LoadingButton>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
