'use client';

import type { TableHeadCellProps } from 'src/components/table';

import { useState, useCallback, useEffect } from 'react';
import { varAlpha } from 'minimal-shared/utils';
import { useBoolean, useSetState } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { DashboardContent } from 'src/layouts/dashboard';
import {
  _requiredCertificate,
  _submittedCertificate,
  _stateCode,
  SUBMITTED_STATUS_OPTIONS,
} from 'src/_mock';
import type {
  IRequiredCertificateItem,
  ISubmittedCertificateItem,
  ICertificateTableFilters,
} from 'src/types/certificate';
import { deleteUser } from 'src/api/users';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  emptyRows,
  rowInPage,
  TableNoData,
  getComparator,
  TableEmptyRows,
  TableHeadCustom,
  TableSelectedAction,
  TablePaginationCustom,
} from 'src/components/table';

import { RequiredTableRow } from '../required-table-row';
import { SubmittedTableRow } from '../submitted-table-row';
import { CertificateTableToolbar } from '../certificate-table-toolbar';
import { CertificateTableFiltersResult } from '../certificate-table-filters-result';
import type { CertificateValidationFilter } from 'src/types/certificate';

// ----------------------------------------------------------------------

const TABLE_HEAD_REQUIRED: TableHeadCellProps[] = [
  { id: 'stateCode', label: 'State', width: 180 },
  { id: 'stateName', label: 'State Name', width: 220 },
  { id: 'form', label: 'Form', width: 180 },
  { id: 'formType', label: 'Form Type', width: 220 },
  { id: '', width: 88 },
];

const TABLE_HEAD_SUBMITTED: TableHeadCellProps[] = [
  { id: 'dateSubmitted', label: 'Date Submitted', width: 180 },
  { id: 'form', label: 'Form', width: 220 },
  { id: 'validationStatus', label: 'Validate Status', width: 180 },
  { id: 'stateCode', label: 'State', width: 120 },
  { id: 'expirationDate', label: 'Expiration Date', width: 180 },
  { id: 'submittedBy', label: 'Submitted By', width: 220 },
  { id: '', width: 88 },
];

type CertificateRowBase = { id: string };

// ----------------------------------------------------------------------

