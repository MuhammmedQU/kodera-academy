import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import type { LessonContentBlock } from '@shared/types/domain';
import { LessonContentRenderer } from '@/features/lessons/LessonContentRenderer';

describe('Phase 6 — 11-Block LessonContentRenderer', () => {
  it('renders all 11 structured content block types safely without XSS', () => {
    const blocks: LessonContentBlock[] = [
      {
        id: 'b1',
        lesson_id: 'l1',
        locale: 'az',
        block_type: 'heading',
        sort_order: 1,
        title: null,
        content: { level: 2, text: 'Dəyişənlər Başlığı' },
        exercise_id: null,
        quiz_id: null,
        is_published: true,
      },
      {
        id: 'b2',
        lesson_id: 'l1',
        locale: 'az',
        block_type: 'paragraph',
        sort_order: 2,
        title: null,
        content: { text: 'Sadə izah və `print()` funksiyası.' },
        exercise_id: null,
        quiz_id: null,
        is_published: true,
      },
      {
        id: 'b3',
        lesson_id: 'l1',
        locale: 'az',
        block_type: 'image',
        sort_order: 3,
        title: null,
        content: { url: '/media/box.png', alt: 'Qutu diaqramı', caption: 'Şəkil 1' },
        exercise_id: null,
        quiz_id: null,
        is_published: true,
      },
      {
        id: 'b3-xss',
        lesson_id: 'l1',
        locale: 'az',
        block_type: 'image',
        sort_order: 4,
        title: null,
        content: { url: 'javascript:alert(1)', alt: 'Evil image' },
        exercise_id: null,
        quiz_id: null,
        is_published: true,
      },
      {
        id: 'b4',
        lesson_id: 'l1',
        locale: 'az',
        block_type: 'code',
        sort_order: 5,
        title: 'Nümunə kod',
        content: { language: 'python', code: 'x = 5\nprint(x)', expected_output: '5' },
        exercise_id: null,
        quiz_id: null,
        is_published: true,
      },
      {
        id: 'b5',
        lesson_id: 'l1',
        locale: 'az',
        block_type: 'explanation',
        sort_order: 6,
        title: 'İzah',
        content: { text: 'Addım-addım izah', steps: [{ line: 1, note: 'x yaradılır' }] },
        exercise_id: null,
        quiz_id: null,
        is_published: true,
      },
      {
        id: 'b6',
        lesson_id: 'l1',
        locale: 'az',
        block_type: 'example',
        sort_order: 7,
        title: 'Real Nümunə',
        content: { scenario: 'Alış-veriş səbəti', code: 'cem = 10 + 5', walkthrough: 'Cəm hesablanır' },
        exercise_id: null,
        quiz_id: null,
        is_published: true,
      },
      {
        id: 'b7',
        lesson_id: 'l1',
        locale: 'az',
        block_type: 'note',
        sort_order: 8,
        title: 'Vacib Qeyd',
        content: { text: 'Aydın adlar seçin.' },
        exercise_id: null,
        quiz_id: null,
        is_published: true,
      },
      {
        id: 'b8',
        lesson_id: 'l1',
        locale: 'az',
        block_type: 'warning',
        sort_order: 9,
        title: 'Tez-tez edilən xəta',
        content: { text: 'Rəqəmlə başlamaq olmaz.', common_mistake: '1ad = "Ali"' },
        exercise_id: null,
        quiz_id: null,
        is_published: true,
      },
      {
        id: 'b9',
        lesson_id: 'l1',
        locale: 'az',
        block_type: 'exercise',
        sort_order: 10,
        title: 'Məşq',
        content: {},
        exercise_id: 'ex1',
        quiz_id: null,
        is_published: true,
        exercise: {
          id: 'ex1',
          lesson_id: 'l1',
          locale: 'az',
          title: 'İlk Məşq',
          instructions: 'Ekrana 5 yazdır',
          programming_language: 'python',
          starter_code: 'print(5)',
          hints: ['print istifadə et'],
          execution_mode: 'pyodide_worker',
          time_limit_ms: 3000,
          max_output_chars: 5000,
          test_cases: [],
        },
      },
      {
        id: 'b10',
        lesson_id: 'l1',
        locale: 'az',
        block_type: 'quiz',
        sort_order: 11,
        title: 'Quiz',
        content: {},
        exercise_id: null,
        quiz_id: 'qz1',
        is_published: true,
        quiz: {
          id: 'qz1',
          lesson_id: 'l1',
          locale: 'az',
          title: 'Sürətli Test',
          description: null,
          passing_score_percent: 70,
          max_attempts: null,
          questions: [
            {
              id: 'q1',
              quiz_id: 'qz1',
              question_type: 'single_choice',
              prompt: 'Hansı düzgündür?',
              code_snippet: null,
              code_language: null,
              points: 1,
              sort_order: 1,
              options: [
                { id: 'o1', question_id: 'q1', option_text: 'Variant 1', sort_order: 1 },
                { id: 'o2', question_id: 'q1', option_text: 'Variant 2', sort_order: 2 },
              ],
            },
          ],
        },
      },
      {
        id: 'b11',
        lesson_id: 'l1',
        locale: 'az',
        block_type: 'summary',
        sort_order: 12,
        title: 'Dərsin Xülasəsi',
        content: { key_takeaways: ['Birinci nəticə'], next_step_hint: 'Növbəti dərsə keç' },
        exercise_id: null,
        quiz_id: null,
        is_published: true,
      },
    ];

    render(
      <MemoryRouter>
        <LessonContentRenderer blocks={blocks} canTrackStudentActions={false} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Dəyişənlər Başlığı')).toBeInTheDocument();
    expect(screen.getByText('print()')).toBeInTheDocument();
    expect(screen.getByAltText('Qutu diaqramı')).toBeInTheDocument();
    expect(screen.queryByAltText('Evil image')).not.toBeInTheDocument();
    expect(screen.getByText('x yaradılır')).toBeInTheDocument();
    expect(screen.getByText('Alış-veriş səbəti')).toBeInTheDocument();
    expect(screen.getByText('Aydın adlar seçin.')).toBeInTheDocument();
    expect(screen.getByText('1ad = "Ali"')).toBeInTheDocument();
    expect(screen.getByText(/İlk Məşq/)).toBeInTheDocument();
    expect(screen.getByText('Sürətli Test')).toBeInTheDocument();
    expect(screen.getByText('Birinci nəticə')).toBeInTheDocument();
  });
});
