# Weekend Planner AI Agent

An intelligent family weekend activity planner powered by Google Gemini 2.5 Flash and Google ADK (Agent Development Kit). This multi-agent system researches weather conditions and suggests personalized activities for families with children.

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
WeekendPlanner/
├── __init__.py           # Package initialization
├── agent.py              # Main agent definitions and orchestration
└── evalsetf78523.evalset.json  # Test evaluation data
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
cd AIAgentCourse
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
   - Configure the `GEMINI_API_KEY` environment variable

## Usage

### Running the Agent

```python
from WeekendPlanner import agent

# The root_agent is exposed as 'agent'
# Use with Google ADK CLI or programmatically
result = agent.run(
    weather_forecast="sunny",
    kid_ages="5-8",
    zip_code="10001"
)
```

### Agent Architecture

The system uses a multi-agent hierarchy:

1. **Weather Agent**: Checks weather conditions
2. **Weather Router**: Routes to appropriate activity planning based on weather
3. **Activity Research Group** (runs when weather is good):
   - Local Activities Agent: Finds nearby activities
   - Special Events Agent: Discovers festivals and events
4. **Home Activities Agent**: Suggests indoor activities when weather is poor
5. **Summarizer Agent**: Consolidates findings into recommendations

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

## Disclaimer

Results are based on AI agent research and should be verified for accuracy and availability before planning.

## License

[Add your license here]

## Contributing

[Add contribution guidelines]

## Support

For issues or questions, please open an issue on GitHub.
