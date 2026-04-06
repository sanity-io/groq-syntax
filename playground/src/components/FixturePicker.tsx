import {fixtures, fixtureKey, type Fixture} from '../fixtures'

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
      <option value="" disabled>
        Load fixture...
      </option>
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
