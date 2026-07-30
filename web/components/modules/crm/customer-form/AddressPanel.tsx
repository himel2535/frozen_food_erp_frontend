'use client';

import { MapPin, Truck } from 'lucide-react';
import {
  BD_DIVISIONS,
  getDistrictsForDivision,
  getUpazillasForDistrict,
} from '@/lib/data/bd-address-options';
import {
  CF_ADDRESS_HEADER_SPACER_CLS,
  CF_ADDRESS_ICON_BADGE_CLS,
  CF_ADDRESS_PANEL_CLS,
  CF_ADDRESS_PANEL_DISABLED_CLS,
  CF_ADDRESS_PANEL_HEADER_BLOCK_CLS,
  CF_ADDRESS_PANEL_HEADER_CLS,
  CF_ADDRESS_SAME_AS_CLS,
  CF_ADDRESS_SELECT_BG,
  CF_ADDRESS_SELECT_CLS,
  CF_ADDRESS_TEXTAREA_CLS,
  CF_FIELD_ERROR_CLS,
  CF_INPUT_ERROR_CLS,
} from '@/components/modules/crm/customer-form/customer-form-styles';

export type AddressPanelValues = {
  line1: string;
  area: string;
  city: string;
  district: string;
};

export type AddressFieldErrors = Partial<Record<'line1' | 'area' | 'city' | 'district', string>>;

type AddressPanelProps = {
  variant: 'billing' | 'delivery';
  values: AddressPanelValues;
  onChange: (patch: Partial<AddressPanelValues>) => void;
  disabled?: boolean;
  sameAsBilling?: boolean;
  onSameAsBillingChange?: (checked: boolean) => void;
  errors?: AddressFieldErrors;
  fieldIdPrefix?: string;
};

function AddressFields({
  values,
  onChange,
  disabled,
  errors,
  fieldIdPrefix,
}: {
  values: AddressPanelValues;
  onChange: (patch: Partial<AddressPanelValues>) => void;
  disabled?: boolean;
  errors?: AddressFieldErrors;
  fieldIdPrefix?: string;
}) {
  const districtOptions = getDistrictsForDivision(values.city);
  const upazillaOptions = getUpazillasForDistrict(values.district);

  return (
    <div className="space-y-2.5 flex-1 min-h-0">
      <div id={fieldIdPrefix ? `cf-field-${fieldIdPrefix}Address` : undefined}>
        <textarea
          value={values.line1}
          onChange={(e) => onChange({ line1: e.target.value })}
          placeholder="House / Road / Area"
          disabled={disabled}
          aria-invalid={errors?.line1 ? true : undefined}
          className={`${CF_ADDRESS_TEXTAREA_CLS}${errors?.line1 ? ` ${CF_INPUT_ERROR_CLS}` : ''}`}
        />
        {errors?.line1 ? <p className={CF_FIELD_ERROR_CLS}>{errors.line1}</p> : null}
      </div>
      <select
        id={fieldIdPrefix ? `cf-field-${fieldIdPrefix}City` : undefined}
        value={values.city}
        onChange={(e) => onChange({ city: e.target.value, district: '', area: '' })}
        disabled={disabled}
        aria-invalid={errors?.city ? true : undefined}
        className={`${CF_ADDRESS_SELECT_CLS} ${CF_ADDRESS_SELECT_BG}${errors?.city ? ` ${CF_INPUT_ERROR_CLS}` : ''}`}
      >
        <option value="">Select Division</option>
        {BD_DIVISIONS.map((division) => (
          <option key={division} value={division}>{division}</option>
        ))}
      </select>
      {errors?.city ? <p className={CF_FIELD_ERROR_CLS}>{errors.city}</p> : null}
      <select
        id={fieldIdPrefix ? `cf-field-${fieldIdPrefix}District` : undefined}
        value={values.district}
        onChange={(e) => onChange({ district: e.target.value, area: '' })}
        disabled={disabled || !values.city}
        aria-invalid={errors?.district ? true : undefined}
        className={`${CF_ADDRESS_SELECT_CLS} ${CF_ADDRESS_SELECT_BG}${errors?.district ? ` ${CF_INPUT_ERROR_CLS}` : ''}`}
      >
        <option value="">Select District</option>
        {districtOptions.map((district) => (
          <option key={district} value={district}>{district}</option>
        ))}
      </select>
      {errors?.district ? <p className={CF_FIELD_ERROR_CLS}>{errors.district}</p> : null}
      <select
        id={fieldIdPrefix ? `cf-field-${fieldIdPrefix}Area` : undefined}
        value={values.area}
        onChange={(e) => onChange({ area: e.target.value })}
        disabled={disabled || !values.district}
        aria-invalid={errors?.area ? true : undefined}
        className={`${CF_ADDRESS_SELECT_CLS} ${CF_ADDRESS_SELECT_BG}${errors?.area ? ` ${CF_INPUT_ERROR_CLS}` : ''}`}
      >
        <option value="">Select Thana / Upazilla</option>
        {upazillaOptions.map((upazilla) => (
          <option key={upazilla} value={upazilla}>{upazilla}</option>
        ))}
      </select>
      {errors?.area ? <p className={CF_FIELD_ERROR_CLS}>{errors.area}</p> : null}
    </div>
  );
}

export function AddressPanel({
  variant,
  values,
  onChange,
  disabled = false,
  sameAsBilling,
  onSameAsBillingChange,
  errors,
  fieldIdPrefix,
}: AddressPanelProps) {
  const isBilling = variant === 'billing';
  const Icon = isBilling ? MapPin : Truck;
  const title = isBilling ? 'Billing Address' : 'Delivery Address';

  return (
    <div className={CF_ADDRESS_PANEL_CLS}>
      <div className={CF_ADDRESS_PANEL_HEADER_BLOCK_CLS}>
        <div className={CF_ADDRESS_PANEL_HEADER_CLS}>
          <span className={CF_ADDRESS_ICON_BADGE_CLS}>
            <Icon className="w-4 h-4" />
          </span>
          <span className="text-xs font-extrabold text-slate-900 tracking-tight">
            {title}
            {isBilling ? <span className="text-rose-500 ml-0.5">*</span> : null}
          </span>
        </div>
        {!isBilling && onSameAsBillingChange ? (
          <label className={CF_ADDRESS_SAME_AS_CLS}>
            <input
              type="checkbox"
              checked={sameAsBilling ?? false}
              onChange={(e) => onSameAsBillingChange(e.target.checked)}
              className="shrink-0 cursor-pointer rounded border-slate-300 text-blue-600 accent-blue-600 focus:ring-blue-500/30"
            />
            <span className="whitespace-nowrap">Same as billing address</span>
          </label>
        ) : (
          <div className={CF_ADDRESS_HEADER_SPACER_CLS} aria-hidden="true" />
        )}
      </div>
      <div className={disabled ? CF_ADDRESS_PANEL_DISABLED_CLS : ''}>
        <AddressFields
          values={values}
          onChange={onChange}
          disabled={disabled}
          errors={errors}
          fieldIdPrefix={fieldIdPrefix}
        />
      </div>
    </div>
  );
}
