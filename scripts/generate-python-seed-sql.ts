import fs from 'node:fs';
import path from 'node:path';
import { buildInitialSeedContent } from '../server/content/initialSeed';

function sqlStr(val: string | null | undefined): string {
  if (val === null || val === undefined) return 'NULL';
  return `'${val.replaceAll("'", "''")}'`;
}

function sqlJson(val: unknown): string {
  return `${sqlStr(JSON.stringify(val))}::jsonb`;
}

const seed = buildInitialSeedContent();
const lines: string[] = [
  '-- ============================================================================',
  '-- KODERA LMS — Initial Python Course & First Two Public Modules Seed',
  '-- Generated from server/content/initialSeed.ts (Module 1 & Module 2: 8 lessons)',
  '-- Idempotent (ON CONFLICT DO NOTHING). Run AFTER migrations 0001-0006.',
  '-- ============================================================================',
  '',
  'BEGIN;',
  '',
];

lines.push('-- 1. Courses');
for (const c of seed.courses) {
  lines.push(
    `INSERT INTO public.courses (id, slug, locale, title, subtitle, description, learning_objectives, target_audience, programming_language, difficulty, estimated_duration_minutes, sort_order, status, published_at)`,
  );
  lines.push(
    `VALUES (${sqlStr(c.id)}, ${sqlStr(c.slug)}, ${sqlStr(c.locale)}, ${sqlStr(c.title)}, ${sqlStr(c.subtitle)}, ${sqlStr(c.description)}, ${sqlJson(c.learning_objectives)}, ${sqlStr(c.target_audience)}, ${sqlStr(c.programming_language)}, ${sqlStr(c.difficulty)}, ${c.estimated_duration_minutes}, ${c.sort_order}, ${sqlStr(c.status)}, now())`,
  );
  lines.push('ON CONFLICT (id) DO NOTHING;');
}

lines.push('', '-- 2. Modules (is_public controlled strictly in DB)');
for (const m of seed.modules) {
  lines.push(
    `INSERT INTO public.modules (id, course_id, slug, title, description, sort_order, is_public, status)`,
  );
  lines.push(
    `VALUES (${sqlStr(m.id)}, ${sqlStr(m.course_id)}, ${sqlStr(m.slug)}, ${sqlStr(m.title)}, ${sqlStr(m.description)}, ${m.sort_order}, ${m.is_public ? 'true' : 'false'}, ${sqlStr(m.status)})`,
  );
  lines.push('ON CONFLICT (id) DO NOTHING;');
}

lines.push('', '-- 3. Lessons');
for (const l of seed.lessons) {
  lines.push(
    `INSERT INTO public.lessons (id, module_id, slug, title, summary, estimated_minutes, sort_order, status, published_at)`,
  );
  lines.push(
    `VALUES (${sqlStr(l.id)}, ${sqlStr(l.module_id)}, ${sqlStr(l.slug)}, ${sqlStr(l.title)}, ${sqlStr(l.summary)}, ${l.estimated_minutes}, ${l.sort_order}, ${sqlStr(l.status)}, now())`,
  );
  lines.push('ON CONFLICT (id) DO NOTHING;');
}

