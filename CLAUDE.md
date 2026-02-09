# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a multi-agent AI system built with Google ADK (Agent Development Kit) and Gemini 2.5 Flash. The Weekend Planner agent helps families find weekend activities based on weather conditions and children's ages.

## Development Commands

### Environment Setup
```bash
# Create virtual environment
python3 -m venv .venv

# Activate virtual environment
source .venv/bin/activate  # macOS/Linux
.venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt
```

### API Configuration
Set up environment variables in `.env`:
```bash
echo 'GOOGLE_API_KEY="your_api_key_here"' > .env
```

### Running the Backend
```bash
# Start the ADK web interface (REST API on port 8000)
adk web
```

### Running the Frontend
```bash
# Install dependencies (first time only)
cd frontend
npm install

# Start Vite dev server (port 5173)
npm run dev

# Build for production
npm run build
```

**Important**: Both backend and frontend must run simultaneously for the full application.

### Development Tools
```bash
# Format code
black WeekendPlanner/

# Lint code
flake8 WeekendPlanner/

# Run tests
pytest
```

## Architecture

### Multi-Agent System Design

The system uses a **hierarchical agent architecture** with conditional routing:

1. **PreprocessInputAgent** (`preprocess_agent`): Extracts and validates user input (zip code and children's ages). Defaults to zip_code="90120" and kid_ages="5,8" if invalid. Outputs structured JSON to `parsed_input`.

2. **WeatherAgent** (`weather_agent`): Checks weekend weather forecast for the provided zip code using Google Search. Outputs one of three states: "good", "bad", or "do not leave home" to `weather_forecast`.

3. **WeatherRouter** (`weather_router_agent`): **Critical routing logic** - uses `AgentTool` to conditionally invoke either:
   - `home_activities_agent` if weather is "do not leave home"
   - `activity_research_group` (sequential group) otherwise

4. **Activity Research Group** (`research_group`): A `SequentialAgent` that runs two sub-agents in order:
   - `local_activities_agent`: Finds local family activities
   - `special_events_agent`: Finds festivals, fairs, concerts

5. **HomeActivitiesAgent** (`home_activities_agent`): Suggests indoor, no-cost at-home activities for bad weather.

6. **SummarizerAgent** (`summarizer_agent`): Consolidates all research findings into a bulleted summary with weather context and disclaimers.

### Key Architectural Patterns

**Agent Tool Usage**: When one agent needs to invoke another agent or agent group, use `AgentTool` wrapper:
```python
tools=[
    AgentTool(some_agent),
    AgentTool(some_agent_group)
]
```

**Variable Interpolation**: Agents use curly brace syntax to access outputs from previous agents:
- `{parsed_input.zip_code}` - accesses nested fields
- `{weather_forecast}` - accesses direct outputs
- `[[local_activities_findings]]` - double brackets for optional fields

**Output Keys**: Each agent must define an `output_key` to make its results available to downstream agents. These keys create a shared context dictionary.

**Sequential vs Conditional Execution**:
- `SequentialAgent`: Runs sub-agents in order unconditionally
- Router pattern: Uses an agent with `AgentTool` to make runtime decisions

### Root Agent Flow

The `root_agent` is a `SequentialAgent` that executes:
```
PreprocessInputAgent → WeatherAgent → WeatherRouter → SummarizerAgent
```

The WeatherRouter internally routes to either HomeActivitiesAgent OR ActivityResearchGroup based on weather conditions.

## Project Structure

```
AIAgentCourse/
├── WeekendPlanner/
│   ├── __init__.py          # Package exports
│   ├── agent.py             # All agent definitions and orchestration
│   └── evalset*.json        # Evaluation datasets (gitignored)
├── frontend/                 # Vue.js frontend application
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── PlannerForm.vue         # Zip code + ages inputs
│   │   │   ├── AgentOutput.vue         # Single agent message card
│   │   │   └── StreamingResults.vue    # Container for all outputs
│   │   ├── services/
│   │   │   └── adkClient.js            # ADK API client with SSE streaming
│   │   ├── App.vue                      # Root component
│   │   └── main.js                      # Vue app initialization
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── .env.development
├── requirements.txt
└── README.md
```

**Backend**: All agents are defined in a single file (`agent.py`) with the root agent exposed as `agent` for ADK to discover.

**Frontend**: Vue.js SPA that connects to ADK's REST API for session management and streaming agent execution.

## Important Implementation Notes

- All agents use `gemini-2.5-flash` model
- Google Search is the only external tool (via `google_search_tool`)
- The WeatherRouter agent's conditional logic is the key to the architecture
- Input validation happens upfront with sensible defaults
- Output format is always user-friendly bulleted summaries with disclaimers

## Frontend Architecture

### API Integration

The frontend connects to ADK's FastAPI backend via two endpoints:

1. **Session Creation**: `POST /apps/WeekendPlanner/users/{userId}/sessions`
   - Creates a new session for maintaining context
   - Returns `session_id` for subsequent requests

2. **Agent Execution**: `POST /run_sse`
   - Sends user message with Server-Sent Events (SSE) streaming
   - Returns real-time agent outputs as they process
   - Request format:
     ```javascript
     {
       app_name: "WeekendPlanner",
       user_id: "<userId>",
       session_id: "<sessionId>",
       new_message: {
         role: "user",
         parts: [{ text: "90210 kids are 5 and 8" }]
       },
       streaming: true
     }
     ```

### SSE Event Structure

Each agent response comes as an SSE event:
```javascript
data: {
  "author": "preprocess_agent",
  "content": {
    "role": "model",
    "parts": [{ "text": "Agent output text..." }]
  }
}
```

The frontend extracts `event.author` (agent name) and `event.content.parts[0].text` (response text) to display in the UI.

### Component Hierarchy

```
App.vue (session management, orchestration)
├── PlannerForm.vue (user input)
└── StreamingResults.vue (results container)
    └── AgentOutput.vue (individual agent messages)
```

### Development Notes

- Vite proxy configuration handles CORS by proxying `/apps` and `/run_sse` to `localhost:8000`
- Session is created on app mount and reused for all submissions
- SSE parsing uses `fetch()` with streaming reader (not `EventSource`) to support POST requests
- Error handling includes session creation failures, network errors, and agent execution errors
