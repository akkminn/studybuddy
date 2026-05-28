# StudyBuddy

StudyBuddy is an AI-powered learning platform that transforms your uploaded study documents into interactive quizzes, smart flashcard decks, visual mind maps, and a context-aware AI tutor — all from a single upload. It is built with a Django REST API backend and a React + TypeScript frontend.

---

## Distinctiveness and Complexity

StudyBuddy is neither a social network nor an e-commerce site. It is a full-stack educational tool that sits at the intersection of AI content generation, gamified learning, and document management — a combination that does not overlap with any of the CS50W course projects (Mail, Wiki, Commerce, Network, or the old Pizza project).

**Distinctiveness from course projects.** None of the course projects involved AI integration, file uploading, background task processing, or gamification mechanics. Where Network was about following users and posting text, StudyBuddy is about uploading PDFs and having an AI extract knowledge from them. Where Commerce was about auctions and bidding, StudyBuddy is about adaptive self-testing and retention. The problem domain, the data models, and every feature in this project are entirely different from what has been covered in the course.

**Backend complexity.** The Django backend is organized into three dedicated apps (`users`, `materials`, `chat`), each with its own models, views, serializers, and URL routing. The `materials` app alone contains eight distinct models: `Document`, `Quiz`, `Question`, `FlashcardDeck`, `Flashcard`, `Performance`, `GenerationUsage`, and `MindMap`. All AI generation (quiz, flashcard, and mind map creation) is dispatched as Celery tasks so that long-running Gemini API calls do not block the HTTP request–response cycle. A `GenerationUsage` model with a database-level `select_for_update()` lock enforces a fair daily rate limit (5 generations per type per user) without race conditions. The `chat` app implements a retrieval-augmented generation (RAG) pipeline: when a user sends a message, the backend fetches the full text of all documents attached to the session and injects them into the Gemini prompt, allowing the AI to answer questions grounded in the student's own notes rather than general knowledge. The `users` app extends Django's `AbstractUser` with gamification fields (`points`, `streak`, `last_activity`) and bridges Google OAuth2 (handled server-side by `django-allauth`) with the React SPA by issuing JWT tokens via a redirect callback after the OAuth flow completes.

**Frontend complexity.** The frontend is a multi-page React SPA built with TypeScript, Vite, Tailwind CSS, and Framer Motion. It communicates with the backend exclusively through a typed Axios client (`lib/api.ts`) that automatically injects JWT access tokens and handles transparent token refresh. Heavy document parsing (PDF via `pdfjs-dist`, DOCX via `mammoth`) is offloaded to a dedicated Web Worker (`workers/documentWorker.ts`) so that the React main thread remains responsive even for large files. The quiz experience (`pages/Quiz.tsx`) implements a full Duolingo-style game loop with a five-heart lives system, a live progress bar, per-answer animated feedback, and a streak counter — all managed as local React state that is flushed to the backend as a `Performance` record on completion. The flashcard viewer supports text-to-speech playback by calling a dedicated backend endpoint that streams PCM audio from Gemini's TTS API, wraps it into a WAV container server-side, and returns a base64-encoded string that the browser decodes and plays. The mind map viewer (`pages/MindMap.tsx`) renders an interactive, recursively-structured tree built from the JSON that Gemini returns. Every page supports both light and dark mode via a `ThemeProvider` context.

---

## File Documentation

### Backend

**`backend/manage.py`** — Standard Django management script for running the dev server, applying migrations, and other CLI commands.

**`backend/requirements.txt`** — Lists all Python package dependencies.

**`backend/.env`** — Environment variables (not committed). Must contain `SECRET_KEY`, `DATABASE_URL`, `GOOGLE_GENAI_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_SECRET`, and `FRONTEND_URL`.

#### `studybuddy_api/` (project configuration)

**`settings.py`** — Django settings. Configures PostgreSQL via `dj-database-url`, JWT cookies via `dj-rest-auth` and `SimpleJWT`, Google OAuth2 via `django-allauth`, CORS rules (including a regex that allows all Vercel preview deployments), Celery in synchronous eager mode for local development, and WhiteNoise for static file serving.

