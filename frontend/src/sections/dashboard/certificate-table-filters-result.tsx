// certificate-table-filters-result.tsx
import type { ICertificateTableFilters } from 'src/types/certificate';
import type { UseSetStateReturn } from 'minimal-shared/hooks';
import type { FiltersResultProps } from 'src/components/filters-result';

import { useCallback } from 'react';

import Chip from '@mui/material/Chip';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

type Props = FiltersResultProps & {
  onResetPage: () => void;
  filters: UseSetStateReturn<ICertificateTableFilters>;
  tab: 'required' | 'submitted';
};

export function CertificateTableFiltersResult({
  tab,
  filters,
  onResetPage,
  totalResults,
  sx,
}: Props) {
  const { state: currentFilters, setState: updateFilters, resetState: resetFilters } = filters;

  const handleRemoveKeyword = useCallback(() => {
    onResetPage();
    updateFilters({ stateName: '' });
  }, [onResetPage, updateFilters]);

  const handleRemoveRequiredForm = useCallback(() => {
    onResetPage();
    updateFilters({ form: 'all' });
  }, [onResetPage, updateFilters]);

  const handleRemoveSubmittedStatus = useCallback(() => {
    onResetPage();
    updateFilters({ validationStatus: 'all' });
  }, [onResetPage, updateFilters]);

  const handleRemoveStateCode = useCallback(
    (inputValue: string) => {
      const newValue = currentFilters.stateCode.filter((item) => item !== inputValue);
      onResetPage();
      updateFilters({ stateCode: newValue });
    },
    [onResetPage, updateFilters, currentFilters.stateCode]
  );

  const handleReset = useCallback(() => {
    onResetPage();
    resetFilters();
  }, [onResetPage, resetFilters]);

  return (
    <FiltersResult totalResults={totalResults} onReset={handleReset} sx={sx}>
      {tab === 'required' && (
        <FiltersBlock label="Form:" isShow={currentFilters.form !== 'all'}>
          <Chip
            {...chipProps}
            label={currentFilters.form}
            onDelete={handleRemoveRequiredForm}
            sx={{ textTransform: 'capitalize' }}
          />
        </FiltersBlock>
      )}

      {tab === 'submitted' && (
        <FiltersBlock label="Status:" isShow={currentFilters.validationStatus !== 'all'}>
          <Chip
            {...chipProps}
            label={currentFilters.validationStatus}
            onDelete={handleRemoveSubmittedStatus}
            sx={{ textTransform: 'capitalize' }}
          />
        </FiltersBlock>
      )}

      <FiltersBlock label="Code:" isShow={!!currentFilters.stateCode.length}>
        {currentFilters.stateCode.map((item) => (
          <Chip
            {...chipProps}
            key={item}
            label={item}
            onDelete={() => handleRemoveStateCode(item)}
          />
        ))}
      </FiltersBlock>

      <FiltersBlock label="Keyword:" isShow={!!currentFilters.stateName}>
        <Chip {...chipProps} label={currentFilters.stateName} onDelete={handleRemoveKeyword} />
      </FiltersBlock>
    </FiltersResult>
  );
}
