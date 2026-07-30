export type LeadFormValues = {
  name: string;
  phone: string;
  alternativePhone: string;
  company: string;
  email: string;
  interestedProduct: string;
  customerRequirement: string;
  source: string;
  campaign: string;
  adCreative: string;
  assignedRepId: string;
  status: string;
  priority: string;
  followUpDate: string;
  followUpTime: string;
  expectedValue: string;
  notes: string;
};

export type LeadFormFieldError = Partial<Record<keyof LeadFormValues, string>>;

export function validateLeadForm(form: LeadFormValues): LeadFormFieldError {
  const errors: LeadFormFieldError = {};

  if (!form.name.trim()) {
    errors.name = 'Lead name is required.';
  }
  if (!form.phone.trim()) {
    errors.phone = 'Phone number is required.';
  }
  if (!form.interestedProduct.trim()) {
    errors.interestedProduct = 'Interested product or service is required.';
  }
  if (!form.source.trim()) {
    errors.source = 'Lead source is required.';
  }
  if (!form.assignedRepId.trim()) {
    errors.assignedRepId = 'Assigned sales person is required.';
  }
  if (!form.status.trim()) {
    errors.status = 'Lead status is required.';
  }
  if (!form.followUpDate.trim()) {
    errors.followUpDate = 'Follow-up date is required.';
  }
  if (!form.followUpTime.trim()) {
    errors.followUpTime = 'Follow-up time is required.';
  }

  return errors;
}
