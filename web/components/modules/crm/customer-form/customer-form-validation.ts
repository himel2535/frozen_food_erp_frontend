import type { CustomerFormValues } from '@/components/modules/crm/CustomerForm';

export type CustomerFormFieldError = Partial<Record<keyof CustomerFormValues, string>>;

export function validateCustomerForm(form: CustomerFormValues): CustomerFormFieldError {
  const errors: CustomerFormFieldError = {};

  if (!form.companyName.trim()) {
    errors.companyName = 'Company name is required.';
  }
  if (!form.customerType.trim()) {
    errors.customerType = 'Customer type is required.';
  }
  if (!form.contactPerson.trim()) {
    errors.contactPerson = 'Contact person is required.';
  }
  if (!form.mobile.trim()) {
    errors.mobile = 'Mobile number is required.';
  }
  if (!form.billingAddress.trim()) {
    errors.billingAddress = 'Billing address is required.';
  }
  if (!form.billingCity.trim()) {
    errors.billingCity = 'Division is required.';
  }
  if (!form.billingDistrict.trim()) {
    errors.billingDistrict = 'District is required.';
  }
  if (!form.billingArea.trim()) {
    errors.billingArea = 'Thana / upazilla is required.';
  }
  if (!form.paymentTerms.trim()) {
    errors.paymentTerms = 'Payment terms is required.';
  }
  if (!form.sameAsBilling) {
    if (!form.shippingAddress.trim()) {
      errors.shippingAddress = 'Delivery address is required.';
    }
    if (!form.shippingCity.trim()) {
      errors.shippingCity = 'Division is required.';
    }
    if (!form.shippingDistrict.trim()) {
      errors.shippingDistrict = 'District is required.';
    }
    if (!form.shippingArea.trim()) {
      errors.shippingArea = 'Thana / upazilla is required.';
    }
  }

  return errors;
}

export function getBillingAddressErrors(errors: CustomerFormFieldError) {
  const fieldErrors: Partial<Record<'line1' | 'city' | 'district' | 'area', string>> = {};
  if (errors.billingAddress) fieldErrors.line1 = errors.billingAddress;
  if (errors.billingCity) fieldErrors.city = errors.billingCity;
  if (errors.billingDistrict) fieldErrors.district = errors.billingDistrict;
  if (errors.billingArea) fieldErrors.area = errors.billingArea;
  return Object.keys(fieldErrors).length ? fieldErrors : undefined;
}

export function getShippingAddressErrors(errors: CustomerFormFieldError) {
  const fieldErrors: Partial<Record<'line1' | 'city' | 'district' | 'area', string>> = {};
  if (errors.shippingAddress) fieldErrors.line1 = errors.shippingAddress;
  if (errors.shippingCity) fieldErrors.city = errors.shippingCity;
  if (errors.shippingDistrict) fieldErrors.district = errors.shippingDistrict;
  if (errors.shippingArea) fieldErrors.area = errors.shippingArea;
  return Object.keys(fieldErrors).length ? fieldErrors : undefined;
}
