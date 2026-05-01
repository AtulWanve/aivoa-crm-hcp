# AI-First CRM – HCP Interaction Logger

An **AI-first Customer Relationship Management (CRM)** module for Healthcare Professional (HCP) interaction logging, built as part of the AIVOA.AI Full Stack Developer assignment.

## Demo

- **Left panel**: Read-only interaction form — all fields are locked from manual input
- **Right panel**: AI chat assistant — describe the interaction in plain English and the AI extracts and populates every field in real-time
- **Submit**: Once the AI fills the HCP name, the Submit button activates and saves the record to the database

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Redux Toolkit, Vite 5, Tailwind CSS 3 |
| Backend | Python 3.12, FastAPI, SQLAlchemy |
| AI Agent | LangGraph 1.x |
| LLM | Groq – `llama-3.3-70b-versatile` *(gemma2-9b-it was decommissioned by Groq)* |
| Database | PostgreSQL (primary) → SQLite auto-fallback |
| Font | Google Inter |
| Streaming | Server-Sent Events (SSE) |

---

## LangGraph Agent – 5 Tools

| # | Tool | Purpose |
|---|---|---|
| 1 | `log_interaction` | Extracts all interaction fields (HCP name, date, time, sentiment, topics, samples, attendees, materials, follow-up, outcomes) from natural language and populates the form |
| 2 | `edit_interaction` | Updates a single specific field in an already-logged interaction without disturbing other fields |
| 3 | `query_hcp_directory` | Looks up an HCP by name in the directory to verify their licence status and specialty |
| 4 | `verify_sampling_compliance` | Checks proposed sample quantities against PDMA regulatory limits (max 5 per interaction) |
| 5 | `extract_medical_entities` | Parses clinical notes to identify adverse events, drug names, off-label usage inquiries |

---

## Prerequisites

- Python 3.10+
- Node.js 20.19+ (or 22.12+)
- A Groq API key → [console.groq.com](https://console.groq.com)
- PostgreSQL 14+ *(optional — SQLite is used automatically if Postgres is unavailable)*

---

## Setup & Running

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd "AIVOA assignment"
```

### 2. Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
# Edit backend/.env and add your Groq API key:
# GROQ_API_KEY=gsk_your_key_here
# DATABASE_URL=postgresql://user:password@localhost:5432/crm_db  (optional)

# Start the server
uvicorn app.main:app --reload --port 8000
```

On startup you will see either:
```
[DB] Connected to PostgreSQL: localhost:5432/crm_db
```
or (if Postgres is not available):
```
[DB] Using SQLite fallback: .../backend/crm_local.db
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**

---

## Project Structure

```
AIVOA assignment/
├── backend/
│   ├── app/
│   │   ├── agent/
│   │   │   ├── graph.py       # LangGraph StateGraph definition
│   │   │   ├── state.py       # AgentState TypedDict
│   │   │   └── tools.py       # 5 LangGraph tools
│   │   ├── api/
│   │   │   ├── stream.py      # SSE streaming endpoint
│   │   │   └── interactions.py# Submit & list interactions
│   │   ├── core/
│   │   │   └── config.py      # Pydantic settings
│   │   ├── db/
│   │   │   ├── database.py    # Engine with Postgres→SQLite fallback
│   │   │   └── models.py      # SQLAlchemy models
│   │   └── main.py            # FastAPI app entry point
│   ├── requirements.txt
│   └── .env                   # Not committed — add your keys here
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── SplitLayout.jsx
│   │   │   ├── FormPanel.jsx  # Read-only AI-populated form
│   │   │   └── ChatPanel.jsx  # SSE chat with AI
│   │   ├── store/
│   │   │   ├── store.js
│   │   │   ├── chatSlice.js
│   │   │   └── formSlice.js
│   │   └── main.jsx
│   └── package.json
└── README.md
```

---

## API Endpoints

| Method | URL | Description |
|---|---|---|
| `POST` | `/api/chat/stream` | SSE stream — send message, receive text + form patches |
| `POST` | `/api/interactions/submit` | Save completed interaction to database |
| `GET` | `/api/interactions` | List all saved interactions |
| `GET` | `/health` | Health check |

---

## Example Prompts to Test All 5 Tools

```
# Tool 1 – log_interaction
"Met Dr. Sarah Khan (Cardiologist) today at 2pm, discussed Metoprolol dosage adjustments, she was very positive about the new trial data."

# Tool 2 – edit_interaction  
"Actually change the sentiment to Neutral"

# Tool 3 – query_hcp_directory
"Can you verify if Dr. Khan is in the directory and her licence is active?"

# Tool 4 – verify_sampling_compliance
"I gave 8 samples of Atorvastatin to Dr. Khan"

# Tool 5 – extract_medical_entities
"Patient reported adverse side effects from the previous prescription during our meeting"
```
