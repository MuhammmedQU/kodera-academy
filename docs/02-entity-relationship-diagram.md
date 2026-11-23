# Kodera — Faza 2: Entity-Relationship Diaqramları (`02-entity-relationship-diagram.md`)

> **Məqsəd:** Kodera LMS verilənlər bazasının bütün cədvəlləri və əlaqələrinin vizual xəritəsi.  
> **Əlaqəli sənəd:** [02-database-architecture.md](file:///c:/Users/LENOVO/Desktop/Py_Course/docs/02-database-architecture.md)

---

## 1. Ümumi Sistem ER Diaqramı (Bütün Əsas Cədvəllər)

```mermaid
erDiagram
    AUTH_USERS ||--|| PROFILES : "1:1 identity"
    SUPPORTED_LOCALES ||--o{ PROFILES : "preferred_locale"
    PROFILES ||--o{ USER_ROLES : "has roles"
    PROFILES ||--o{ APPLICATIONS : "submits"
    APPLICATIONS ||--o{ APPLICATION_NOTES : "admin notes"

    SUPPORTED_LOCALES ||--o{ COURSES : "course locale"
    COURSES ||--o{ MODULES : "contains"
    MODULES ||--o{ LESSONS : "contains"
    LESSONS ||--o{ LESSON_CONTENT_BLOCKS : "ordered 11 blocks"
    LESSONS ||--o{ EXERCISES : "has exercises"
    LESSONS ||--o{ QUIZZES : "has quizzes"

    EXERCISES ||--o| EXERCISE_SOLUTIONS : "admin solution"
    EXERCISES ||--o{ EXERCISE_TEST_CASES : "has test cases"
    EXERCISES ||--o{ LESSON_CONTENT_BLOCKS : "embedded in block"

    QUIZZES ||--o{ QUIZ_QUESTIONS : "contains questions"
    QUIZ_QUESTIONS ||--o{ QUIZ_QUESTION_OPTIONS : "has options"
    QUIZZES ||--o{ LESSON_CONTENT_BLOCKS : "embedded in block"

    PROFILES ||--o{ ENROLLMENTS : "assigned courses"
    COURSES ||--o{ ENROLLMENTS : "enrolled students"

    PROFILES ||--o{ LESSON_PROGRESS : "tracks progress"
    COURSES ||--o{ LESSON_PROGRESS : "per-course progress"
    LESSONS ||--o{ LESSON_PROGRESS : "lesson completion"

    PROFILES ||--o{ EXERCISE_ATTEMPTS : "submits code"
    EXERCISES ||--o{ EXERCISE_ATTEMPTS : "receives attempts"

    PROFILES ||--o{ QUIZ_ATTEMPTS : "takes quizzes"
    QUIZZES ||--o{ QUIZ_ATTEMPTS : "recorded attempts"
    QUIZ_ATTEMPTS ||--o{ QUIZ_ATTEMPT_ANSWERS : "contains answers"
    QUIZ_QUESTIONS ||--o{ QUIZ_ATTEMPT_ANSWERS : "answered question"

    PROFILES ||--o{ AUDIT_LOGS : "admin actor"
    PROFILES ||--o{ PLATFORM_SETTINGS : "updated_by"
```

---

## 2. Domen 1: İstifadəçi, Rollar və Qeydiyyat Müraciəti

```mermaid
erDiagram
    AUTH_USERS {
        uuid id PK
        text email
        timestamptz email_confirmed_at
    }

    SUPPORTED_LOCALES {
        text code PK
        text name
        text native_name
        boolean is_default
        boolean is_active
    }

    PROFILES {
        uuid id PK
        text email UK
        text full_name
        text phone
        text learning_goals
        text preferred_locale FK
        account_status account_status
        timestamptz archived_at
        timestamptz created_at
    }

    USER_ROLES {
        uuid id PK
        uuid user_id FK
        app_role role
        uuid granted_by FK
        timestamptz granted_at
        timestamptz revoked_at
    }

    APPLICATIONS {
        uuid id PK
        uuid user_id FK
        text reference_code UK
        application_status status
        timestamptz submitted_at
        uuid reviewed_by FK
        timestamptz reviewed_at
        text rejection_reason
    }

    APPLICATION_NOTES {
        uuid id PK
        uuid application_id FK
        uuid author_id FK
        text note
        timestamptz created_at
    }

    AUTH_USERS ||--|| PROFILES : "owns"
    SUPPORTED_LOCALES ||--o{ PROFILES : "default language"
    PROFILES ||--o{ USER_ROLES : "assigned roles"
    PROFILES ||--o{ APPLICATIONS : "submits application"
    PROFILES ||--o{ APPLICATIONS : "reviewed_by admin"
    APPLICATIONS ||--o{ APPLICATION_NOTES : "has private notes"
    PROFILES ||--o{ APPLICATION_NOTES : "written by admin"
```

---

## 3. Domen 2: Çoxkurslu Tədris Kontenti, 11 Blok, Məşq və Quiz

```mermaid
erDiagram
    COURSES {
        uuid id PK
        text slug UK
        text locale FK
        text title
        text programming_language
        course_difficulty difficulty
        integer sort_order
        content_status status
        boolean is_published
    }

    MODULES {
        uuid id PK
        uuid course_id FK
        text slug
        text title
        integer sort_order
        boolean is_public
        content_status status
        boolean is_published
    }

    LESSONS {
        uuid id PK
        uuid module_id FK
        text slug
        text title
        integer estimated_minutes
        integer sort_order
        content_status status
        boolean is_published
    }

    LESSON_CONTENT_BLOCKS {
        uuid id PK
        uuid lesson_id FK
        text locale FK
        content_block_type block_type
        integer sort_order
        text title
        jsonb content
        uuid exercise_id FK
        uuid quiz_id FK
        boolean is_published
    }

    EXERCISES {
        uuid id PK
        uuid lesson_id FK
        text locale FK
        text title
        text programming_language
        exercise_execution_mode execution_mode
        integer time_limit_ms
        content_status status
    }

    EXERCISE_SOLUTIONS {
        uuid exercise_id PK
        text solution_code
        text explanation
    }

    EXERCISE_TEST_CASES {
        uuid id PK
        uuid exercise_id FK
        text label
        text stdin_input
        text expected_stdout
        text assertion_code
        boolean is_hidden
        integer sort_order
    }

    QUIZZES {
        uuid id PK
        uuid lesson_id FK
        text locale FK
        text title
        integer passing_score_percent
        integer max_attempts
        content_status status
    }

    QUIZ_QUESTIONS {
        uuid id PK
        uuid quiz_id FK
        quiz_question_type question_type
        text prompt
        integer points
        integer sort_order
    }

    QUIZ_QUESTION_OPTIONS {
        uuid id PK
        uuid question_id FK
        text option_text
        boolean is_correct
        integer sort_order
    }

    COURSES ||--o{ MODULES : "has modules"
    MODULES ||--o{ LESSONS : "has lessons"
    LESSONS ||--o{ LESSON_CONTENT_BLOCKS : "composed of blocks"
    LESSONS ||--o{ EXERCISES : "defines exercises"
    LESSONS ||--o{ QUIZZES : "defines quizzes"
    EXERCISES ||--o| EXERCISE_SOLUTIONS : "admin reference solution"
    EXERCISES ||--o{ EXERCISE_TEST_CASES : "verified by tests"
    EXERCISES ||--o{ LESSON_CONTENT_BLOCKS : "linked via exercise_id"
    QUIZZES ||--o{ QUIZ_QUESTIONS : "contains"
    QUIZ_QUESTIONS ||--o{ QUIZ_QUESTION_OPTIONS : "offers choices"
    QUIZZES ||--o{ LESSON_CONTENT_BLOCKS : "linked via quiz_id"
```

---

## 4. Domen 3: Kurs Təyinatları, Tələbə İrəliləyişi, Cavablar və Audit

```mermaid
erDiagram
    PROFILES {
        uuid id PK
        text email
        account_status account_status
    }

    COURSES {
        uuid id PK
        text slug
        text title
    }

    LESSONS {
        uuid id PK
        uuid module_id FK
        text title
    }

    EXERCISES {
        uuid id PK
        uuid lesson_id FK
        text title
    }

    QUIZZES {
        uuid id PK
        uuid lesson_id FK
        text title
    }

    QUIZ_QUESTIONS {
        uuid id PK
        uuid quiz_id FK
    }

    ENROLLMENTS {
        uuid id PK
        uuid student_id FK
        uuid course_id FK
        enrollment_status status
        uuid assigned_by FK
        timestamptz assigned_at
        timestamptz revoked_at
    }

    LESSON_PROGRESS {
        uuid id PK
        uuid student_id FK
        uuid course_id FK
        uuid lesson_id FK
        progress_status status
        timestamptz completed_at
        timestamptz last_accessed_at
    }

    EXERCISE_ATTEMPTS {
        uuid id PK
        uuid student_id FK
        uuid exercise_id FK
        attempt_status status
        integer passed_tests
        integer total_tests
        integer execution_time_ms
        timestamptz created_at
    }

    QUIZ_ATTEMPTS {
        uuid id PK
        uuid student_id FK
        uuid quiz_id FK
        integer attempt_number
        integer earned_points
        integer total_points
        numeric score_percent
        boolean is_passed
        timestamptz submitted_at
    }

    QUIZ_ATTEMPT_ANSWERS {
        uuid id PK
        uuid attempt_id FK
        uuid question_id FK
        uuid_array selected_option_ids
        boolean is_correct
        integer points_awarded
    }

    PLATFORM_SETTINGS {
        boolean id PK
        text academy_name
        text whatsapp_phone
        boolean whatsapp_button_enabled
        boolean registration_enabled
        uuid updated_by FK
    }

    AUDIT_LOGS {
        uuid id PK
        uuid actor_id FK
        text actor_role
        text action
        text entity_type
        uuid entity_id
        jsonb metadata
        timestamptz created_at
    }

    RATE_LIMIT_EVENTS {
        bigint id PK
        text bucket_key
        text action
        timestamptz created_at
    }

    PROFILES ||--o{ ENROLLMENTS : "student enrolled"
    COURSES ||--o{ ENROLLMENTS : "has enrollments"
    PROFILES ||--o{ LESSON_PROGRESS : "records progress"
    COURSES ||--o{ LESSON_PROGRESS : "aggregated by course"
    LESSONS ||--o{ LESSON_PROGRESS : "completed lesson"
    PROFILES ||--o{ EXERCISE_ATTEMPTS : "attempts exercise"
    EXERCISES ||--o{ EXERCISE_ATTEMPTS : "has attempts"
    PROFILES ||--o{ QUIZ_ATTEMPTS : "attempts quiz"
    QUIZZES ||--o{ QUIZ_ATTEMPTS : "has attempts"
    QUIZ_ATTEMPTS ||--o{ QUIZ_ATTEMPT_ANSWERS : "stores answers"
    QUIZ_QUESTIONS ||--o{ QUIZ_ATTEMPT_ANSWERS : "for question"
    PROFILES ||--o{ AUDIT_LOGS : "performed by admin"
    PROFILES ||--o{ PLATFORM_SETTINGS : "last updated by"
```

---

## 5. Əsas Biznes Əlaqələrinin Xülasəsi

| Əlaqə | Kardinalıq | Necə Modelləşdirilib? |
| :--- | :---: | :--- |
| Bir istifadəçinin profili | `1 : 1` | `profiles.id` birbaşa `auth.users(id)` üzərində PK + FK-dır |
| Bir istifadəçinin müraciəti | `1 : 1` (aktiv) / `1 : N` (tarixçə) | `applications.user_id -> profiles.id`; qismən unikal indeks eyni vaxtda yalnız 1 `pending`/`approved` müraciətə icazə verir |
| Bir kursun çoxlu modulu | `1 : N` | `modules.course_id -> courses.id`, `sort_order` ilə sıralanır |
| Bir modulun çoxlu dərsi | `1 : N` | `lessons.module_id -> modules.id`, `sort_order` ilə sıralanır |
| Bir dərsin çoxlu kontent bloku | `1 : N` | `lesson_content_blocks.lesson_id -> lessons.id`, `(lesson_id, locale, sort_order)` üzrə sıralanır |
| Bir tələbənin çoxlu kurs təyinatı | `N : M` (`enrollments` vasitəsilə) | `enrollments(student_id, course_id)` unikal cütlüyü; təsdiqdən tam ayrı idarə olunur |
| Bir tələbənin çoxlu quiz cavabı | `1 : N : M` | `profiles -> quiz_attempts (1:N) -> quiz_attempt_answers (1:N) -> quiz_questions` |
| Bir tələbənin fərqli kurslar üzrə irəliləyişi | `1 : N` | `lesson_progress(student_id, course_id, lesson_id)` unikal `(student_id, lesson_id)` və `(student_id, course_id, status)` indeksi ilə |
