'use client';

import { Plus } from 'lucide-react';
import { FormHeader } from '@/components/layout/FormHeader';
import { Button } from '@/components/shared/Button';

export function FollowUpPageHeader({
  onAddFollowUp,
  onBack,
  backLabel = 'Back to Customer Due',
  isAddForm = false,
}: {
  onAddFollowUp: () => void;
  onBack: () => void;
  backLabel?: string;
  isAddForm?: boolean;
}) {
  return (
    <div className="pt-3 md:pt-4 mb-3 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-2">
      <FormHeader
        compact
        title={isAddForm ? 'Add Follow-up' : 'Follow-up / Activity'}
        subtitle={
          isAddForm
            ? 'Record communication and follow-up with customer.'
            : 'Track all communication and follow-ups with customer.'
        }
        onBack={onBack}
        backLabel={backLabel}
      />
      {!isAddForm ? (
        <Button
          type="button"
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          onClick={onAddFollowUp}
        >
          Add Follow-up
        </Button>
      ) : null}
    </div>
  );
}
