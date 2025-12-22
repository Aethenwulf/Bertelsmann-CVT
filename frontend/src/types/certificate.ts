export type ICertificateTableFilters = {
  stateCode: string[];
  stateName: string;
  form: string;
  formType: string;
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
  validationStatus: 'Pending' | 'Approved' | 'Rejected';
  stateCode: string;
  expirationDate: string;
  submittedBy: string;
};
