import { readdirSync, readFileSync } from 'node:fs';
test('src 아래 어떤 파일도 API 키를 참조하지 않음', () => {
  const files = readdirSync('src', { recursive: true }).filter((f) => String(f).endsWith('.js'));
  for (const f of files) expect(readFileSync(`src/${f}`, 'utf8')).not.toMatch(/OPENAI|api\.openai\.com|sk-/);
});
