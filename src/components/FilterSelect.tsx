type FilterOption = {
  value: string;
  label: string;
};

type FilterSelectProps = {
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
};

export default function FilterSelect({
  value,
  options,
  onChange,
}: FilterSelectProps) {
  return (
    <label className="tb-filter">
      <span className="tb-filter-label">Filtre</span>

      <select
        className="tb-filter-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