export function CertificateListView() {
  const table = useTable();
  const confirmDialog = useBoolean();

  const [requiredData, setRequiredData] = useState<IRequiredCertificateItem[]>([]);
  const [submittedData, setSubmittedData] = useState<ISubmittedCertificateItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentTab, setCurrentTab] = useState<'required' | 'submitted'>('required');

  const filters = useSetState<ICertificateTableFilters>({
    stateName: '',
    stateCode: [],
    form: 'all',
    formType: '',
    validationStatus: 'all', // ✅ important: lowercase to match tabs values
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  // Submitted status filter tabs handler
  const handleFilterSubmittedStatus = useCallback(
    (event: React.SyntheticEvent, newValue: CertificateValidationFilter) => {
      table.onResetPage();
      updateFilters({ validationStatus: newValue });
    },
    [table, updateFilters]
  );

  // 🔑 one comparator for both tables
  const comparator = getComparator(table.order, table.orderBy) as (a: any, b: any) => number;

  // REQUIRED: filter + sort
  const requiredFiltered = applyRequiredFilter({
    inputData: requiredData,
    comparator,
    filters: currentFilters,
  });

  // SUBMITTED: filter + sort using SAME filters (but different logic)
  const submittedFiltered = applySubmittedFilter({
    inputData: submittedData,
    comparator,
    filters: currentFilters,
  });

  const activeDataFiltered: CertificateRowBase[] =
    currentTab === 'required' ? requiredFiltered : submittedFiltered;

  const dataInPage = rowInPage(activeDataFiltered, table.page, table.rowsPerPage);

  const canReset =
    !!currentFilters.stateName ||
    currentFilters.stateCode.length > 0 ||
    (currentTab === 'required' && currentFilters.form !== 'all') ||
    (currentTab === 'submitted' && currentFilters.validationStatus !== 'all');

  const notFound =
    currentTab === 'required'
      ? (!requiredFiltered.length && canReset) || !requiredFiltered.length
      : (!submittedFiltered.length && canReset) || !submittedFiltered.length;

  const handleDeleteRow = useCallback(
    async (id: string) => {
      try {
        await deleteUser(id);

        if (currentTab === 'required') {
          const deleteRow = requiredData.filter((row) => row.id !== id);
          setRequiredData(deleteRow);
        } else {
          const deleteRow = submittedData.filter((row) => row.id !== id);
          setSubmittedData(deleteRow);
        }

        table.onUpdatePageDeleteRow(dataInPage.length);

        toast.success('Certificate deleted');
      } catch (err: any) {
        console.error(err);
        toast.error(err.message ?? 'Failed to delete Certificate');
      }
    },
    [currentTab, requiredData, submittedData, table, dataInPage.length]
  );

  const handleDeleteRows = useCallback(async () => {
    try {
      await Promise.all(table.selected.map((id) => deleteUser(id)));

      if (currentTab === 'required') {
        const deleteRows = requiredData.filter((row) => !table.selected.includes(row.id));
        setRequiredData(deleteRows);
      } else {
        const deleteRows = submittedData.filter((row) => !table.selected.includes(row.id));
        setSubmittedData(deleteRows);
      }

      table.onUpdatePageDeleteRows(dataInPage.length, activeDataFiltered.length);

      toast.success('Certificates deleted');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message ?? 'Failed to delete selected certificates');
    }
  }, [
    currentTab,
    requiredData,
    submittedData,
    table,
    dataInPage.length,
    activeDataFiltered.length,
  ]);

  // (Optional) If you still have "form tabs" somewhere else, keep this.
  // Your current UI doesn't render form tabs here, but leaving handler is harmless.
  const handleFilterStatus = useCallback(
    (event: React.SyntheticEvent, newValue: string) => {
      table.onResetPage();
      updateFilters({ form: newValue });
    },
    [updateFilters, table]
  );

  const handleChangeTab = useCallback(
    (event: React.SyntheticEvent, newValue: 'required' | 'submitted') => {
      setCurrentTab(newValue);
      table.onResetPage();
    },
    [table]
  );

  const renderConfirmDialog = () => (
    <ConfirmDialog
      open={confirmDialog.value}
      onClose={confirmDialog.onFalse}
      title="Delete"
      content={
        <>
          Are you sure want to delete <strong> {table.selected.length} </strong> items?
        </>
      }
      action={
        <Button
          variant="contained"
          color="error"
          onClick={() => {
            handleDeleteRows();
            confirmDialog.onFalse();
          }}
        >
          Delete
        </Button>
      }
    />
  );

  const fetchCertificates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const required = await _requiredCertificate;
      const submitted = await _submittedCertificate;

      setRequiredData(required);
      setSubmittedData(submitted);
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? 'Failed to load certificates');
      toast.error('Failed to load certificates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  const headCells = currentTab === 'required' ? TABLE_HEAD_REQUIRED : TABLE_HEAD_SUBMITTED;

  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Certificates"
          links={[{ name: 'Dashboard', href: paths.dashboard.root }]}
          action={
            <Button
              component={RouterLink}
              href={paths.dashboard.user.new}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              New Certificate
            </Button>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Card>
          {/* Tabs: Required / Submitted */}
          <Tabs value={currentTab} onChange={handleChangeTab} sx={{ px: 2, pt: 2 }}>
            <Tab value="required" label="Required" />
            <Tab value="submitted" label="Submitted" />
          </Tabs>

          {/* ✅ Submitted status tabs (only on Submitted tab) */}
          {currentTab === 'submitted' && (
            <Tabs
              value={currentFilters.validationStatus}
              onChange={handleFilterSubmittedStatus}
              sx={[
                (theme) => ({
                  px: 2.5,
                  boxShadow: `inset 0 -2px 0 0 ${varAlpha(
                    theme.vars.palette.grey['500Channel'],
                    0.08
                  )}`,
                }),
              ]}
            >
              {SUBMITTED_STATUS_OPTIONS.map((tabOpt) => (
                <Tab
                  key={tabOpt.value}
                  value={tabOpt.value}
                  label={tabOpt.label}
                  iconPosition="end"
                  icon={
                    <Label
                      variant={
                        ((tabOpt.value === 'all' ||
                          tabOpt.value === currentFilters.validationStatus) &&
                          'filled') ||
                        'soft'
                      }
                      color={
                        (tabOpt.value === 'pending' && 'warning') ||
                        (tabOpt.value === 'rejected' && 'error') ||
                        (tabOpt.value === 'approved' && 'success') ||
                        'default'
                      }
                    >
                      {tabOpt.value === 'all'
                        ? submittedData.length
                        : submittedData.filter(
                            (row) => row.validationStatus?.toLowerCase() === tabOpt.value
                          ).length}
                    </Label>
                  }
                />
              ))}
            </Tabs>
          )}

          {/* Toolbar (Code multi-select + Search) */}
          <CertificateTableToolbar
            filters={filters}
            onResetPage={table.onResetPage}
            options={{ countries: _stateCode }}
          />

          {/* Filters result chips */}
          {canReset && (
            <CertificateTableFiltersResult
              tab={currentTab}
              filters={filters}
              totalResults={
                currentTab === 'required' ? requiredFiltered.length : submittedFiltered.length
              }
              onResetPage={table.onResetPage}
              sx={{ p: 2.5, pt: 0 }}
            />
          )}

          <Box sx={{ position: 'relative' }}>
            <TableSelectedAction
              dense={table.dense}
              numSelected={table.selected.length}
              rowCount={activeDataFiltered.length}
              onSelectAllRows={(checked) =>
                table.onSelectAllRows(
                  checked,
                  activeDataFiltered.map((row) => row.id)
                )
              }
              action={
                <Tooltip title="Delete">
                  <IconButton color="primary" onClick={confirmDialog.onTrue}>
                    <Iconify icon="solar:trash-bin-trash-bold" />
                  </IconButton>
                </Tooltip>
              }
            />

            <Scrollbar>
              <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
                <TableHeadCustom
                  order={table.order}
                  orderBy={table.orderBy}
                  headCells={headCells}
                  rowCount={activeDataFiltered.length}
                  numSelected={table.selected.length}
                  onSort={table.onSort}
                  onSelectAllRows={(checked) =>
                    table.onSelectAllRows(
                      checked,
                      activeDataFiltered.map((row) => row.id)
                    )
                  }
                />

                <TableBody>
                  {currentTab === 'required' &&
                    requiredFiltered
                      .slice(
                        table.page * table.rowsPerPage,
                        table.page * table.rowsPerPage + table.rowsPerPage
                      )
                      .map((row) => (
                        <RequiredTableRow
                          key={row.id}
                          row={row}
                          selected={table.selected.includes(row.id)}
                          onSelectRow={() => table.onSelectRow(row.id)}
                          onDeleteRow={() => handleDeleteRow(row.id)}
                          editHref={paths.dashboard.user.edit(row.id)}
                        />
                      ))}

                  {currentTab === 'submitted' &&
                    submittedFiltered
                      .slice(
                        table.page * table.rowsPerPage,
                        table.page * table.rowsPerPage + table.rowsPerPage
                      )
                      .map((row) => (
                        <SubmittedTableRow
                          key={row.id}
                          row={row}
                          selected={table.selected.includes(row.id)}
                          onSelectRow={() => table.onSelectRow(row.id)}
                          onDeleteRow={() => handleDeleteRow(row.id)}
                          editHref={paths.dashboard.user.edit(row.id)}
                        />
                      ))}

                  <TableEmptyRows
                    height={table.dense ? 56 : 56 + 20}
                    emptyRows={emptyRows(table.page, table.rowsPerPage, activeDataFiltered.length)}
                  />

                  <TableNoData notFound={notFound} />
                </TableBody>
              </Table>
            </Scrollbar>
          </Box>

          <TablePaginationCustom
            page={table.page}
            dense={table.dense}
            count={activeDataFiltered.length}
            rowsPerPage={table.rowsPerPage}
            onPageChange={table.onChangePage}
            onChangeDense={table.onChangeDense}
            onRowsPerPageChange={table.onChangeRowsPerPage}
          />
        </Card>
      </DashboardContent>

      {renderConfirmDialog()}
    </>
  );
}

