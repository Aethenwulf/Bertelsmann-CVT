'use client';

import { z as zod } from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { useAuthContext } from '../../hooks';
import { getErrorMessage } from '../../utils';
import { FormHead } from '../../components/form-head';
import { signInWithPassword } from '../../context/jwt';
import { setSession } from '../../context/jwt/utils';
import { API_BASE } from 'src/global-config';

// ----------------------------------------------------------------------
// EMPLOYEE
export type EmployeeSignInSchemaType = zod.infer<typeof EmployeeSignInSchema>;

export const EmployeeSignInSchema = zod.object({
  emailOrUsername: zod.string().min(1, { message: 'Email or username is required!' }),
  password: zod
    .string()
    .min(1, { message: 'Password is required!' })
    .min(8, { message: 'Password must be at least 8 characters!' }),
});

// ----------------------------------------------------------------------
// CUSTOMER (step 1: credentials)
export type CustomerCredentialsSchemaType = zod.infer<typeof CustomerCredentialsSchema>;

export const CustomerCredentialsSchema = zod.object({
  emailOrUsername: zod
    .string()
    .min(1, { message: 'Payor Account Number is required!' })
    .regex(/^\d+$/, { message: 'Payor Account Number must be numeric!' }),
  password: zod
    .string()
    .min(1, { message: 'Access Code is required!' })
    .min(6, { message: 'Access Code must be at least 6 characters!' }),
});

// CUSTOMER (step 2: otp delivery method)
export type CustomerOtpMethodSchemaType = zod.infer<typeof CustomerOtpMethodSchema>;

export const CustomerOtpMethodSchema = zod.object({
  otpMethod: zod.enum(['email', 'sms'], { message: 'Please select a method!' }),
});

// CUSTOMER (step 3: otp verify)
export type CustomerOtpVerifySchemaType = zod.infer<typeof CustomerOtpVerifySchema>;

export const CustomerOtpVerifySchema = zod.object({
  otp: zod
    .string()
    .min(1, { message: 'OTP is required!' })
    .min(4, { message: 'OTP is too short!' }),
});

// ----------------------------------------------------------------------

type AuthTab = 'employee' | 'customer';

function TabPanel(props: { value: AuthTab; tab: AuthTab; children: React.ReactNode }) {
  const { value, tab, children } = props;
  if (value !== tab) return null;
  return <Box sx={{ pt: 3 }}>{children}</Box>;
}

