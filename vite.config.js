import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    // 게임(index.html), 교사 안내(teacher.html), 수업 슬라이드(lesson.html) 세 쪽을 만든다.
    rollupOptions: { input: { main: 'index.html', teacher: 'teacher.html', lesson: 'lesson.html' } },
  },
  test: {
    globals: true,
  },
});
