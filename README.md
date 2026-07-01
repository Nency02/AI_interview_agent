# AI Interview Coach

AI Interview Coach is a complete full-stack technical mock interview platform. It utilizes a stateful multi-agent system powered by **LangGraph**, **FastAPI**, **MongoDB**, and the **Groq API** (using the `llama-3.3-70b-versatile` model). The UI is built using **React** and **Tailwind CSS**, featuring modern glassmorphic designs, responsive pages, and smooth micro-interactions.

---

## 🛠️ Architecture

```
        Frontend (React SPA)
                 │
                 ▼  (JWT Auth & JSON REST API)
          FastAPI Backend
                 │
                 ▼  (Retrieves/Updates State)
          MongoDB Database
                 │
                 ▼  (Invokes Graph)
         LangGraph Workflow
                 │
                 ├─► Interviewer Agent  (Generates topic/difficulty questions)
                 ├─► Evaluator Agent    (Grades answers from 1-10 with structured output)
                 ├─► Decision Agent     (Adjusts next difficulty dynamically)
                 └─► Report Agent       (Compiles final performance report summary)
```

---

## 🏗️ Project Structure

```
AI_interview_coach/
├── backend/
│   ├── app/
│   │   ├── agents/      # Interviewer, Evaluator, and Report Agents
│   │   ├── database/    # Motor client MongoDB setup
│   │   ├── graph/       # LangGraph workspace state and compiled workflow
│   │   ├── models/      # Pydantic schema validation for DB and APIs
│   │   ├── routes/      # FastAPI API endpoints (Auth, Interview, Report)
│   │   ├── services/    # Authentication helper (JWT/bcrypt) and LLM service (Groq)
│   │   └── main.py      # Entrypoint / lifespan of FastAPI server
│   ├── requirements.txt # Python dependencies
│   └── .env             # Database & Groq configurations
└── frontend/
    ├── src/
    │   ├── components/  # Reusable elements (Navbar)
    │   ├── context/     # React state (AuthContext)
    │   ├── pages/       # Login, Register, Dashboard, Start, Interview, Results, History
    │   ├── services/    # Axios client instances
    │   ├── index.css    # Tailwind styling tokens & design systems
    │   └── App.jsx      # React router coordinates
    ├── tailwind.config.js
    └── package.json
```

---

## ⚡ Prerequisites

1. **MongoDB Server**: Ensure MongoDB is running locally at `mongodb://localhost:27017` (default).
2. **Groq API Key**: You need a valid Groq API key to generate questions, evaluate answers, and synthesize reports.
3. **Python 3.10+** and **Node.js v18+**.

---

## 🚀 Setting Up the Application

### 1. Backend Configuration

1. Open `backend/.env` and replace `your_groq_api_key_here` with your actual Groq API Key:
   ```env
   GROQ_API_KEY=gsk_...
   ```
2. Navigate to the `backend/` directory in your terminal:
   ```bash
   cd backend
   ```
3. Create a Python virtual environment:
   ```bash
   python -m venv venv
   ```
4. Activate the virtual environment:
   - **Windows (PowerShell)**:
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - **macOS/Linux**:
     ```bash
     source venv/bin/activate
     ```
5. Install python packages:
   ```bash
   pip install -r requirements.txt
   ```
6. Start the FastAPI backend server:
   ```bash
   uvicorn app.main:app --reload
   ```
   The backend will run on `http://localhost:8000`. You can inspect the interactive OpenAPI swagger documentation at `http://localhost:8000/docs`.

---

### 2. Frontend Configuration

1. Open a new terminal window and navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. The dependencies are already pre-installed, but you can run clean installs if needed:
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`. Open this URL in your web browser.

---

## 🧪 Verification Flow

1. **Register & Login**: Register a new user at `http://localhost:5173/register` and login. Verify JWT tokens are stored in `localStorage` and persist through refreshes.
2. **Dashboard**: Inspect the welcome card and statistics counters (initially 0).
3. **Mock Interview**:
   - Go to **Start Practice Mock**, select a topic (e.g. *DBMS*) and starting difficulty (e.g. *Medium*).
   - Answer the first question.
   - If you provide a thorough, correct answer (e.g., detail indexes or normalization forms) -> check if the score is high (8+) and the next question difficulty scales to *Hard*.
   - If you provide a weak/poor answer -> check if the score is low (<5) and difficulty scales down to *Easy*.
4. **Final Compilation**:
   - After answering the 5th question, wait for the **Report Agent** to compile the final summary.
   - You will automatically transition to the **Results page** showing your overall score, strengths, weaknesses, learning roadmap, and individual question breakdown.
5. **Logs & History**: Navigate to **History** to view the completed mocks log.
