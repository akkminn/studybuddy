# StudyBuddy

StudyBuddy is a modernized, AI-powered learning application designed to help students supercharge their study sessions. By leveraging the Gemini API, StudyBuddy transforms boring class notes into highly engaging, Duolingo-style gamified quizzes and intelligent flashcards automatically. 

There's no need to manually craft question sets—simply upload your documents, and let the AI do the rest.

## Features

- **Gamified Quizzes**: Experience a Duolingo-style learning interaction. Progress through your AI-generated quizzes using a 5-Heart lives system, streak indicators, and dynamic feedback progress bars.
- **Smart Flashcards**: Get instant definitions and core concepts pulled from your notes into interactive flashcards.
- **Automated Text Extraction**: Behind-the-scenes parsing of `.pdf`, `.docx`, and `.txt` utilizing a dedicated Web Worker to maintain UI performance on heavy documents.
- **AI-Powered**: Uses Google's `gemini-3-flash-preview` to identify topics and formulate accurate multiple-choice questions with minimal hallucination risk.
- **Elegant UI Framework**: Built completely with modern Tailwind CSS and lightweight accessible components from `shadcn/ui`.

## Technical Stack

- **Frontend**: React (Vite), TypeScript, Tailwind CSS, Framer Motion
- **UI Components**: shadcn/ui (Radix), Recharts, sonner
- **Backend/Database**: Firebase (Authentication, Firestore Database)
- **AI Integration**: `@google/genai`
- **File Processing**: `pdfjs-dist`, `mammoth` (orchestrated via Web Workers)

## Setup and Installation

### Prerequisites
- Node.js (v18+)
- Firebase Project configured for Web App
- Gemini API Key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/studybuddy.git
   cd studybuddy
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Setup environment variables:
   Create a `.env.local` file at the root:
   ```env
   VITE_FIREBASE_API_KEY="AIzaSy..."
   VITE_FIREBASE_AUTH_DOMAIN="your-app.firebaseapp.com"
   VITE_FIREBASE_PROJECT_ID="your-app"
   VITE_FIREBASE_STORAGE_BUCKET="your-app.appspot.com"
   VITE_FIREBASE_MESSAGING_SENDER_ID="123456789"
   VITE_FIREBASE_APP_ID="1:123456789:web:abcde"
   VITE_GEMINI_API_KEY="AIzaSy..."
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Key Architectural Decisions

- **Custom Service Hooks**: `useQuizzes`, `usePerformances`, `useFlashcardSets`, and `useDocumentUpload` isolate noisy Firebase fetching and AI orchestration out of the React UI layer.
- **Web Worker Extraction**: Parsing large PDFs is blocking. Heavy logic from `mammoth` and `pdfjs` was offloaded into `documentWorker.ts` so React loading screens function seamlessly.
- **Global Robustness**: `ErrorBoundary` protects against complete React unmounts, while `sonner` handles centralized asynchronous notification errors cleanly.

## License

This project is licensed under the MIT License.
