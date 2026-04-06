import {fixtures} from '../fixtures'

export function FixturePicker({onSelect}: {onSelect: (content: string) => void}) {
  const categories = [...new Set(fixtures.map((f) => f.category))]

  return (
    <select
      onChange={(e) => {
        const fixture = fixtures.find((f) => `${f.category}/${f.name}` === e.target.value)
        if (fixture) onSelect(fixture.content)
      }}
      defaultValue=""
    >
      <option value="" disabled>
        Load fixture...
      </option>
      {categories.map((cat) => (
        <optgroup key={cat} label={cat}>
          {fixtures
            .filter((f) => f.category === cat)
            .map((f) => (
              <option key={`${cat}/${f.name}`} value={`${cat}/${f.name}`}>
                {f.name}
              </option>
            ))}
        </optgroup>
      ))}
    </select>
  )
}
