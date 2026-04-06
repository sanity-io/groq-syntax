const fixtureModules = import.meta.glob(
  '../../packages/groq-highlight-test/fixtures/**/*.groq',
  {query: '?raw', import: 'default', eager: true},
)

export interface Fixture {
  name: string
  category: string
  content: string
}

export const fixtures: Fixture[] = Object.entries(fixtureModules)
  .map(([path, content]) => {
    const parts = path.split('/')
    const filename = parts.pop()!.replace('.groq', '')
    const category = parts.pop()!
    return {name: filename, category, content: (content as string).trimEnd()}
  })
  .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))

export function fixtureKey(f: Fixture): string {
  return `${f.category}/${f.name}`
}

export function findFixture(key: string): Fixture | undefined {
  return fixtures.find((f) => fixtureKey(f) === key)
}
