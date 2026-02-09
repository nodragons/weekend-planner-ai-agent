# Weekend Planner AI Agent

An intelligent family weekend activity planner powered by Google Gemini 2.5 Flash and Google ADK (Agent Development Kit). This multi-agent system researches weather conditions and suggests personalized activities for families with children. This is Kaggle Capstone project for Nov 2025 AI Agents Intensive.

## Features

- **Weather-Aware Planning**: Checks weekend weather forecasts for your area
- **Smart Activity Routing**: Routes to outdoor or indoor activities based on weather
- **Personalized Recommendations**: Finds activities tailored to children's ages
- **Local Search Integration**: Uses Google Search to find real-time activities and events
- **Activity Categories**:
  - Local community activities
  - Special events (festivals, fairs, concerts)
  - Indoor at-home activities for bad weather

## Project Structure

```
AIAgentCourse/
├── WeekendPlanner/          # Backend multi-agent system
│   ├── __init__.py          # Package initialization
│   └── agent.py             # Main agent definitions and orchestration
├── frontend/                # Vue.js frontend application
│   ├── src/
│   │   ├── components/      # Vue components
│   │   ├── services/        # ADK API client
│   │   ├── App.vue          # Root component
│   │   └── main.js          # Vue initialization
│   ├── package.json
│   └── vite.config.js
├── requirements.txt         # Python dependencies
└── README.md
```

## Installation

### Prerequisites
- Python 3.10+
- Google API credentials (for Gemini 2.5 Flash)
- Google ADK installed

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd WeekendPlanner
```

2. Create and activate a virtual environment:
```bash
python3 -m venv .venv
source .venv/bin/activate  # On macOS/Linux
# or
.venv\Scripts\activate  # On Windows
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Configure Google ADK:
   - Set up your Google Cloud credentials
   - Configure the GOOGLE_API_KEY="your-key-here" environment variable
   -   run this comment "echo 'GOOGLE_API_KEY="your_api_key_here"' > .env"

## Usage

### Running the Backend (ADK)

Start the ADK backend server:

```bash
# Make sure virtual environment is activated
source .venv/bin/activate  # macOS/Linux

# Start ADK web server on port 8000
adk web
```

The ADK backend provides a REST API that the frontend connects to.

### Running the Frontend

The project includes a custom Vue.js frontend with a form-based interface optimized for weekend planning.

1. **First time setup** - Install frontend dependencies:
```bash
cd frontend
npm install
```

2. **Start the development server**:
```bash
# Make sure you're in the frontend directory
npm run dev
```

This starts Vite dev server on `http://localhost:5173`

3. **Open in browser**:
   - Navigate to `http://localhost:5173`
   - Enter zip code and kids' ages
   - Click "Plan My Weekend" to see agent-by-agent streaming results

**Note**: Both backend (port 8000) and frontend (port 5173) must be running simultaneously. The frontend proxies API requests to the backend.

### Using the ADK Web Interface (Alternative)

You can also use the generic ADK chat interface:

```bash
adk web
```

Then visit `http://localhost:8000` and interact via chat.

### Agent Architecture

The system uses a multi-agent hierarchy:

0. **Input Parser**: Checks user input
1. **Weather Agent**: Checks weather conditions
2. **Weather Router**: Routes to appropriate activity planning based on weather
3. **Activity Research Group** (runs when weather is good):
   - Local Activities Agent: Finds nearby activities
   - Special Events Agent: Discovers festivals and events
4. **Home Activities Agent**: Suggests indoor activities when weather is poor
5. **Summarizer Agent**: Consolidates findings into recommendations

<img width="1166" height="281" alt="image" src="https://github.com/user-attachments/assets/ffb99c93-5deb-4170-bd32-609363e30fe6" />


## Configuration

Key agents use `gemini-2.5-flash` model. Customize by modifying:
- `model` parameter in agent definitions
- `instruction` prompts for different agent behaviors
- Tool selection (currently uses Google Search)

## Output

The system generates a concise, bulleted summary with:
- Area and weather information
- Child ages
- 3-5 key activity recommendations
- Disclaimer about AI-generated results

Sample output

<img width="689" height="359" alt="image" src="https://github.com/user-attachments/assets/e40ef150-2971-473c-ae3b-5fa124dd8d4e" />

<img width="679" height="397" alt="image" src="https://github.com/user-attachments/assets/82c96902-fbbb-41cc-b9b5-36b6fbd4758d" />

<img width="686" height="437" alt="image" src="https://github.com/user-attachments/assets/c58a1a5d-71ee-4321-bd9a-49ca7d4e72b8" />


## Frontend Features

The Vue.js frontend provides:

- **Form-Based Input**: Clean UI with zip code and kids ages inputs
- **Real-Time Streaming**: Watch each agent respond as they process
- **Agent Visualization**: See the full agent pipeline in action:
  - 📋 Input Processing
  - 🌤️ Weather Check
  - 🔀 Planning Router
  - 🎯 Local Activities
  - 🎉 Special Events
  - 🏠 Home Activities (bad weather only)
  - 📝 Final Summary
- **Error Handling**: Clear error messages with retry functionality
- **Responsive Design**: Works on desktop and mobile devices

## Development

### Frontend Development

The frontend uses:
- **Vue 3** with Composition API
- **Vite** for fast development and builds
- **Vanilla CSS** for styling (no external UI frameworks)

Key files:
- `frontend/src/services/adkClient.js` - ADK API integration with SSE streaming
- `frontend/src/components/PlannerForm.vue` - Input form component
- `frontend/src/components/StreamingResults.vue` - Results display
- `frontend/src/components/AgentOutput.vue` - Individual agent message card

To build for production:
```bash
cd frontend
npm run build
```

Output will be in `frontend/dist/` for static hosting.

## Support

For issues or questions, please open an issue on GitHub.
