import type { IPostCOC } from 'src/types/code';

import { z as zod } from 'zod';
import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import FormControlLabel from '@mui/material/FormControlLabel';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { _tags } from 'src/_mock';

import { toast } from 'src/components/snackbar';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

import { PostDetailsPreview } from './form-details-preview';

// ----------------------------------------------------------------------

export type NewPostSchemaType = zod.infer<typeof NewPostSchema>;

export const NewPostSchema = zod.object({
  staffName: zod.string().min(1, { message: 'Required!' }),
  staffId: zod.string().min(1, { message: 'Required!' }),
  campaign: zod.string().min(1, { message: 'Required!' }),
  teamLeader: zod.string().min(1, { message: 'Required!' }),
  reportBy: zod.string().min(1, { message: 'Required!' }),
  incidentDate: schemaHelper.date({ message: { required: 'Required!' } }),
  reportDate: schemaHelper.date({ message: { required: 'Required!' } }),
  category: zod.string().min(1, { message: 'Required!' }),
  subCategory: zod.string().min(1, { message: 'Required!' }),
  breach: zod.string().min(1, { message: 'Required!' }),
  description: zod.string().min(1, { message: 'Required!' }),
  breachCount: zod.string().min(1, { message: 'Required!' }),
  breachType: zod.string().min(1, { message: 'Required!' }),
  counselling: zod.string().min(1, { message: 'Required!' }),
  behaviorChange: zod.string().min(1, { message: 'Required!' }),
  actionDeliberate: zod.string().min(1, { message: 'Required!' }),
  recommendedAction: zod.string().min(1, { message: 'Required!' }),
  forReview: zod.string().min(1, { message: 'Required!' }),
  leniency: zod.string().min(1, { message: 'Required!' }),
  forDole: zod.string().min(1, { message: 'Required!' }),
  executiveName: zod.string().min(1, { message: 'Required!' }),
  date: schemaHelper.date({ message: { required: 'Required!' } }),
});
// ----------------------------------------------------------------------

type Props = {
  currentPost?: IPostCOC;
};

const toFormValues = (post?: IPostCOC): NewPostSchemaType => ({
  staffName: post?.staffName ?? '',
  staffId: post?.staffId ?? '',
  campaign: post?.campaign ?? '',
  teamLeader: post?.teamLeader ?? '',
  reportBy: post?.reportBy ?? '',
  incidentDate: post?.incidentDate ?? null,
  reportDate: post?.incidentDate ?? null,
  category: post?.category ?? [],
  subCategory: post?.subCategory ?? '',
  breach: post?.breach ?? '',
  description: post?.description ?? '',
  breach: post?.breach ?? '',
  breach: post?.breach ?? '',
  breach: post?.breach ?? '',
  breach: post?.breach ?? '',
  breach: post?.breach ?? '',
  breach: post?.breach ?? '',
  breach: post?.breach ?? '',
  breach: post?.breach ?? '',
  breach: post?.breach ?? '',
});

// ----------------------------------------------------------------------

export function PostNewEditForm({ currentPost }: Props) {
  const router = useRouter();

  const showPreview = useBoolean();

  const methods = useForm<NewPostSchemaType>({
    mode: 'all',
    resolver: zodResolver(NewPostSchema),
    defaultValues: toFormValues(currentPost),
  });

  const {
    reset,
    watch,
    setValue,
    handleSubmit,
    formState: { isSubmitting, isValid },
  } = methods;

  const values = watch();

  const onSubmit = handleSubmit(async (data) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      reset();
      showPreview.onFalse();
      toast.success(currentPost ? 'Update success!' : 'Create success!');
      router.push(paths.dashboard.root);
      console.info('DATA', data);
    } catch (error) {
      console.error(error);
    }
  });

  const handleRemoveFile = useCallback(() => {
    setValue('coverUrl', null);
  }, [setValue]);

  const renderDetails = () => (
    <Card>
      <CardHeader title="Section 1" subheader="Staff Incident Report" sx={{ mb: 3 }} />

      <Divider />

      <Stack spacing={3} sx={{ p: 3 }}>
        <Field.Text name="staffName" label="Name of Staff Member" />

        <Field.Text name="staffId" label="Staff ID" />

        <Stack spacing={1.5}>
          <Typography variant="subtitle2">Description</Typography>
          <Field.Editor name="content" sx={{ maxHeight: 480 }} />
        </Stack>

        <Stack spacing={1.5}>
          <Typography variant="subtitle2">Cover</Typography>
          <Field.Upload name="coverUrl" maxSize={3145728} onDelete={handleRemoveFile} />
        </Stack>
      </Stack>
    </Card>
  );

  const renderProperties = () => (
    <Card>
      <CardHeader
        title="Properties"
        subheader="Additional functions and attributes..."
        sx={{ mb: 3 }}
      />

      <Divider />

      <Stack spacing={3} sx={{ p: 3 }}>
        <Field.Autocomplete
          name="tags"
          label="Tags"
          placeholder="+ Tags"
          multiple
          freeSolo
          disableCloseOnSelect
          options={_tags.map((option) => option)}
          getOptionLabel={(option) => option}
          renderOption={(props, option) => (
            <li {...props} key={option}>
              {option}
            </li>
          )}
          renderTags={(selected, getTagProps) =>
            selected.map((option, index) => (
              <Chip
                {...getTagProps({ index })}
                key={option}
                label={option}
                size="small"
                color="info"
                variant="soft"
              />
            ))
          }
        />

        <Field.Text name="metaTitle" label="Meta title" />

        <Field.Text name="metaDescription" label="Meta description" fullWidth multiline rows={3} />

        <Field.Autocomplete
          name="metaKeywords"
          label="Meta keywords"
          placeholder="+ Keywords"
          multiple
          freeSolo
          disableCloseOnSelect
          options={_tags.map((option) => option)}
          getOptionLabel={(option) => option}
          renderOption={(props, option) => (
            <li {...props} key={option}>
              {option}
            </li>
          )}
          renderTags={(selected, getTagProps) =>
            selected.map((option, index) => (
              <Chip
                {...getTagProps({ index })}
                key={option}
                label={option}
                size="small"
                color="info"
                variant="soft"
              />
            ))
          }
        />
      </Stack>
    </Card>
  );

  const renderActions = () => (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'flex-end',
      }}
    >
      <div>
        <LoadingButton
          type="submit"
          variant="contained"
          size="large"
          loading={isSubmitting}
          sx={{ ml: 2 }}
        >
          {!currentPost ? 'Create post' : 'Save changes'}
        </LoadingButton>
      </div>
    </Box>
  );

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Stack spacing={5} sx={{ mx: 'auto', maxWidth: { xs: 720, xl: 880 } }}>
        {renderDetails()}
        {renderProperties()}
        {renderActions()}
      </Stack>

      <PostDetailsPreview
        isValid={isValid}
        onSubmit={onSubmit}
        staffName={values.staffName}
        open={showPreview.value}
        content={values.content}
        onClose={showPreview.onFalse}
        coverUrl={values.coverUrl}
        isSubmitting={isSubmitting}
        staffId={values.staffId}
      />
    </Form>
  );
}
