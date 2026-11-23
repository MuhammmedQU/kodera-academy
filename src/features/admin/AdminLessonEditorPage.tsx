import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Code2, HelpCircle, Plus, Trash2 } from 'lucide-react';
import type {
  AdminQuiz,
  ContentBlockType,
  LessonContentBlock,
  LessonItem,
  PublicExercise,
} from '@shared/types/domain';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Modal,
  Select,
  Spinner,
  Textarea,
} from '@/components/ui';
import { apiRequest, ApiError } from '@/lib/apiClient';

interface EditorPayload {
  lesson: LessonItem;
  blocks: LessonContentBlock[];
  exercises: Array<PublicExercise & { solution_code?: string }>;
  quizzes: AdminQuiz[];
}

const BLOCK_TYPE_LABELS: Record<ContentBlockType, string> = {
  heading: 'Başlıq (heading)',
  paragraph: 'Paraqraf (paragraph)',
  image: 'Şəkil (image)',
  code: 'Kod bloku (code)',
  explanation: 'Kod / Məntiq izahı (explanation)',
  example: 'Real nümunə (example)',
  note: 'Vacib qeyd (note)',
  warning: 'Xəbərdarlıq / Tez-tez edilən xəta (warning)',
  exercise: 'İnteraktiv məşq (exercise)',
  quiz: 'Bilik yoxlaması (quiz)',
  summary: 'Dərsin xülasəsi (summary)',
};

