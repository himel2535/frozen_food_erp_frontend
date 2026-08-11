export type ContactMethod = 'call' | 'whatsapp' | 'email' | 'sms' | 'meeting';

export type FollowUpOutcome =
  | 'connected'
  | 'no_answer'
  | 'busy'
  | 'call_later'
  | 'payment_promised'
  | 'payment_sent'
  | 'dispute'
  | 'wrong_number';

export type FollowUpFormValues = {
  contactPerson: string;
  contactMethod: ContactMethod;
  contactDate: string;
  contactTime: string;
  assignedTo: string;
  outcome: FollowUpOutcome;
  notes: string;
  scheduleNext: boolean;
  nextDate: string;
  nextTime: string;
  nextAssignedTo: string;
  reminder: string;
  nextNote: string;
  promiseAmount: string;
  expectedPaymentDate: string;
  attachmentName: string;
  attachmentUrl: string;
};

export type StaffOption = {
  id: string;
  name: string;
  initials: string;
};
