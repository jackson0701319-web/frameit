import { FILTERS } from '../lib/constants';

export default function FilterPanel({ selected, onChange }) {
  return (
    <div className="filter-panel">
      {FILTERS.map((filter) => (
        <button
          key={filter.id}
          type="button"
          className={`filter-panel__item ${selected === filter.id ? 'active' : ''}`}
          onClick={() => onChange(filter.id)}
        >
          <span className={`filter-panel__thumb filter--${filter.id}`} />
          {filter.name}
        </button>
      ))}
    </div>
  );
}
