import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Code2, HelpCircle, Layers, Pencil, Plus, Trash2 } from 'lucide-react';
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
  EmptyState,
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
  heading: 'Başlıq',
  paragraph: 'Paraqraf',
  image: 'Şəkil',
  code: 'Kod bloku',
  explanation: 'Kod / Məntiq izahı',
  example: 'Real həyat nümunəsi',
  note: 'Vacib qeyd',
  warning: 'Xəbərdarlıq / Tez-tez edilən xəta',
  exercise: 'İnteraktiv məşq',
  quiz: 'Bilik yoxlaması (Quiz)',
  summary: 'Dərsin xülasəsi',
};

const EMPTY_EXERCISE_FORM = {
  title: '',
  instructions: '',
  starter_code: '# Kodunuzu bura yazın\n',
  solution_code: '',
  expected_stdout: '',
  test_label: 'Çıxış yoxlaması',
};

const EMPTY_QUIZ_FORM = {
  title: '',
  prompt: '',
  optionA: '',
  optionB: '',
  optionC: '',
  correctOption: 'A' as 'A' | 'B' | 'C',
  explanation: '',
};

function asString(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

export function AdminLessonEditorPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const [data, setData] = useState<EditorPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Add / Edit block modal state
  const [blockModal, setBlockModal] = useState(false);
  const [editingBlock, setEditingBlock] = useState<LessonContentBlock | null>(null);
  const [blockType, setBlockType] = useState<ContentBlockType>('paragraph');
  const [blockTitle, setBlockTitle] = useState('');
  const [blockText, setBlockText] = useState('');
  const [blockExtra, setBlockExtra] = useState('');
  const [blockCode, setBlockCode] = useState('');
  const [blockLanguage, setBlockLanguage] = useState('python');
  const [blockFilename, setBlockFilename] = useState('example.py');
  const [blockHeadingLevel, setBlockHeadingLevel] = useState<2 | 3>(2);
  const [blockImageUrl, setBlockImageUrl] = useState('');
  const [blockImageAlt, setBlockImageAlt] = useState('');
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  const [selectedQuizId, setSelectedQuizId] = useState('');

  // Delete block confirmation
  const [deleteTarget, setDeleteTarget] = useState<LessonContentBlock | null>(null);

  // Create Exercise modal
  const [exerciseModal, setExerciseModal] = useState(false);
  const [exForm, setExForm] = useState(EMPTY_EXERCISE_FORM);

  // Create Quiz modal
  const [quizModal, setQuizModal] = useState(false);
  const [qzForm, setQzForm] = useState(EMPTY_QUIZ_FORM);

  const nextSortOrder = (blocks: LessonContentBlock[]) =>
    Math.max(0, ...blocks.map((b) => b.sort_order)) + 1;

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

  const resetBlockForm = () => {
    setEditingBlock(null);
    setBlockType('paragraph');
    setBlockTitle('');
    setBlockText('');
    setBlockExtra('');
    setBlockCode('');
    setBlockLanguage('python');
    setBlockFilename('example.py');
    setBlockHeadingLevel(2);
    setBlockImageUrl('');
    setBlockImageAlt('');
    setSelectedExerciseId('');
    setSelectedQuizId('');
    setModalError(null);
  };

  const openCreateBlockModal = () => {
    resetBlockForm();
    setBlockModal(true);
  };

  const openEditBlockModal = (block: LessonContentBlock) => {
    const c = block.content;
    setEditingBlock(block);
    setBlockType(block.block_type);
    setBlockTitle(block.title ?? '');
    setModalError(null);

    if (block.block_type === 'heading') {
      setBlockHeadingLevel(c.level === 3 ? 3 : 2);
      setBlockText(asString(c.text));
    } else if (block.block_type === 'code') {
      setBlockLanguage(asString(c.language) || 'python');
      setBlockFilename(asString(c.filename) || 'example.py');
      setBlockCode(asString(c.code));
      setBlockExtra(asString(c.expected_output));
    } else if (block.block_type === 'image') {
      setBlockImageUrl(asString(c.url || c.storage_path));
      setBlockImageAlt(asString(c.alt));
      setBlockText(asString(c.caption));
    } else if (block.block_type === 'example') {
      setBlockText(asString(c.scenario));
      setBlockLanguage(asString(c.language) || 'python');
      setBlockCode(asString(c.code));
      setBlockExtra(asString(c.walkthrough));
    } else if (block.block_type === 'warning') {
      setBlockText(asString(c.text));
      setBlockExtra(asString(c.common_mistake));
    } else if (block.block_type === 'summary') {
      const list = Array.isArray(c.key_takeaways)
        ? c.key_takeaways.filter((x): x is string => typeof x === 'string')
        : [];
      setBlockText(list.join('\n'));
      setBlockExtra(asString(c.next_step_hint));
    } else {
      setBlockText(asString(c.text));
      setBlockExtra('');
    }
    setBlockModal(true);
  };

  const buildBlockContent = (): Record<string, unknown> => {
    if (blockType === 'heading') {
      return { level: blockHeadingLevel, text: blockText };
    }
    if (blockType === 'code') {
      return {
        language: blockLanguage.trim() || 'python',
        code: blockCode,
        filename: blockFilename.trim() || 'example.py',
        ...(blockExtra.trim() ? { expected_output: blockExtra } : {}),
      };
    }
    if (blockType === 'image') {
      return { url: blockImageUrl.trim(), alt: blockImageAlt.trim(), caption: blockText.trim() };
    }
    if (blockType === 'example') {
      return {
        scenario: blockText,
        language: blockLanguage.trim() || 'python',
        code: blockCode,
        ...(blockExtra.trim() ? { walkthrough: blockExtra } : {}),
      };
    }
    if (blockType === 'warning') {
      return {
        text: blockText,
        ...(blockExtra.trim() ? { common_mistake: blockExtra } : {}),
      };
    }
    if (blockType === 'summary') {
      return {
        key_takeaways: blockText
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        ...(blockExtra.trim() ? { next_step_hint: blockExtra.trim() } : {}),
      };
    }
    if (blockType === 'exercise' || blockType === 'quiz') {
      return { display_mode: 'inline' };
    }
    return { text: blockText };
  };

  const handleSaveBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonId || !data) return;
    setBusy(true);
    setModalError(null);
    try {
      const content = buildBlockContent();
      if (editingBlock) {
        await apiRequest(`/api/admin/blocks/${editingBlock.id}`, {
          method: 'PATCH',
          body: {
            title: blockTitle.trim() || null,
            content:
              editingBlock.block_type === 'exercise' || editingBlock.block_type === 'quiz'
                ? editingBlock.content
                : content,
          },
        });
        setFeedback('Kontent bloku yeniləndi.');
      } else {
        await apiRequest('/api/admin/blocks', {
          method: 'POST',
          body: {
            lesson_id: lessonId,
            locale: 'az',
            block_type: blockType,
            sort_order: nextSortOrder(data.blocks),
            title: blockTitle.trim() || null,
            content,
            exercise_id: blockType === 'exercise' ? selectedExerciseId || null : null,
            quiz_id: blockType === 'quiz' ? selectedQuizId || null : null,
            is_published: true,
          },
        });
        setFeedback('Yeni kontent bloku dərsə əlavə edildi.');
      }
      setBlockModal(false);
      resetBlockForm();
      await loadEditor();
    } catch (err) {
      setModalError(err instanceof ApiError ? err.message : 'Blok yadda saxlanmadı.');
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmDeleteBlock = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    setModalError(null);
    try {
      await apiRequest(`/api/admin/blocks/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      setFeedback('Kontent bloku silindi.');
      await loadEditor();
    } catch (err) {
      setModalError(err instanceof ApiError ? err.message : 'Blok silinmədi.');
    } finally {
      setBusy(false);
    }
  };

  const handleCreateExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonId || !data) return;
    setBusy(true);
    setModalError(null);
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
          sort_order: nextSortOrder(data.blocks),
          title: created.title,
          content: { display_mode: 'inline' },
          exercise_id: created.id,
          quiz_id: null,
          is_published: true,
        },
      });
      setExerciseModal(false);
      setExForm(EMPTY_EXERCISE_FORM);
      setFeedback('Məşq yaradıldı və avtomatik dərsə blok kimi əlavə edildi.');
      await loadEditor();
    } catch (err) {
      setModalError(err instanceof ApiError ? err.message : 'Məşq yaradılmadı.');
    } finally {
      setBusy(false);
    }
  };

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonId || !data) return;
    const hasC = qzForm.optionC.trim().length > 0;
    const effectiveCorrect = qzForm.correctOption === 'C' && !hasC ? 'A' : qzForm.correctOption;

    setBusy(true);
    setModalError(null);
    try {
      const options = [
        { option_text: qzForm.optionA, is_correct: effectiveCorrect === 'A', sort_order: 1 },
        { option_text: qzForm.optionB, is_correct: effectiveCorrect === 'B', sort_order: 2 },
        ...(hasC
          ? [{ option_text: qzForm.optionC, is_correct: effectiveCorrect === 'C', sort_order: 3 }]
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
          sort_order: nextSortOrder(data.blocks),
          title: created.title,
          content: { display_mode: 'inline' },
          exercise_id: null,
          quiz_id: created.id,
          is_published: true,
        },
      });
      setQuizModal(false);
      setQzForm(EMPTY_QUIZ_FORM);
      setFeedback('Quiz yaradıldı və dərsə əlavə edildi (cavab açarı serverdə qorunur).');
      await loadEditor();
    } catch (err) {
      setModalError(err instanceof ApiError ? err.message : 'Quiz yaradılmadı.');
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
            Kod yazmadan 11 növ strukturlaşdırılmış dərs bloku, məşq və quiz əlavə edin və redaktə
            edin.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="primary" size="sm" onClick={openCreateBlockModal}>
            <Plus className="h-4 w-4" />
            Blok əlavə et
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setExForm(EMPTY_EXERCISE_FORM);
              setModalError(null);
              setExerciseModal(true);
            }}
          >
            <Code2 className="h-4 w-4" />
            Məşq yarat
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setQzForm(EMPTY_QUIZ_FORM);
              setModalError(null);
              setQuizModal(true);
            }}
          >
            <HelpCircle className="h-4 w-4" />
            Quiz yarat
          </Button>
        </div>
      </div>

      {feedback && <Alert variant="success">{feedback}</Alert>}
      {error && <Alert variant="error">{error}</Alert>}

      {data.blocks.length === 0 ? (
        <EmptyState
          icon={<Layers className="h-6 w-6" />}
          title="Bu dərsdə hələ kontent bloku yoxdur"
          description="Başlıq, izah, kod bloku, praktik məşq və ya quiz əlavə etməklə dərsi qurmağa başlayın."
          action={
            <Button variant="primary" size="sm" onClick={openCreateBlockModal}>
              <Plus className="h-4 w-4" />
              İlk bloku əlavə et
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {data.blocks.map((block) => (
            <Card key={block.id}>
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-bold">
                    #{block.sort_order}
                  </span>
                  <Badge variant="brand">{BLOCK_TYPE_LABELS[block.block_type]}</Badge>
                  {block.title && <CardTitle className="text-sm">{block.title}</CardTitle>}
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => openEditBlockModal(block)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Redaktə
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    disabled={busy}
                    onClick={() => {
                      setDeleteTarget(block);
                      setModalError(null);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Sil
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <pre className="overflow-x-auto rounded-xl bg-zinc-50 p-3 text-xs text-zinc-700">
                  {JSON.stringify(block.content, null, 2)}
                </pre>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Block Modal */}
      <Modal
        open={blockModal}
        onClose={() => {
          setBlockModal(false);
          resetBlockForm();
        }}
        title={
          editingBlock
            ? `Bloku redaktə et (${BLOCK_TYPE_LABELS[editingBlock.block_type]})`
            : 'Kontent bloku əlavə et'
        }
      >
        <form onSubmit={handleSaveBlock} className="space-y-4">
          {modalError && <Alert variant="error">{modalError}</Alert>}

          {!editingBlock && (
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
          )}

          <Input
            label="Blok başlığı (istəyə bağlı)"
            value={blockTitle}
            onChange={(e) => setBlockTitle(e.target.value)}
          />

          {blockType === 'exercise' ? (
            !editingBlock ? (
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
            ) : (
              <Alert variant="info">Məşq blokunun yalnız başlığı buradan yenilənə bilər.</Alert>
            )
          ) : blockType === 'quiz' ? (
            !editingBlock ? (
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
            ) : (
              <Alert variant="info">Quiz blokunun yalnız başlığı buradan yenilənə bilər.</Alert>
            )
          ) : blockType === 'heading' ? (
            <>
              <Select
                label="Başlıq səviyyəsi"
                value={String(blockHeadingLevel)}
                onChange={(e) => setBlockHeadingLevel(e.target.value === '3' ? 3 : 2)}
              >
                <option value="2">Əsas bölmə başlığı (H2)</option>
                <option value="3">Alt başlıq (H3)</option>
              </Select>
              <Input
                label="Başlıq mətni"
                required
                value={blockText}
                onChange={(e) => setBlockText(e.target.value)}
              />
            </>
          ) : blockType === 'code' ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Proqramlaşdırma dili"
                  value={blockLanguage}
                  onChange={(e) => setBlockLanguage(e.target.value)}
                />
                <Input
                  label="Fayl adı"
                  placeholder="example.py"
                  value={blockFilename}
                  onChange={(e) => setBlockFilename(e.target.value)}
                />
              </div>
              <Textarea
                label="Kod"
                required
                rows={5}
                className="font-mono text-xs"
                value={blockCode}
                onChange={(e) => setBlockCode(e.target.value)}
              />
              <Textarea
                label="Ekranda görünən nəticə (istəyə bağlı)"
                rows={2}
                className="font-mono text-xs"
                value={blockExtra}
                onChange={(e) => setBlockExtra(e.target.value)}
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
                <>
                  <Textarea
                    label="Nümunə kodu (istəyə bağlı)"
                    rows={4}
                    className="font-mono text-xs"
                    value={blockCode}
                    onChange={(e) => setBlockCode(e.target.value)}
                  />
                  <Textarea
                    label="Addım-addım izah (istəyə bağlı)"
                    rows={2}
                    value={blockExtra}
                    onChange={(e) => setBlockExtra(e.target.value)}
                  />
                </>
              )}
              {blockType === 'warning' && (
                <Textarea
                  label="Tipik yanlış kod nümunəsi (istəyə bağlı)"
                  rows={2}
                  className="font-mono text-xs"
                  value={blockExtra}
                  onChange={(e) => setBlockExtra(e.target.value)}
                />
              )}
              {blockType === 'summary' && (
                <Input
                  label="Növbəti addım tövsiyəsi (istəyə bağlı)"
                  value={blockExtra}
                  onChange={(e) => setBlockExtra(e.target.value)}
                />
              )}
            </>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setBlockModal(false);
                resetBlockForm();
              }}
            >
              Ləğv et
            </Button>
            <Button type="submit" variant="primary" isLoading={busy}>
              {editingBlock ? 'Dəyişiklikləri saxla' : 'Bloku əlavə et'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Block Confirmation Modal */}
      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => {
          setDeleteTarget(null);
          setModalError(null);
        }}
        title="Kontent blokunu sil"
      >
        <div className="space-y-4">
          {modalError && <Alert variant="error">{modalError}</Alert>}
          <Alert variant="warning">
            Bu bloku (#{deleteTarget?.sort_order} —{' '}
            {deleteTarget ? BLOCK_TYPE_LABELS[deleteTarget.block_type] : ''}) dərsdən silmək
            istədiyinizə əminsiniz?
          </Alert>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Ləğv et
            </Button>
            <Button variant="danger" isLoading={busy} onClick={handleConfirmDeleteBlock}>
              Bəli, bloku sil
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create Exercise Modal */}
      <Modal
        open={exerciseModal}
        onClose={() => {
          setExerciseModal(false);
          setModalError(null);
        }}
        title="Yeni interaktiv məşq yarat"
      >
        <form onSubmit={handleCreateExercise} className="space-y-4">
          {modalError && <Alert variant="error">{modalError}</Alert>}
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
            label="Başlanğıc kodu"
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
              label="Gözlənilən çıxış"
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
      <Modal
        open={quizModal}
        onClose={() => {
          setQuizModal(false);
          setModalError(null);
        }}
        title="Yeni quiz yarat"
      >
        <form onSubmit={handleCreateQuiz} className="space-y-4">
          {modalError && <Alert variant="error">{modalError}</Alert>}
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
            onChange={(e) => {
              const nextC = e.target.value;
              setQzForm((p) => ({
                ...p,
                optionC: nextC,
                correctOption: !nextC.trim() && p.correctOption === 'C' ? 'A' : p.correctOption,
              }));
            }}
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