// ----------------------------------------------------------------------

// 🔁 shared stable sort
function stableSort<T>(array: T[], comparator: (a: T, b: T) => number): T[] {
  const stabilized = array.map((el, index) => [el, index] as const);
  stabilized.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilized.map((el) => el[0]);
}

type ApplyFilterProps = {
  inputData: IRequiredCertificateItem[];
  filters: ICertificateTableFilters;
  comparator: (a: any, b: any) => number;
};

function applyRequiredFilter({ inputData, comparator, filters }: ApplyFilterProps) {
  const { stateName, stateCode, form } = filters;

  let data = stableSort(inputData, comparator);

  if (stateName) {
    const keyword = stateName.toLowerCase();
    data = data.filter(
      (certificate) =>
        certificate.stateName.toLowerCase().includes(keyword) ||
        certificate.form.toLowerCase().includes(keyword) ||
        certificate.formType.toLowerCase().includes(keyword)
    );
  }

  if (form !== 'all') {
    data = data.filter((certificate) => certificate.form === form);
  }

  if (stateCode.length) {
    data = data.filter((certificate) => stateCode.includes(certificate.stateCode));
  }

  return data;
}

type ApplySubmittedFilterProps = {
  inputData: ISubmittedCertificateItem[];
  filters: ICertificateTableFilters;
  comparator: (a: any, b: any) => number;
};

function applySubmittedFilter({ inputData, comparator, filters }: ApplySubmittedFilterProps) {
  const { stateName, stateCode, validationStatus } = filters;

  let data = stableSort(inputData, comparator);

  // 🔎 Search only on form + submittedBy for submitted tab
  if (stateName) {
    const keyword = stateName.toLowerCase();
    data = data.filter(
      (certificate) =>
        certificate.form.toLowerCase().includes(keyword) ||
        certificate.submittedBy.toLowerCase().includes(keyword)
    );
  }

  // Code filter: still by stateCode
  if (stateCode.length) {
    data = data.filter((certificate) => stateCode.includes(certificate.stateCode));
  }

  // ✅ Status filter: compare lowercase against your tab values
  if (validationStatus !== 'all') {
    data = data.filter(
      (certificate) => certificate.validationStatus?.toLowerCase() === validationStatus
    );
  }

  return data;
}
