import type { CompanySignature } from '@/lib/state/types';

export type SignatureFormState = {
  label: string;
  signerName: string;
  designation: string;
  imageDataUrl: string;
  isDefault: boolean;
};

export const EMPTY_SIGNATURE_FORM: SignatureFormState = {
  label: 'Authorized Signatory',
  signerName: '',
  designation: '',
  imageDataUrl: '',
  isDefault: false,
};

export function signatureToForm(signature: CompanySignature): SignatureFormState {
  return {
    label: signature.label,
    signerName: signature.signerName,
    designation: signature.designation ?? '',
    imageDataUrl: signature.imageDataUrl,
    isDefault: signature.isDefault ?? false,
  };
}

export function formToSignatureInput(form: SignatureFormState) {
  return {
    label: form.label.trim() || 'Authorized Signatory',
    signerName: form.signerName.trim(),
    designation: form.designation.trim() || undefined,
    imageDataUrl: form.imageDataUrl,
    isDefault: form.isDefault,
  };
}
