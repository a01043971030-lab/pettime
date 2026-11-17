import * as esbuild from 'esbuild';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const devTemplate = `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
    <meta name="theme-color" content="#FFFDF9" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="mobile-web-app-capable" content="yes" />
    <title>펫타임 (PetTime) - AI 반려동물 미래 타임머신</title>
    <link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css" />
  </head>
  <body class="bg-[#F7F3EE] text-[#4A4E69] antialiased">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;

async function buildStandalone() {
  fs.writeFileSync('index.html', devTemplate, 'utf8');
  execSync('.\\node_modules\\.bin\\vite.cmd build', { stdio: 'inherit' });

  await esbuild.build({
    entryPoints: ['src/main.tsx'],
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: ['es2020'],
    outfile: 'dist/standalone.js',
    sourcemap: false,
    minify: true,
    legalComments: 'none',
    charset: 'utf8',
    define: {
      'process.env.NODE_ENV': '"production"',
      'import.meta.env.MODE': '"production"',
      'import.meta.env.PROD': 'true',
      'import.meta.env.DEV': 'false',
      'import.meta.env.SSR': 'false',
    },
    plugins: [
      {
        name: 'ignore-css',
        setup(build) {
          build.onLoad({ filter: /\.css$/ }, () => ({ contents: '' }));
        },
      },
    ],
  });

  const assetsDir = path.join('dist', 'assets');
  let combinedCss = '';
  if (fs.existsSync(assetsDir)) {
    for (const f of fs.readdirSync(assetsDir)) {
      if (f.endsWith('.css')) {
        combinedCss += fs.readFileSync(path.join(assetsDir, f), 'utf8') + '\n';
      }
    }
  }

  const standaloneJs = fs.readFileSync('dist/standalone.js', 'utf8');
  const safeJs = standaloneJs.replace(/<\/script>/gi, '<\\/script>');

  const fullHtml = `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
    <meta name="theme-color" content="#FFFDF9" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="mobile-web-app-capable" content="yes" />
    <title>펫타임 (PetTime) - AI 반려동물 미래 타임머신</title>
    <link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css" />
    <style>${combinedCss}</style>
  </head>
  <body class="bg-[#F7F3EE] text-[#4A4E69] antialiased selection:bg-[#FF7E67]/20 selection:text-[#FF7E67]">
    <div id="root"></div>
    <script>${safeJs}</script>
  </body>
</html>`;

  fs.writeFileSync('index.html', fullHtml, 'utf8');
  fs.writeFileSync(path.join('dist', 'index.html'), fullHtml, 'utf8');
  console.log('Successfully generated fresh smartphone-optimized index.html!');
}

buildStandalone().catch((err) => {
  console.error(err);
  process.exit(1);
});
