'use client';

import { z as zod } from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'src/components/snackbar';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

import { signUp } from '../../context/jwt';
import { useAuthContext } from '../../hooks';
import { getErrorMessage } from '../../utils';
import { FormHead } from '../../components/form-head';
import { SignUpTerms } from '../../components/sign-up-terms';

import { isValidPhoneNumber } from 'react-phone-number-input/input';
import { countries, DEFAULT_COUNTRY_CODE, type CountryCode } from 'src/assets/data/countries';

// ----------------------------------------------------------------------

const CountryCodeSchema = zod.custom<CountryCode>(
  (val) => {
    if (typeof val !== 'string') return false;
    return countries.some((c) => c.code === val);
  },
  { message: 'Invalid phone country code' }
);

export const SignUpSchema = zod.object({
  customerName: zod.string().min(1, { message: 'Customer name is required!' }),
  email: zod.string().min(1, { message: 'Email is required!' }).email(),

  phoneNumber: schemaHelper.phoneNumber({ isValid: isValidPhoneNumber }),
  phoneCountry: CountryCodeSchema.optional(),

  dba: zod.string().optional(),

  address: zod.string().min(1, { message: 'Address is required!' }),
  state: zod.string().min(1, { message: 'State is required!' }),
  city: zod.string().min(1, { message: 'City is required!' }),
  postalCode: zod.string().min(1, { message: 'Postal code is required!' }),
});

export type SignUpSchemaType = zod.infer<typeof SignUpSchema>;

// ----------------------------------------------------------------------

export function JwtSignUpView() {
  const router = useRouter();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const defaultValues: SignUpSchemaType = {
    customerName: '',
    email: '',
    phoneNumber: '', // ✅ must be '' (not null/undefined)
    phoneCountry: DEFAULT_COUNTRY_CODE,
    dba: '',
    address: '',
    state: '',
    city: '',
    postalCode: '',
  };

  const methods = useForm<SignUpSchemaType>({
    resolver: zodResolver(SignUpSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = methods;

  const values = watch();

  const onSubmit = handleSubmit(async (data) => {
    try {
      setErrorMessage(null);

      const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/auth/customer-sign-up`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.message || 'Failed to send request');
      }

      // clear form
      methods.reset(defaultValues);

      // show success toast
      toast.success('Request submitted! wait for admin approval.');

      router.push(`${paths.auth.jwt.signIn}?submitted=1`);

      // go back to sign-in page
      router.refresh(); // optional (safe to keep)
    } catch (error) {
      console.error(error);
      setErrorMessage(getErrorMessage(error));
    }
  });

  const renderForm = () => (
    <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
      {/* Row 1 */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
        <Field.Text
          name="customerName"
          label="Customer Name:"
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <Field.Text name="email" label="Email:" slotProps={{ inputLabel: { shrink: true } }} />
      </Box>

      {/* Row 2 */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
        <Field.Phone
          name="phoneNumber"
          label="Phone Number:"
          country={(values.phoneCountry ?? DEFAULT_COUNTRY_CODE) as any}
        />
        <Field.Text name="dba" label="DBA:" slotProps={{ inputLabel: { shrink: true } }} />
      </Box>

      {/* Row 3 */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
        <Field.Text name="address" label="Address:" slotProps={{ inputLabel: { shrink: true } }} />
        <Field.Select name="state" label="State:" slotProps={{ inputLabel: { shrink: true } }}>
          {[
            'Alabama',
            'Alaska',
            'Arizona',
            'Arkansas',
            'California',
            'Colorado',
            'Connecticut',
            'Delaware',
            'Florida',
            'Georgia',
            'Hawaii',
            'Idaho',
            'Illinois',
            'Indiana',
            'Iowa',
            'Kansas',
            'Kentucky',
            'Louisiana',
            'Maine',
            'Maryland',
            'Massachusetts',
            'Michigan',
            'Minnesota',
            'Mississippi',
            'Missouri',
            'Montana',
            'Nebraska',
            'Nevada',
            'New Hampshire',
            'New Jersey',
            'New Mexico',
            'New York',
            'North Carolina',
            'North Dakota',
            'Ohio',
            'Oklahoma',
            'Oregon',
            'Pennsylvania',
            'Rhode Island',
            'South Carolina',
            'South Dakota',
            'Tennessee',
            'Texas',
            'Utah',
            'Vermont',
            'Virginia',
            'Washington',
            'West Virginia',
            'Wisconsin',
            'Wyoming',
          ].map((s) => (
            <MenuItem key={s} value={s}>
              {s}
            </MenuItem>
          ))}
        </Field.Select>
      </Box>

      {/* Row 4 */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
        <Field.Text name="city" label="City:" slotProps={{ inputLabel: { shrink: true } }} />
        <Field.Text
          name="postalCode"
          label="Postal Code:"
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Box>

      <LoadingButton
        fullWidth
        color="inherit"
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator="Submitting..."
      >
        Send Request
      </LoadingButton>
    </Box>
  );

  return (
    <>
      <FormHead
        title="Get started!"
        description={
          <>
            {`Already have an account? `}
            <Link component={RouterLink} href={paths.auth.jwt.signIn} variant="subtitle2">
              Get started!
            </Link>
          </>
        }
        sx={{ textAlign: { xs: 'center', md: 'left' } }}
      />

      {!!errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

      <Form methods={methods} onSubmit={onSubmit}>
        {renderForm()}
      </Form>

      <SignUpTerms />
    </>
  );
}