**`urls.py`** — Root URL router. Wires together the admin site, `dj-rest-auth` authentication endpoints, `allauth` social login routes, and the three app routers under `/api/`.

**`celery.py`** — Initializes the Celery application and auto-discovers tasks from all installed apps.

#### `users/` app

**`models.py`** — Defines the custom `User` model that extends `AbstractUser` with `role`, `points`, `streak`, and `last_activity` fields used by the gamification system.

**`views.py`** — Contains `GoogleLogin` (a `dj-rest-auth` social login view for SPA token exchange) and `google_login_callback` (a `@login_required` view that Django-allauth redirects to after completing the server-side OAuth flow; it generates a JWT pair and sends the tokens to the React frontend via URL query parameters).

**`serializers.py`** — `CustomUserDetailsSerializer` exposes the custom user fields (points, streak, role) through the `/api/auth/user/` endpoint.

#### `materials/` app

**`models.py`** — All core learning-content models: `Document` (stores extracted text and processing status), `Quiz` + `Question` (supports multiple choice, True/False, and fill-in-the-blank), `FlashcardDeck` + `Flashcard`, `Performance` (quiz score history), `GenerationUsage` (daily rate-limit tracking per user per type), and `MindMap` (stores the Gemini-generated JSON tree).

**`views.py`** — DRF `ModelViewSet` classes for every model. The `generate` custom actions on `QuizViewSet`, `FlashcardDeckViewSet`, and `MindMapViewSet` validate input, enforce the daily rate limit atomically, dispatch Celery tasks, and return the resulting resource ID immediately (since Celery runs in eager mode locally). Also contains a `tts` action that calls the Gemini TTS API and returns a base64-encoded WAV audio clip.

**`serializers.py`** — DRF serializers for all eight models, including a nested `QuizSerializer` that embeds all `Question` objects and a nested `FlashcardDeckSerializer` that embeds all `Flashcard` objects.

**`tasks.py`** — Three Celery `@shared_task` functions: `generate_quiz_for_document`, `generate_flashcards_for_document`, and `generate_mindmap_for_document`. Each builds a structured prompt, calls `gemini-2.5-flash`, parses the returned JSON, and creates the appropriate Django model instances.

**`utils.py`** — `extract_text_from_in_memory_file` reads an uploaded in-memory file object and extracts plain text from PDF (via `PyPDF2`), DOCX (via `python-docx`), and plain-text formats.

**`urls.py`** — Registers the five ViewSets with a DRF `DefaultRouter` under `/api/materials/`.

#### `chat/` app

**`models.py`** — `ChatSession` (links a user to zero or more `Document` objects) and `ChatMessage` (stores individual turns with `role` of `user` or `assistant`).

**`views.py`** — `ChatSessionViewSet` with two custom actions: `update_documents` (lets the user attach or detach documents from a session) and `send_message` (runs the RAG pipeline — gathers conversation history, injects document text into the Gemini prompt, saves both the user message and the AI reply, and returns the reply).

**`serializers.py`** — `ChatSessionSerializer` with nested messages and document metadata.

**`urls.py`** — Registers `ChatSessionViewSet` under `/api/chat/`.

### Frontend (`frontend/src/`)

**`main.tsx`** — React app entry point. Mounts the root component.

**`App.tsx`** — Defines all client-side routes using React Router. Wraps the app in `ThemeProvider` and `ErrorBoundary`.

**`lib/api.ts`** — Centralized API base URL utility. Reads `VITE_API_URL` from the environment and exports `apiUrl(path)`, a helper used by every page and hook to construct full backend URLs. In development it defaults to `http://localhost:8000`; in production with an empty `VITE_API_URL` it uses relative paths so the frontend and backend can be served from the same domain.

**`workers/documentWorker.ts`** — Web Worker that receives a `File` object from the main thread, extracts its text using `pdfjs-dist` or `mammoth`, and posts the result back — keeping the UI responsive during heavy parsing.

**`pages/Home.tsx`** — Public landing page with feature highlights and a call-to-action.

**`pages/Login.tsx` / `SignUp.tsx`** — Email/password authentication forms wired to the `dj-rest-auth` endpoints.

**`pages/AuthCallback.tsx`** — Receives the JWT tokens from the Google OAuth redirect URL, stores them in `localStorage`, and navigates the user to the dashboard.

