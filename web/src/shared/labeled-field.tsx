/** Champ de formulaire avec libellé. */
import type { ReactElement } from 'react';

type Props = {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: 'text' | 'password';
  autoComplete?: string;
  autoFocus?: boolean;
};

export function LabeledField(
  { id, label, value, onChange, type = 'text', autoComplete, autoFocus }: Props,
): ReactElement {
  return (
    <div>
      <label className="label" htmlFor={id}>{label}</label>
      <input id={id} type={type} className="field" autoComplete={autoComplete} autoFocus={autoFocus} value={value}
        onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
