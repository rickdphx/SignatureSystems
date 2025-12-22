# SignatureSystems - BEN API

Brain-like Emotional Network (BEN) API backend system.

## Problem Fixed
The frontend expects backend responses with a `data.reply` field, but the backend wasn't returning proper JSON structure. This has been fixed.

## AI Integration
The backend now uses OpenAI's GPT-4o-mini model for intelligent conversational responses instead of canned replies. The implementation includes:
- Lazy loading of OpenAI client to minimize memory usage
- Proper proxy configuration for containerized environments
- Graceful error handling with informative fallback messages

### Frontend Expectation (App.jsx line ~346):
```javascript
const benMessage = {
  text: data.reply || 'No response received.',
  sender: 'ben',
};
```

### Backend Response Format:
```json
{
  "reply": "message text here"
}
```

## Installation

```bash
pip install -r requirements.txt
```

## Running the API

### Development Mode
```bash
python3 -m uvicorn ben_api:app --host 127.0.0.1 --port 8000 --reload
```

### Production Mode (Background)
```bash
nohup python3 -m uvicorn ben_api:app --host 127.0.0.1 --port 8000 > /tmp/ben_api.log 2>&1 &
```

### Stop Running Instance
```bash
fuser -k 8000/tcp
```

### Restart API
```bash
fuser -k 8000/tcp && nohup python3 -m uvicorn ben_api:app --host 127.0.0.1 --port 8000 > /tmp/ben_api.log 2>&1 &
```

## API Endpoints

### POST /api/ben
Main endpoint for BEN message processing with AI-powered responses.

**Request:**
```json
{
  "message": "Hello, BEN!",
  "context": {}
}
```

**Response:**
```json
{
  "reply": "Hello! I'm BEN, your Brain-like Emotional Network assistant. How can I help you today?"
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "service": "BEN API",
  "reply": "System is operational"
}
```

### POST /api/execute
Execute Python code in a sandboxed environment with timeout protection.

**Request:**
```json
{
  "code": "print('Hello')\nprint(2 + 2)",
  "language": "python",
  "timeout": 10
}
```

**Response (Success):**
```json
{
  "output": "Hello\n4\n",
  "error": null,
  "success": true
}
```

**Response (Error):**
```json
{
  "output": "(no output)",
  "error": "ZeroDivisionError: division by zero",
  "success": false
}
```

## Testing

```bash
# Test health endpoint
curl http://127.0.0.1:8000/health

# Test BEN message endpoint
curl -X POST http://127.0.0.1:8000/api/ben \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, BEN!"}'
```

## Key Features

- ✅ **AI-Powered Responses**: Integrated with OpenAI GPT-4o-mini for intelligent conversations
- ✅ **Code Execution**: Sandboxed Python code execution with timeout protection
- ✅ Returns proper JSON with `reply` field
- ✅ CORS enabled for frontend integration
- ✅ Error handling with consistent response format
- ✅ Logging for debugging
- ✅ Health check endpoints
- ✅ FastAPI with Pydantic validation
- ✅ Memory-optimized with lazy-loading AI client

## Deployment

The API is designed to work with:
- **Backend:** Runs on port 8000
- **Frontend:** signaturebrain.com/admin
- **Frontend Build:** /home/ubuntu/signaturebrain-frontend/build/

## Next Steps

1. Install dependencies: `pip install -r requirements.txt`
2. Run the API: `python3 -m uvicorn ben_api:app --host 127.0.0.1 --port 8000`
3. Test at signaturebrain.com/admin
4. Integrate actual BEN processing logic in the `process_ben_message` function
