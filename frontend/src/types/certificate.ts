export type CertificateValidationFilter = 'all' | 'pending' | 'rejected' | 'approved';

export type ICertificateTableFilters = {
  stateName: string;
  stateCode: string[];
  form: string;
  formType: string;
  validationStatus: CertificateValidationFilter;
};

export type IRequiredCertificateItem = {
  id: string;
  index: number;
  stateCode: string;
  stateName: string;
  form: string;
  formType: string;
  canFillOnline: boolean;
  canDownload: boolean;
};

export type ISubmittedCertificateItem = {
  id: string;
  dateSubmitted: string;
  form: string;
  validationStatus: string;
  stateCode: string;
  expirationDate: string;
  submittedBy: string;
};
