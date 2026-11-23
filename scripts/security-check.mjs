import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const errors = [];

function walkFiles(dir, extensions) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.git', 'dist', 'coverage', 'playwright-report'].includes(entry.name)) {
        continue;
      }
      results.push(...walkFiles(full, extensions));
    } else if (!extensions || extensions.some((ext) => entry.name.endsWith(ext))) {
      results.push(full);
    }
  }
  return results;
}

// 1. Check frontend src/ for forbidden secret identifiers & unsafe DOM/code execution
for (const file of walkFiles(path.join(ROOT, 'src'), ['.ts', '.tsx', '.js', '.jsx'])) {
  const content = fs.readFileSync(file, 'utf8');
  const rel = path.relative(ROOT, file);

  if (content.includes('SUPABASE_SERVICE_ROLE_KEY')) {
    errors.push(`[SECRET-LEAK] ${rel} references SUPABASE_SERVICE_ROLE_KEY in frontend code.`);
  }
  if (content.includes('VITE_SUPABASE_SERVICE_ROLE')) {
    errors.push(`[SECRET-LEAK] ${rel} references VITE_SUPABASE_SERVICE_ROLE* variable.`);
  }
  if (content.includes('dangerouslySetInnerHTML')) {
    errors.push(`[XSS-RISK] ${rel} uses dangerouslySetInnerHTML.`);
  }
  if (/\beval\s*\(/.test(content) || /\bnew\s+Function\s*\(/.test(content)) {
    errors.push(`[CODE-INJECTION] ${rel} uses dynamic eval() or new Function().`);
  }
  if (/\.innerHTML\s*=/.test(content)) {
    errors.push(`[XSS-RISK] ${rel} assigns directly to innerHTML.`);
  }
}

// 2. Check built dist/ bundle if it exists for service role keys, hardcoded JWTs, or dev credentials
if (fs.existsSync(path.join(ROOT, 'dist'))) {
  for (const file of walkFiles(path.join(ROOT, 'dist'), ['.js', '.html', '.css'])) {
    const content = fs.readFileSync(file, 'utf8');
    const rel = path.relative(ROOT, file);
    if (content.includes('SUPABASE_SERVICE_ROLE_KEY')) {
      errors.push(`[BUNDLE-LEAK] Built asset ${rel} contains SUPABASE_SERVICE_ROLE_KEY.`);
    }
    if (/sb_secret_[A-Za-z0-9_-]{16,}/.test(content)) {
      errors.push(`[BUNDLE-LEAK] Built asset ${rel} contains a hardcoded Supabase secret key.`);
    }
    if (/eyJhbGciOi[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/.test(content)) {
      errors.push(`[BUNDLE-LEAK] Built asset ${rel} contains a hardcoded JWT token.`);
    }
    if (content.includes('AdminPass123!') || content.includes('StudentPass123!')) {
      errors.push(`[BUNDLE-LEAK] Built production asset ${rel} leaked dev sandbox password.`);
    }
  }
}

// 3. Verify .gitignore protects .env files
const gitignorePath = path.join(ROOT, '.gitignore');
if (!fs.existsSync(gitignorePath)) {
  errors.push('[GITIGNORE] Missing .gitignore file.');
} else {
  const gi = fs.readFileSync(gitignorePath, 'utf8');
  if (!gi.includes('.env') || !gi.includes('.env.*')) {
    errors.push('[GITIGNORE] .gitignore does not properly ignore .env and .env.* files.');
  }
}

// 4. Verify no real .env files with populated JWT-like secrets exist in root
for (const envName of ['.env', '.env.production']) {
  const p = path.join(ROOT, envName);
  if (fs.existsSync(p)) {
    errors.push(`[ENV-CHECK] Unexpected ${envName} file found in project root.`);
  }
}

if (errors.length > 0) {
  console.error('Kodera Security Check FAILED:');
  for (const err of errors) {
    console.error('  -', err);
  }
  process.exit(1);
}

console.log('Kodera Security Check PASSED: 0 static security violations found.');
