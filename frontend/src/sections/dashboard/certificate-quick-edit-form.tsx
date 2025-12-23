import type { IRequiredCertificateItem, ISubmittedCertificateItem } from 'src/types/certificate';

import { z as zod } from 'zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { SUBMITTED_STATUS_OPTIONS } from 'src/_mock';
import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export type CertificateQuickEditSchemaType = zod.infer<typeof CertificateQuickEditSchema>;

export const CertificateQuickEditSchema = zod.object({
  // common
  stateCode: zod.string().min(1, { message: 'Required!' }),
  stateName: zod.string().min(1, { message: 'Required!' }),
  form: zod.string().min(1, { message: 'Required!' }),
  formType: zod.string().optional(), // not present on submitted item in your type

  // submitted-only (optional in schema, enforced by UI when mode === 'submitted')
  dateSubmitted: zod.string().optional(),
  validationStatus: zod.string().optional(),
  expirationDate: zod.string().optional(),
  submittedBy: zod.string().optional(),
});

// ----------------------------------------------------------------------

type Mode = 'required' | 'submitted';

type Props = {
  open: boolean;
  onClose: () => void;
  mode: Mode;
  requiredCertificate?: IRequiredCertificateItem;
  submittedCertificate?: ISubmittedCertificateItem;
};

export function CertificateQuickEditForm({
  open,
  onClose,
  mode,
  requiredCertificate,
  submittedCertificate,
}: Props) {
  const defaultValues: CertificateQuickEditSchemaType = {
    stateCode: '',
    stateName: '',
    form: '',
    formType: '',
    dateSubmitted: '',
    validationStatus: '',
    expirationDate: '',
    submittedBy: '',
  };

  const methods = useForm<CertificateQuickEditSchemaType>({
    mode: 'all',
    resolver: zodResolver(CertificateQuickEditSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    if (mode === 'required' && requiredCertificate) {
      reset({
        stateCode: requiredCertificate.stateCode ?? '',
        stateName: requiredCertificate.stateName ?? '',
        form: requiredCertificate.form ?? '',
        formType: requiredCertificate.formType ?? '',
        dateSubmitted: '',
        validationStatus: '',
        expirationDate: '',
        submittedBy: '',
      });
    } else if (mode === 'submitted' && submittedCertificate) {
      reset({
        stateCode: submittedCertificate.stateCode ?? '',
        stateName: '', // you can map this if you have state name somewhere
        form: submittedCertificate.form ?? '',
        formType: '',
        dateSubmitted: submittedCertificate.dateSubmitted ?? '',
        validationStatus: submittedCertificate.validationStatus
          ? submittedCertificate.validationStatus.toLowerCase()
          : '',
        expirationDate: submittedCertificate.expirationDate ?? '',
        submittedBy: submittedCertificate.submittedBy ?? '',
      });
    } else {
      reset(defaultValues);
    }
  }, [mode, requiredCertificate, submittedCertificate, reset]);

  const onSubmit = handleSubmit(async (data) => {
    const promise = new Promise((resolve) => setTimeout(resolve, 1000));

    try {
      toast.promise(promise, {
        loading: 'Saving...',
        success: 'Update success!',
        error: 'Update error!',
      });

      await promise;

      console.info('QUICK EDIT MODE:', mode);
      console.info('DATA:', data);

      reset();
      onClose();
    } catch (error) {
      console.error(error);
    }
  });

  // 👉 PDF under public/form/fw8ben.pdf
  const pdfUrl = '/form/fw8ben.pdf';

  return (
    <Dialog
      fullWidth
      maxWidth="xl"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { maxWidth: 1800 } }}
    >
      <DialogTitle>
        Quick update – {mode === 'required' ? 'Required certificate' : 'Submitted certificate'}
      </DialogTitle>

      <Form methods={methods} onSubmit={onSubmit}>
        {/* 🔄 side-by-side layout here */}
        <DialogContent sx={{ p: 0 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              height: { md: 600 }, // height of dialog body on desktop
            }}
          >
            {/* LEFT: existing form fields */}
            <Box
              sx={{
                flex: 1,
                p: 3,
                overflow: 'auto',
              }}
            >
              <Alert variant="outlined" severity="info" sx={{ mb: 3 }}>
                Edit form details
              </Alert>

              <Box
                sx={{
                  rowGap: 3,
                  columnGap: 2,
                  display: 'grid',
                  gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
                }}
              >
                {/* Common fields */}
                <Field.Text name="stateCode" label="Name of Beneficial Owner" />
                <Field.Text name="stateName" label="Country of citizenship" />

                <Divider sx={{ mb: -2, gridColumn: '1 / -1' }}>Permanent address</Divider>

                {/* Permanent Address */}
                <Field.Text name="form" label="Address" />
                <Field.Text name="form" label="City or town, state or province. postal code." />

                <Divider sx={{ mb: -2, gridColumn: '1 / -1' }}>
                  Mailing address (if different from above){' '}
                </Divider>

                {/* Mailing Address */}
                <Field.Text name="formType" label="Mailing address" />
                <Field.Text name="formType" label="City or town, state or province. postal code." />

                {/* Submitted-only fields */}
                {mode === 'submitted' && (
                  <>
                    <Field.Text name="dateSubmitted" label="Date Submitted" />
                    <Field.Select name="validationStatus" label="Validation status">
                      {SUBMITTED_STATUS_OPTIONS.filter((opt) => opt.value !== 'all').map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Field.Select>
                    <Field.Text name="expirationDate" label="Expiration date" />
                    <Field.Text name="submittedBy" label="Submitted by" />
                  </>
                )}
              </Box>
            </Box>

            {/* RIGHT: PDF viewer */}
            <Box
              sx={{
                flex: 1,
                borderTop: { xs: 1, md: 0 },
                borderLeft: { md: 1, xs: 0 },
                borderColor: 'divider',
                minHeight: { xs: 300, md: 'auto' },
              }}
            >
              <Box sx={{ height: '100%' }}>
                <object data={pdfUrl} type="application/pdf" width="100%" height="100%">
                  {/* Fallback for some browsers */}
                  <iframe src={pdfUrl} width="100%" height="100%" style={{ border: 'none' }} />
                </object>
              </Box>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>

          <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
            Submit
          </LoadingButton>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