async function postApi<T>(path: string, body: any): Promise<T> {
  const url = `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
  console.log('[postApi]', url);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const contentType = res.headers.get('content-type') || '';
  const raw = await res.text();

  if (contentType.includes('text/html')) {
    throw new Error(`API call failed: ${url} returned HTML (status ${res.status}).`);
  }

  let json: any = null;
  try {
    json = raw ? JSON.parse(raw) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    throw new Error(json?.message || raw || `Request failed (${res.status})`);
  }

  return json as T;
}

// ----------------------------------------------------------------------

type CustomerStep = 'credentials' | 'method' | 'otp';

export function JwtSignInView() {
  const { checkUserSession } = useAuthContext();

  const [activeTab, setActiveTab] = useState<AuthTab>('customer');

  const showPasswordEmployee = useBoolean();

  const [employeeErrorMessage, setEmployeeErrorMessage] = useState<string | null>(null);
  const [customerErrorMessage, setCustomerErrorMessage] = useState<string | null>(null);

  const [customerStep, setCustomerStep] = useState<CustomerStep>('credentials');
  const [customerTransactionId, setCustomerTransactionId] = useState<string>('');

  // ----------------------------------------------------------------------
  // EMPLOYEE FORM
  const employeeMethods = useForm<EmployeeSignInSchemaType>({
    resolver: zodResolver(EmployeeSignInSchema),
    defaultValues: { emailOrUsername: '', password: '' },
  });

  const {
    handleSubmit: handleSubmitEmployee,
    formState: { isSubmitting: isSubmittingEmployee },
  } = employeeMethods;

  const onSubmitEmployee = handleSubmitEmployee(async (data) => {
    try {
      setEmployeeErrorMessage(null);

      await signInWithPassword({
        email: data.emailOrUsername,
        password: data.password,
      });

      await checkUserSession?.();
      // guards handle redirect
    } catch (error) {
      console.error(error);
      setEmployeeErrorMessage(getErrorMessage(error));
    }
  });

  // ----------------------------------------------------------------------
  // CUSTOMER FORMS

  const customerCredentialsMethods = useForm<CustomerCredentialsSchemaType>({
    resolver: zodResolver(CustomerCredentialsSchema),
    defaultValues: { emailOrUsername: '', password: '' },
  });

  const customerMethodMethods = useForm<CustomerOtpMethodSchemaType>({
    resolver: zodResolver(CustomerOtpMethodSchema),
    defaultValues: { otpMethod: 'email' },
  });

  const customerOtpMethods = useForm<CustomerOtpVerifySchemaType>({
    resolver: zodResolver(CustomerOtpVerifySchema),
    defaultValues: { otp: '' },
  });

  const {
    handleSubmit: handleSubmitCustomerCredentials,
    formState: { isSubmitting: isSubmittingCustomerCredentials },
  } = customerCredentialsMethods;

  const {
    handleSubmit: handleSubmitCustomerMethod,
    formState: { isSubmitting: isSubmittingCustomerMethod },
  } = customerMethodMethods;

  const {
    handleSubmit: handleSubmitCustomerOtp,
    formState: { isSubmitting: isSubmittingCustomerOtp },
  } = customerOtpMethods;

  const onSubmitCustomerCredentials = handleSubmitCustomerCredentials(async (data) => {
    try {
      setCustomerErrorMessage(null);

      const resp = await postApi<{ success: boolean; transactionId?: string; message?: string }>(
        '/auth/customer/login/init',
        { payorAccountNumber: data.emailOrUsername, accessCode: data.password }
      );

      if (!resp.transactionId) throw new Error(resp.message || 'No transactionId returned.');

      setCustomerTransactionId(resp.transactionId);
      setCustomerStep('method');
    } catch (e) {
      setCustomerErrorMessage(getErrorMessage(e));
    }
  });

  const onSubmitCustomerMethod = handleSubmitCustomerMethod(async (data) => {
    try {
      setCustomerErrorMessage(null);
      if (!customerTransactionId) throw new Error('Missing transaction. Please login again.');

      await postApi('/auth/customer/otp/send', {
        transactionId: customerTransactionId,
        method: data.otpMethod,
      });

      setCustomerStep('otp');
    } catch (e) {
      setCustomerErrorMessage(getErrorMessage(e));
    }
  });

  const onSubmitCustomerOtp = handleSubmitCustomerOtp(async (data) => {
    try {
      setCustomerErrorMessage(null);
      if (!customerTransactionId) throw new Error('Missing transaction. Please login again.');

      const resp = await postApi<{ success: boolean; token?: string; message?: string }>(
        '/auth/customer/otp/verify',
        { transactionId: customerTransactionId, otp: data.otp }
      );

      if (!resp.token) throw new Error(resp.message || 'No token returned.');

      await setSession(resp.token);
      await checkUserSession?.();
      // guards handle redirect
    } catch (e) {
      setCustomerErrorMessage(getErrorMessage(e));
    }
  });

  const onCustomerBack = () => {
    setCustomerErrorMessage(null);

    if (customerStep === 'otp') return setCustomerStep('method');
    if (customerStep === 'method') return setCustomerStep('credentials');
  };

  // ----------------------------------------------------------------------
  // RENDER

  const renderEmployeeForm = () => (
    <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
      <Field.Text
        name="emailOrUsername"
        label="Email or username"
        slotProps={{ inputLabel: { shrink: true } }}
      />

      <Box sx={{ gap: 1.5, display: 'flex', flexDirection: 'column' }}>
        <Link
          component={RouterLink}
          href="#"
          variant="body2"
          color="inherit"
          sx={{ alignSelf: 'flex-end' }}
        >
          Forgot password?
        </Link>

        <Field.Text
          name="password"
          label="Password"
          placeholder="6+ characters"
          type={showPasswordEmployee.value ? 'text' : 'password'}
          slotProps={{
            inputLabel: { shrink: true },
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={showPasswordEmployee.onToggle} edge="end">
                    <Iconify
                      icon={showPasswordEmployee.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'}
                    />
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      <LoadingButton
        fullWidth
        color="inherit"
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmittingEmployee}
        loadingIndicator="Sign in..."
      >
        Sign in as Employee
      </LoadingButton>
    </Box>
  );

  const renderCustomerCredentialsForm = () => (
    <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
      <Field.Text
        name="emailOrUsername"
        label="Payor Account Number"
        slotProps={{ inputLabel: { shrink: true } }}
      />

      <Field.Text
        name="password"
        label="Access Code"
        placeholder="Enter your access code"
        type="password"
        slotProps={{ inputLabel: { shrink: true } }}
      />

      <LoadingButton
        fullWidth
        color="inherit"
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmittingCustomerCredentials}
        loadingIndicator="Submitting..."
      >
        Submit
      </LoadingButton>
    </Box>
  );

  const renderCustomerOtpMethodForm = () => (
    <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
      <Box>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          How would you like to receive your one-time password (OTP)?
        </Typography>

        <Field.RadioGroup
          name="otpMethod"
          options={[
            { value: 'email', label: 'Email' },
            { value: 'sms', label: 'SMS' },
          ]}
        />
      </Box>

      <LoadingButton
        fullWidth
        color="inherit"
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmittingCustomerMethod}
        loadingIndicator="Continue..."
      >
        Submit
      </LoadingButton>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Link component="button" variant="body2" color="inherit" onClick={onCustomerBack}>
          Back to Login
        </Link>
      </Box>
    </Box>
  );

  const renderCustomerOtpVerifyForm = () => (
    <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
      <Field.Text
        name="otp"
        label="Enter your OTP"
        placeholder="Enter your OTP"
        slotProps={{ inputLabel: { shrink: true } }}
      />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Link component="button" variant="body2" color="inherit" onClick={onCustomerBack}>
          Back
        </Link>
      </Box>

      <LoadingButton
        fullWidth
        color="inherit"
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmittingCustomerOtp}
        loadingIndicator="Verifying..."
      >
        Submit
      </LoadingButton>
    </Box>
  );

  return (
    <>
      <FormHead
        title="Sign in to your account"
        // description={
        //   <>
        //     {`Don’t have an account? `}
        //     <Link component={RouterLink} href={paths.auth.jwt.signUp} variant="subtitle2">
        //       Get started
        //     </Link>
        //   </>
        // }
        sx={{ textAlign: { xs: 'center', md: 'left' } }}
      />

      <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, mt: 3 }}>
        <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)} variant="fullWidth">
          <Tab value="customer" label="Customer" />
          <Tab value="employee" label="Employee" />
        </Tabs>

        <Divider sx={{ mt: 2 }} />

        <TabPanel value={activeTab} tab="employee">
          {!!employeeErrorMessage && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {employeeErrorMessage}
            </Alert>
          )}

          <Form methods={employeeMethods} onSubmit={onSubmitEmployee}>
            {renderEmployeeForm()}
          </Form>
        </TabPanel>

        <TabPanel value={activeTab} tab="customer">
          {!!customerErrorMessage && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {customerErrorMessage}
            </Alert>
          )}

          {customerStep === 'credentials' && (
            <Form methods={customerCredentialsMethods} onSubmit={onSubmitCustomerCredentials}>
              {renderCustomerCredentialsForm()}
            </Form>
          )}

          {customerStep === 'method' && (
            <Form methods={customerMethodMethods} onSubmit={onSubmitCustomerMethod}>
              {renderCustomerOtpMethodForm()}
            </Form>
          )}

          {customerStep === 'otp' && (
            <Form methods={customerOtpMethods} onSubmit={onSubmitCustomerOtp}>
              {renderCustomerOtpVerifyForm()}
            </Form>
          )}
        </TabPanel>
      </Paper>
    </>
  );
}