**`pages/Dashboard.tsx`** — Shows the user's points, streak, and recent quizzes, flashcard decks, and mind maps.

**`pages/Upload.tsx`** — Document upload form. Sends the file to the backend and polls for processing completion.

**`pages/GenerateQuiz.tsx`** — Configuration form (question count, type, difficulty) that triggers quiz generation and navigates to the resulting quiz.

**`pages/Quiz.tsx`** — The core gamified quiz experience: five-heart lives, animated progress bar, per-answer feedback, and a completion screen that posts the score to the backend.

**`pages/QuizzesList.tsx`** — Paginated list of all the user's saved quizzes.

**`pages/GenerateFlashcards.tsx`** — Triggers flashcard deck generation for a selected document.

**`pages/Flashcards.tsx`** — Interactive flashcard deck viewer with flip animation and a TTS button that plays the card's back text aloud.

**`pages/FlashcardsList.tsx`** — List of all saved flashcard decks.

**`pages/GenerateMindMap.tsx`** — Triggers mind map generation for a selected document.

**`pages/MindMap.tsx`** — Renders the AI-generated JSON as an interactive, recursively-expanding tree visualization.

**`pages/MindMapsList.tsx`** — List of all saved mind maps.

**`pages/Chat.tsx`** — AI tutor chat interface. Users can attach documents to a session, then ask free-form questions answered in context of those documents.

**`pages/Profile.tsx`** — Displays gamification stats (points, streak) and account information.

**`components/Layout.tsx`** — Shared navigation shell used by all authenticated pages.

**`components/ErrorBoundary.tsx`** — Catches React render errors to prevent a full white screen.

**`components/ThemeProvider.tsx`** — Provides light/dark mode toggle state via React context.

**`components/quiz/`** — Sub-components for the quiz game: `QuizHeader` (lives + progress bar), `QuestionCard` (question text + answer options), `BottomActionBar` (navigation), `QuizCompletedScreen`, and `GameOverScreen`.

**`hooks/`** — Custom React hooks that encapsulate all data fetching and mutations: `useAuth`, `useDocuments`, `useDocumentUpload`, `useQuizzes`, `useFlashcardSets`, `useMindMaps`, `usePerformances`, `useGenerationUsage`, and `useStudyContext`.

---

## How to Run

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL (running locally, or a connection string from a hosted provider such as Supabase or Railway)
- A [Google Gemini API key](https://aistudio.google.com/)
- (Optional) Google OAuth credentials for social login

### Backend

```bash
cd backend

# Create and activate a virtual environment
python -m venv .venv
.venv\Scripts\activate      # Windows
# source .venv/bin/activate # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Create .env with the required variables
# SECRET_KEY=<your-django-secret-key>
# DATABASE_URL=postgresql://postgres:password@localhost:5432/studybuddy_db
# GOOGLE_GENAI_API_KEY=<your-gemini-api-key>
# FRONTEND_URL=http://localhost:5173

# Apply database migrations
python manage.py migrate

# Start the development server
python manage.py runserver
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local with the backend URL
# VITE_API_URL=http://localhost:8000

# Start the Vite development server
npm run dev
```

The application will be available at `http://localhost:5173`. The backend API runs at `http://localhost:8000`.

---

## Additional Notes

- **Celery / Redis**: The backend is configured with `CELERY_TASK_ALWAYS_EAGER = True`, which runs AI generation tasks synchronously without requiring Redis or a running Celery worker. To switch to true async processing, install Redis, set `CELERY_BROKER_URL` and `CELERY_RESULT_BACKEND` in `.env`, and start a worker with `celery -A studybuddy_api worker -l info`.
- **Google OAuth**: Social login requires a Google OAuth2 application with `http://localhost:8000/accounts/google/login/callback/` as an authorized redirect URI. The credentials must be added to the Django admin under **Sites → Social applications**.
- **Daily generation limits**: Each user may generate up to 5 quizzes, 5 flashcard decks, and 5 mind maps per calendar day. This limit is enforced atomically in the database by the `GenerationUsage` model.
- **Supported document formats**: PDF, DOCX, TXT, Markdown, and CSV.
