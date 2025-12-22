import { _mock } from './_mock';
import type { IRequiredCertificateItem, ISubmittedCertificateItem } from 'src/types/certificate';

export const CERT_FORM_TYPE_OPTIONS = [
  { value: 'RESALE', label: 'Resale' },
  { value: 'EXEMPT', label: 'Exempt' },
];

export const SUBMITTED_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'rejected', label: 'Rejected' },
];

const CERTIFICATE_ROWS: Omit<IRequiredCertificateItem, 'id' | 'index'>[] = [
  {
    stateCode: 'CO',
    stateName: 'Colorado',
    form: 'MULTIJURISDICTION',
    formType: 'RESALE',
    canFillOnline: true,
    canDownload: true,
  },
  {
    stateCode: 'CO',
    stateName: 'Colorado',
    form: 'DR5002',
    formType: 'EXEMPT',
    canFillOnline: true,
    canDownload: true,
  },
  {
    stateCode: 'FL',
    stateName: 'Florida',
    form: 'DR13',
    formType: 'RESALE',
    canFillOnline: false,
    canDownload: true,
  },
  {
    stateCode: 'FL',
    stateName: 'Florida',
    form: 'DR14',
    formType: 'EXEMPT',
    canFillOnline: false,
    canDownload: true,
  },
  {
    stateCode: 'FL',
    stateName: 'Florida',
    form: 'MULTIJURISDICTION',
    formType: 'RESALE',
    canFillOnline: true,
    canDownload: true,
  },
];

export const _requiredCertificate: IRequiredCertificateItem[] = CERTIFICATE_ROWS.map((row, index) => ({
  id: _mock.id(index),
  index: index + 1,
  ...row,
}));

export const _submittedCertificate: ISubmittedCertificateItem[] = [
  {
    id: _mock.id(1),
    dateSubmitted: '11/24/2025',
    form: 'MULTIJURISDICTION',
    validationStatus: 'Pending',
    stateCode: 'FL',
    expirationDate: '-',
    submittedBy: 'salestax@bertelsmann.com',
  },
  {
    id: _mock.id(2),
    dateSubmitted: '11/12/2025',
    form: 'DR5002',
    validationStatus: 'Approved',
    stateCode: 'CO',
    expirationDate: '11/12/2026',
    submittedBy: 'finance@acme.com',
  },
  {
    id: _mock.id(3),
    dateSubmitted: '10/03/2025',
    form: 'DR13',
    validationStatus: 'Rejected',
    stateCode: 'FL',
    expirationDate: '-',
    submittedBy: 'sales@company.com',
  },
];
