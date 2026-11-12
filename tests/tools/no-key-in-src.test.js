import { readdirSync, readFileSync } from 'node:fs';

// OpenAI 키 모양(sk-로 시작하는 긴 토큰), 환경 변수 이름, API 주소.
const KEY = /OPENAI|api\.openai\.com|\bsk-[A-Za-z0-9_-]{10,}/;

test('검사 패턴: 키 모양과 이름은 잡고, 보통 낱말은 잡지 않는다', () => {
  expect('const k = "sk-proj-AbCdEf0123456789"').toMatch(KEY);
  expect('process.env.OPENAI_API_KEY').toMatch(KEY);
  expect('https://api.openai.com/v1/images').toMatch(KEY);
  expect('risk-free, desk-top, task-list, sk-a').not.toMatch(KEY);
});

test('src 아래 어떤 파일도 API 키를 참조하지 않음', () => {
  const files = readdirSync('src', { recursive: true }).filter((f) => String(f).endsWith('.js'));
  for (const f of files) expect(readFileSync(`src/${f}`, 'utf8'), f).not.toMatch(KEY);
});
