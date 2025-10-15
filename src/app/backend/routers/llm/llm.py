from fastapi.responses import StreamingResponse
from fastapi import APIRouter, HTTPException, UploadFile, File
from openai import OpenAI
from datetime import datetime
from schemas import ChatRequest
from database import database
from helpers import ConversationManager
from .tooling import LLMTooling# chunk_and_embed, read_pdf
from typing import List

router = APIRouter()

class LLM:
    def __init__(self, model_id: str, hf_token: str, tooling: LLMTooling = None):
        self.model_id = model_id
        self.client = OpenAI(
            base_url="https://router.huggingface.co/v1",
            api_key=hf_token,
        )
        self.tooling = tooling
        
    async def generate_conversation_title(self, conversation_snippet: str) -> str:
        messages = [
            {
                "role": "system",
                "content": "You are an assistant that creates short, descriptive titles for conversations."
            },
            {
                "role": "user",
                "content": f"Generate a concise title for this conversation: {conversation_snippet}"
            }
        ]
            
        response = self.client.chat.completions.create(
            model=self.model_id,
            messages=messages,
            max_tokens=12,
        )
            
        return response.choices[0].message.content.strip()
    
    async def stream_response(self, messages: list[dict]):
        last_user_input = messages[-1]["content"] if messages else ""
        if self.tooling:
            context = await self.tooling.handle_input(last_user_input)
            if context:
                messages.append({
                    "role": "system",
                    "content": context,
                })


        stream = self.client.chat.completions.create(
            model=self.model_id,
            messages=messages,
            stream=True,
            )
        assistant_message = {"role": "assistant", "content": ""}
            
        for chunk in stream:
            if not getattr(chunk, "choices", None):
                continue
            if len(chunk.choices) == 0:
                continue
            delta = getattr(chunk.choices[0].delta, "content", None)
            if delta:
                assistant_message["content"] += delta
                yield delta


async def try_generate_title(conversation_id: str, llm: LLM, messages: list[dict]):
    if not messages:
        return

    first_user_message = messages[0]["content"]
    conversation_record = await database.fetch_one(
        "SELECT title FROM conversations WHERE id = :id",
        {"id": conversation_id}
    )

    if conversation_record and conversation_record["title"] is None:
        title = await llm.generate_conversation_title(first_user_message)
        await database.execute(
            """
            UPDATE conversations SET title = :title, updated_at = :updated_at WHERE id = :id
            """,
            {"title": title, "updated_at": datetime.utcnow(), "id": conversation_id}
        )

async def build_llm_memory(manager: ConversationManager, recent_n: int = 20):
    """
    Returns a list of messages ready to feed into the LLM:
    - Prepends a system message with context of the last recent_n messages.
    """
    await manager.load()
    
    # Grab last N messages
    recent_messages = manager.messages[-recent_n:]
    
    # Flatten into LLM chat format
    llm_messages = []
    for m in recent_messages:
        llm_messages.append({
            "role": m.role,
            "content": m.message.get("content", "")
        })
    
    # Optional: prepend a system message that gives context
    system_prompt = "You are an assistant aware of the recent conversation context with the user."
    llm_messages.insert(0, {"role": "system", "content": system_prompt})
    
    return llm_messages

@router.post("/chat/stream")
async def chat_stream(req: ChatRequest, conversation_id: str):
    async def event_generator():
        # --- Fetch user_id from conversation record ---
        conversation_record = await database.fetch_one(
            "SELECT user_id FROM conversations WHERE id = :conversation_id",
            {"conversation_id": conversation_id}
        )
        if not conversation_record:
            raise HTTPException(status_code=404, detail="Conversation not found")
        internal_user_id = conversation_record["user_id"]

        # --- Load ephemeral memory ---
        manager = ConversationManager(conversation_id, internal_user_id)
        memory_snapshot = await manager.get_memory_snapshot(recent_n=20)
        conversation = memory_snapshot + [m.dict() for m in req.conversation]

        # --- Instantiate LLM with tooling ---
        tooling = LLMTooling()
        # Add other tools like vector DB or RAG later as needed

        llm = LLM(model_id=req.modelId, hf_token=req.hfToken, tooling=tooling)

        # --- Attempt to generate title ---
        await try_generate_title(conversation_id, llm, conversation)

        # --- Inject dynamic system message for current date ---
        last_user_input = conversation[-1]["content"] if conversation else ""
        if "current date" in last_user_input.lower() or "today" in last_user_input.lower():
            conversation.append({
                "role": "system",
                "content": f"The current date is {datetime.now().strftime('%B %d, %Y')}.",
            })

        # --- Stream the assistant response ---
        async for delta in llm.stream_response(conversation):
            yield delta

    return StreamingResponse(event_generator(), media_type="text/plain")

vector_store = {}

@router.post("/consume")
async def consume_files(files: List[UploadFile] = File(...)):
    received_files = []

    for file in files:
        # You can keep PDF/text detection if needed
        if file.filename.endswith((".pdf", ".md")):
            # Optional: just read raw bytes or text for logging
            _ = await file.read()  
        else:
            _ = await file.read()
        
        received_files.append(file.filename)
        # Optionally store raw bytes just for verification
        vector_store[file.filename] = b"<file received>"