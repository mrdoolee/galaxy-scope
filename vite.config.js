import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    // 게임(index.html)과 교사 안내(teacher.html) 두 쪽을 만든다.
    rollupOptions: { input: { main: 'index.html', teacher: 'teacher.html' } },
  },
  test: {
    globals: true,
  },
});
