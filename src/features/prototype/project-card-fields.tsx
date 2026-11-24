import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormSelect, type FormSelectOption } from "@/components/ui/form-select";

export function ProjectField({
  id,
  label,
  value,
  onChange,
  hint,
  error,
  short = false,
  maxLength = 12000,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
  short?: boolean;
  maxLength?: number;
}) {
  const props = {
    id,
    value,
    maxLength,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(event.target.value),
    "aria-invalid": Boolean(error),
    "aria-describedby": `${id}-hint`,
  };
  return (
    <div className="project-field">
      <label htmlFor={id}>{label}</label>
      {short ? <Input {...props} /> : <Textarea {...props} rows={3} />}
      <p
        id={`${id}-hint`}
        className={error ? "error-message" : "record-caption"}
        role={error ? "alert" : undefined}
      >
        {error || hint}
      </p>
    </div>
  );
}
export function ProjectSelect({
  id,
  label,
  value,
  onChange,
  options,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: FormSelectOption[];
  error?: string;
}) {
  return (
    <div className="project-field">
      <label htmlFor={id}>{label}</label>
      <FormSelect
        id={id}
        value={value}
        onValueChange={onChange}
        ariaLabel={label}
        options={options}
        invalid={Boolean(error)}
        describedBy={error ? `${id}-error` : undefined}
      />
      {error && (
        <p id={`${id}-error`} className="error-message" role="alert" tabIndex={-1}>
          {error}
        </p>
      )}
    </div>
  );
}