export function AdminLessonEditorPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const [data, setData] = useState<EditorPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Add standard block state
  const [blockModal, setBlockModal] = useState(false);
  const [blockType, setBlockType] = useState<ContentBlockType>('paragraph');
  const [blockTitle, setBlockTitle] = useState('');
  const [blockText, setBlockText] = useState('');
  const [blockCode, setBlockCode] = useState('');
  const [blockLanguage, setBlockLanguage] = useState('python');
  const [blockImageUrl, setBlockImageUrl] = useState('');
  const [blockImageAlt, setBlockImageAlt] = useState('');
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  const [selectedQuizId, setSelectedQuizId] = useState('');

  // Create Exercise modal
  const [exerciseModal, setExerciseModal] = useState(false);
  const [exForm, setExForm] = useState({
    title: '',
    instructions: '',
    starter_code: '# Kodunuzu bura yazın\n',
    solution_code: '',
    expected_stdout: '',
    test_label: 'Çıxış yoxlaması',
  });

  // Create Quiz modal
  const [quizModal, setQuizModal] = useState(false);
  const [qzForm, setQzForm] = useState({
    title: '',
    prompt: '',
    optionA: '',
    optionB: '',
    optionC: '',
    correctOption: 'A' as 'A' | 'B' | 'C',
    explanation: '',
  });

  const loadEditor = useCallback(async () => {
    if (!lessonId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<EditorPayload>(`/api/admin/lessons/${lessonId}/editor`);
      setData(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Redaktor məlumatı yüklənmədi.');
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    void loadEditor();
  }, [loadEditor]);

  const handleAddBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonId || !data) return;
    setBusy(true);
    setError(null);
    try {
      let content: Record<string, unknown> = {};
      if (blockType === 'heading') {
        content = { level: 2, text: blockText };
      } else if (blockType === 'code') {
        content = { language: blockLanguage, code: blockCode, filename: 'example.py' };
      } else if (blockType === 'image') {
        content = { url: blockImageUrl, alt: blockImageAlt, caption: blockText };
      } else if (blockType === 'example') {
        content = { scenario: blockText, language: blockLanguage, code: blockCode };
      } else if (blockType === 'summary') {
        content = {
          key_takeaways: blockText
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean),
        };
      } else if (blockType === 'exercise' || blockType === 'quiz') {
        content = { display_mode: 'inline' };
      } else {
        content = { text: blockText };
      }

      await apiRequest('/api/admin/blocks', {
        method: 'POST',
        body: {
          lesson_id: lessonId,
          locale: 'az',
          block_type: blockType,
          sort_order: data.blocks.length + 1,
          title: blockTitle.trim() || null,
          content,
          exercise_id: blockType === 'exercise' ? selectedExerciseId || null : null,
          quiz_id: blockType === 'quiz' ? selectedQuizId || null : null,
          is_published: true,
        },
      });
      setBlockModal(false);
      setBlockTitle('');
      setBlockText('');
      setBlockCode('');
      setFeedback('Yeni kontent bloku dərsə əlavə edildi.');
      await loadEditor();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Blok əlavə olunmadı.');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    setBusy(true);
    try {
      await apiRequest(`/api/admin/blocks/${blockId}`, { method: 'DELETE' });
      setFeedback('Blok silindi.');
      await loadEditor();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Blok silinmədi.');
    } finally {
      setBusy(false);
    }
  };

  const handleCreateExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonId || !data) return;
    setBusy(true);
    setError(null);
    try {
      const created = await apiRequest<PublicExercise>('/api/admin/exercises', {
        method: 'POST',
        body: {
          lesson_id: lessonId,
          locale: 'az',
          title: exForm.title,
          instructions: exForm.instructions,
          programming_language: 'python',
          starter_code: exForm.starter_code,
          solution_code: exForm.solution_code,
          hints: [],
          execution_mode: 'pyodide_worker',
          time_limit_ms: 3000,
          max_output_chars: 10000,
          status: 'published',
          test_cases: [
            {
              label: exForm.test_label || 'Əsas test',
              stdin_input: '',
              expected_stdout: exForm.expected_stdout,
              assertion_code: null,
              is_hidden: false,
              sort_order: 1,
            },
          ],
        },
      });

      await apiRequest('/api/admin/blocks', {
        method: 'POST',
        body: {
          lesson_id: lessonId,
          locale: 'az',
          block_type: 'exercise',
          sort_order: data.blocks.length + 1,
          title: created.title,
          content: { display_mode: 'inline' },
          exercise_id: created.id,
          quiz_id: null,
          is_published: true,
        },
      });
      setExerciseModal(false);
      setFeedback('Məşq yaradıldı və avtomatik dərsə blok kimi əlavə edildi.');
      await loadEditor();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Məşq yaradılmadı.');
    } finally {
      setBusy(false);
    }
  };

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonId || !data) return;
    setBusy(true);
    setError(null);
    try {
      const options = [
        { option_text: qzForm.optionA, is_correct: qzForm.correctOption === 'A', sort_order: 1 },
        { option_text: qzForm.optionB, is_correct: qzForm.correctOption === 'B', sort_order: 2 },
        ...(qzForm.optionC.trim()
          ? [{ option_text: qzForm.optionC, is_correct: qzForm.correctOption === 'C', sort_order: 3 }]
          : []),
      ];

      const created = await apiRequest<AdminQuiz>('/api/admin/quizzes', {
        method: 'POST',
        body: {
          lesson_id: lessonId,
          locale: 'az',
          title: qzForm.title,
          passing_score_percent: 70,
          status: 'published',
          questions: [
            {
              question_type: 'single_choice',
              prompt: qzForm.prompt,
              explanation: qzForm.explanation || null,
              points: 1,
              sort_order: 1,
              options,
            },
          ],
        },
      });

      await apiRequest('/api/admin/blocks', {
        method: 'POST',
        body: {
          lesson_id: lessonId,
          locale: 'az',
          block_type: 'quiz',
          sort_order: data.blocks.length + 1,
          title: created.title,
          content: { display_mode: 'inline' },
          exercise_id: null,
          quiz_id: created.id,
          is_published: true,
        },
      });
      setQuizModal(false);
      setFeedback('Quiz yaradıldı və dərsə əlavə edildi (cavab açarı serverdə qorunur).');
      await loadEditor();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Quiz yaradılmadı.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Spinner label="Dərs redaktoru yüklənir..." />;
  if (!data) return <Alert variant="error">{error || 'Dərs tapılmadı.'}</Alert>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to={`/admin/modules/${data.lesson.module_id}/lessons`}
            className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-[#4338CA] hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Dərslərə qayıt
          </Link>
          <h1 className="font-display text-2xl font-extrabold text-[#18181B]">
            Kontent Redaktoru: {data.lesson.title}
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Kod yazmadan 11 növ strukturlaşdırılmış dərs bloku, məşq və quiz əlavə edin.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="primary" size="sm" onClick={() => setBlockModal(true)}>
            <Plus className="h-4 w-4" />
            Blok əlavə et
          </Button>
          <Button variant="outline" size="sm" onClick={() => setExerciseModal(true)}>
            <Code2 className="h-4 w-4" />
            Məşq yarat
          </Button>
          <Button variant="outline" size="sm" onClick={() => setQuizModal(true)}>
            <HelpCircle className="h-4 w-4" />
            Quiz yarat
          </Button>
        </div>
      </div>

      {feedback && <Alert variant="success">{feedback}</Alert>}
      {error && <Alert variant="error">{error}</Alert>}

      <div className="space-y-3">
        {data.blocks.map((block) => (
          <Card key={block.id}>
            <CardHeader className="flex flex-row items-center justify-between py-4">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-bold">
                  #{block.sort_order}
                </span>
                <Badge variant="brand">{block.block_type}</Badge>
                {block.title && <CardTitle className="text-sm">{block.title}</CardTitle>}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:bg-red-50"
                disabled={busy}
                onClick={() => handleDeleteBlock(block.id)}
              >
                <Trash2 className="h-4 w-4" />
                Sil
              </Button>
            </CardHeader>
            <CardContent className="pt-0">
              <pre className="overflow-x-auto rounded-xl bg-zinc-50 p-3 text-xs text-zinc-700">
                {JSON.stringify(block.content, null, 2)}
              </pre>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Block Modal */}
      <Modal open={blockModal} onClose={() => setBlockModal(false)} title="Kontent bloku əlavə et">
        <form onSubmit={handleAddBlock} className="space-y-4">
          <Select
            label="Blok növü"
            value={blockType}
            onChange={(e) => setBlockType(e.target.value as ContentBlockType)}
          >
            {(Object.keys(BLOCK_TYPE_LABELS) as ContentBlockType[]).map((t) => (
              <option key={t} value={t}>
                {BLOCK_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>

          <Input
            label="Blok başlığı (istəyə bağlı)"
            value={blockTitle}
            onChange={(e) => setBlockTitle(e.target.value)}
          />

          {blockType === 'exercise' ? (
            <Select
              label="Mövcud məşqi seçin"
              required
              value={selectedExerciseId}
              onChange={(e) => setSelectedExerciseId(e.target.value)}
            >
              <option value="">Seçin...</option>
              {data.exercises.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.title}
                </option>
              ))}
            </Select>
          ) : blockType === 'quiz' ? (
            <Select
              label="Mövcud quiz-i seçin"
              required
              value={selectedQuizId}
              onChange={(e) => setSelectedQuizId(e.target.value)}
            >
              <option value="">Seçin...</option>
              {data.quizzes.map((qz) => (
                <option key={qz.id} value={qz.id}>
                  {qz.title}
                </option>
              ))}
            </Select>
          ) : blockType === 'code' ? (
            <>
              <Input
                label="Proqramlaşdırma dili"
                value={blockLanguage}
                onChange={(e) => setBlockLanguage(e.target.value)}
              />
              <Textarea
                label="Kod"
                required
                rows={5}
                className="font-mono text-xs"
                value={blockCode}
                onChange={(e) => setBlockCode(e.target.value)}
              />
            </>
          ) : blockType === 'image' ? (
            <>
              <Input
                label="Şəkil URL (https:// və ya /media/...)"
                required
                value={blockImageUrl}
                onChange={(e) => setBlockImageUrl(e.target.value)}
              />
              <Input
                label="Alt mətni (əlçatanlıq üçün)"
                required
                value={blockImageAlt}
                onChange={(e) => setBlockImageAlt(e.target.value)}
              />
              <Input
                label="Şəkilaltı izah (istəyə bağlı)"
                value={blockText}
                onChange={(e) => setBlockText(e.target.value)}
              />
            </>
          ) : (
            <>
              <Textarea
                label={
                  blockType === 'summary'
                    ? 'Əsas nəticələr (hər sətrə bir bənd)'
                    : 'Mətn / İzah'
                }
                required
                rows={4}
                value={blockText}
                onChange={(e) => setBlockText(e.target.value)}
              />
              {blockType === 'example' && (
                <Textarea
                  label="Nümunə kodu (istəyə bağlı)"
                  rows={4}
                  className="font-mono text-xs"
                  value={blockCode}
                  onChange={(e) => setBlockCode(e.target.value)}
                />
              )}
            </>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setBlockModal(false)}>
              Ləğv et
            </Button>
            <Button type="submit" variant="primary" isLoading={busy}>
              Bloku əlavə et
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Exercise Modal */}
      <Modal
        open={exerciseModal}
        onClose={() => setExerciseModal(false)}
        title="Yeni interaktiv məşq yarat"
      >
        <form onSubmit={handleCreateExercise} className="space-y-4">
          <Input
            label="Məşqin başlığı"
            required
            value={exForm.title}
            onChange={(e) => setExForm((p) => ({ ...p, title: e.target.value }))}
          />
          <Textarea
            label="Tapşırıq izahı"
            required
            rows={3}
            value={exForm.instructions}
            onChange={(e) => setExForm((p) => ({ ...p, instructions: e.target.value }))}
          />
          <Textarea
            label="Başlanğıc kodu (starter_code)"
            rows={3}
            className="font-mono text-xs"
            value={exForm.starter_code}
            onChange={(e) => setExForm((p) => ({ ...p, starter_code: e.target.value }))}
          />
          <Textarea
            label="Nümunə həll (yalnız adminlər görür)"
            rows={3}
            className="font-mono text-xs"
            value={exForm.solution_code}
            onChange={(e) => setExForm((p) => ({ ...p, solution_code: e.target.value }))}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Test halı adı"
              required
              value={exForm.test_label}
              onChange={(e) => setExForm((p) => ({ ...p, test_label: e.target.value }))}
            />
            <Input
              label="Gözlənilən çıxış (expected_stdout)"
              required
              value={exForm.expected_stdout}
              onChange={(e) => setExForm((p) => ({ ...p, expected_stdout: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setExerciseModal(false)}>
              Ləğv et
            </Button>
            <Button type="submit" variant="primary" isLoading={busy}>
              Məşqi yarat və əlavə et
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Quiz Modal */}
      <Modal open={quizModal} onClose={() => setQuizModal(false)} title="Yeni quiz yarat">
        <form onSubmit={handleCreateQuiz} className="space-y-4">
          <Input
            label="Quiz başlığı"
            required
            value={qzForm.title}
            onChange={(e) => setQzForm((p) => ({ ...p, title: e.target.value }))}
          />
          <Textarea
            label="Sual mətni"
            required
            rows={2}
            value={qzForm.prompt}
            onChange={(e) => setQzForm((p) => ({ ...p, prompt: e.target.value }))}
          />
          <Input
            label="Variant A"
            required
            value={qzForm.optionA}
            onChange={(e) => setQzForm((p) => ({ ...p, optionA: e.target.value }))}
          />
          <Input
            label="Variant B"
            required
            value={qzForm.optionB}
            onChange={(e) => setQzForm((p) => ({ ...p, optionB: e.target.value }))}
          />
          <Input
            label="Variant C (istəyə bağlı)"
            value={qzForm.optionC}
            onChange={(e) => setQzForm((p) => ({ ...p, optionC: e.target.value }))}
          />
          <Select
            label="Düzgün cavab (tələbəyə gizli qalır)"
            value={qzForm.correctOption}
            onChange={(e) =>
              setQzForm((p) => ({ ...p, correctOption: e.target.value as 'A' | 'B' | 'C' }))
            }
          >
            <option value="A">Variant A</option>
            <option value="B">Variant B</option>
            {qzForm.optionC.trim() && <option value="C">Variant C</option>}
          </Select>
          <Textarea
            label="Cavablandıqdan sonra izah"
            rows={2}
            value={qzForm.explanation}
            onChange={(e) => setQzForm((p) => ({ ...p, explanation: e.target.value }))}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setQuizModal(false)}>
              Ləğv et
            </Button>
            <Button type="submit" variant="primary" isLoading={busy}>
              Quiz-i yarat və əlavə et
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
