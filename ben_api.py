from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="BEN API", description="Brain-like Emotional Network API")

# Configure CORS to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class MessageRequest(BaseModel):
    """Request model for BEN messages"""
    message: str
    context: Optional[dict] = None


class MessageResponse(BaseModel):
    """Response model - must include 'reply' field for frontend"""
    reply: str


@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "online", "service": "BEN API"}


@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "service": "BEN API",
        "reply": "System is operational"
    }


@app.post("/api/ben", response_model=MessageResponse)
async def process_ben_message(request: MessageRequest):
    """
    Process BEN system messages and return response with 'reply' field.

    This endpoint ensures the response format matches frontend expectations:
    {"reply": "message text here"}
    """
    try:
        logger.info(f"Received message: {request.message}")

        # Process the message (placeholder logic)
        # TODO: Integrate actual BEN processing logic here
        user_message = request.message.strip()

        # Generate response
        if not user_message:
            response_text = "I didn't receive a message. Please try again."
        else:
            # Placeholder response logic
            response_text = f"BEN received: {user_message}. Processing your request..."

            # Add context-aware responses
            if "hello" in user_message.lower() or "hi" in user_message.lower():
                response_text = "Hello! I'm BEN, your Brain-like Emotional Network assistant. How can I help you today?"
            elif "help" in user_message.lower():
                response_text = "I'm here to assist you. You can ask me questions or share your thoughts, and I'll do my best to provide helpful responses."
            elif "status" in user_message.lower():
                response_text = "BEN system is operational and ready to assist you."

        logger.info(f"Sending reply: {response_text}")

        # Return response in the format frontend expects: {"reply": "text"}
        return MessageResponse(reply=response_text)

    except Exception as e:
        logger.error(f"Error processing message: {str(e)}")
        # Even in error cases, return proper JSON format with 'reply' field
        return MessageResponse(reply=f"An error occurred while processing your message. Please try again.")


@app.post("/chat")
async def chat_endpoint(request: MessageRequest):
    """
    Alternative chat endpoint - also returns 'reply' field
    """
    return await process_ben_message(request)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
