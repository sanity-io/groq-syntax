import {fixtures, fixtureKey, type Fixture} from '../fixtures'

export const CUSTOM = '__custom__'

export function FixturePicker({
  selected,
  onSelect,
}: {
  selected: string
  onSelect: (fixture: Fixture) => void
}) {
  const categories = [...new Set(fixtures.map((f) => f.category))]

  return (
    <select
      value={selected}
      onChange={(e) => {
        const fixture = fixtures.find((f) => fixtureKey(f) === e.target.value)
        if (fixture) onSelect(fixture)
      }}
    >
      {selected === CUSTOM && (
        <option value={CUSTOM} disabled>
          Custom
        </option>
      )}
      {categories.map((cat) => (
        <optgroup key={cat} label={cat}>
          {fixtures
            .filter((f) => f.category === cat)
            .map((f) => {
              const key = fixtureKey(f)
              return (
                <option key={key} value={key}>
                  {f.name}
                </option>
              )
            })}
        </optgroup>
      ))}
    </select>
  )
}