lines.push('', '-- 4. Exercises, Admin-only Reference Solutions & Test Cases');
for (const ex of seed.exercises) {
  lines.push(
    `INSERT INTO public.exercises (id, lesson_id, locale, title, instructions, programming_language, starter_code, hints, execution_mode, time_limit_ms, max_output_chars, status)`,
  );
  lines.push(
    `VALUES (${sqlStr(ex.id)}, ${sqlStr(ex.lesson_id)}, ${sqlStr(ex.locale)}, ${sqlStr(ex.title)}, ${sqlStr(ex.instructions)}, ${sqlStr(ex.programming_language)}, ${sqlStr(ex.starter_code)}, ${sqlJson(ex.hints)}, ${sqlStr(ex.execution_mode)}, ${ex.time_limit_ms}, ${ex.max_output_chars}, 'published')`,
  );
  lines.push('ON CONFLICT (id) DO NOTHING;');

  lines.push(
    `INSERT INTO public.exercise_solutions (exercise_id, solution_code) VALUES (${sqlStr(ex.id)}, ${sqlStr(ex.solution_code)}) ON CONFLICT (exercise_id) DO NOTHING;`,
  );

  for (const tc of ex.test_cases) {
    lines.push(
      `INSERT INTO public.exercise_test_cases (id, exercise_id, label, stdin_input, expected_stdout, assertion_code, is_hidden, sort_order)`,
    );
    lines.push(
      `VALUES (${sqlStr(tc.id)}, ${sqlStr(tc.exercise_id)}, ${sqlStr(tc.label)}, ${sqlStr(tc.stdin_input)}, ${sqlStr(tc.expected_stdout)}, ${sqlStr(tc.assertion_code)}, ${tc.is_hidden ? 'true' : 'false'}, ${tc.sort_order})`,
    );
    lines.push('ON CONFLICT (id) DO NOTHING;');
  }
}

lines.push('', '-- 5. Quizzes, Questions & Options');
for (const qz of seed.quizzes) {
  lines.push(
    `INSERT INTO public.quizzes (id, lesson_id, locale, title, description, passing_score_percent, max_attempts, status)`,
  );
  lines.push(
    `VALUES (${sqlStr(qz.id)}, ${sqlStr(qz.lesson_id)}, ${sqlStr(qz.locale)}, ${sqlStr(qz.title)}, ${sqlStr(qz.description)}, ${qz.passing_score_percent}, ${qz.max_attempts ?? 'NULL'}, ${sqlStr(qz.status)})`,
  );
  lines.push('ON CONFLICT (id) DO NOTHING;');

  for (const q of qz.questions) {
    lines.push(
      `INSERT INTO public.quiz_questions (id, quiz_id, question_type, prompt, code_snippet, code_language, explanation, points, sort_order)`,
    );
    lines.push(
      `VALUES (${sqlStr(q.id)}, ${sqlStr(q.quiz_id)}, ${sqlStr(q.question_type)}, ${sqlStr(q.prompt)}, ${sqlStr(q.code_snippet)}, ${sqlStr(q.code_language)}, ${sqlStr(q.explanation)}, ${q.points}, ${q.sort_order})`,
    );
    lines.push('ON CONFLICT (id) DO NOTHING;');

    for (const o of q.options) {
      lines.push(
        `INSERT INTO public.quiz_question_options (id, question_id, option_text, is_correct, sort_order)`,
      );
      lines.push(
        `VALUES (${sqlStr(o.id)}, ${sqlStr(o.question_id)}, ${sqlStr(o.option_text)}, ${o.is_correct ? 'true' : 'false'}, ${o.sort_order})`,
      );
      lines.push('ON CONFLICT (id) DO NOTHING;');
    }
  }
}

lines.push('', '-- 6. Ordered Lesson Content Blocks');
for (const b of seed.blocks) {
  lines.push(
    `INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)`,
  );
  lines.push(
    `VALUES (${sqlStr(b.id)}, ${sqlStr(b.lesson_id)}, ${sqlStr(b.locale)}, ${sqlStr(b.block_type)}, ${b.sort_order}, ${sqlStr(b.title)}, ${sqlJson(b.content)}, ${sqlStr(b.exercise_id)}, ${sqlStr(b.quiz_id)}, ${b.is_published ? 'true' : 'false'})`,
  );
  lines.push('ON CONFLICT (id) DO NOTHING;');
}

lines.push('', 'COMMIT;', '');

const outDir = path.resolve(process.cwd(), 'supabase/seeds');
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, '01_python_intro_modules.sql');
fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
process.stdout.write(`Generated ${outPath} (${lines.length} lines).\n`);
