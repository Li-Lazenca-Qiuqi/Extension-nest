import { defineConfig } from 'vitest/config';
export default defineConfig({resolve:{alias:{vscode:new URL('./test/vscodeMock.ts',import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1')}},test:{include:['src/**/*.test.ts']}});
