import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const repositoryName = env.GITHUB_REPOSITORY?.split('/')[1];

  return {
    base: repositoryName ? `/${repositoryName}/` : '/',
    plugins: [react()]
  };
});
