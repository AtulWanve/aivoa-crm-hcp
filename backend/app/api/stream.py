import json
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Any
from app.agent.graph import graph

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    history: List[Dict[str, Any]] = []


def sse_event(event_type: str, data: str) -> str:
    """Format a proper SSE event string."""
    # Escape data lines (each line must be prefixed with 'data: ')
    data_lines = "\n".join(f"data: {line}" for line in data.split("\n"))
    return f"event: {event_type}\n{data_lines}\n\n"


@router.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    async def event_generator():
        messages = request.history + [{"role": "user", "content": request.message}]
        initial_state = {
            "messages": messages,
            "form_data": {},
            "compliance_warnings": [],
        }

        last_form_data = {}

        try:
            async for event in graph.astream_events(initial_state, version="v2"):
                kind = event["event"]
                name = event.get("name", "")

                # ── Stream LLM text chunks ──────────────────────────────────
                if kind == "on_chat_model_stream":
                    chunk = event["data"].get("chunk")
                    if chunk and hasattr(chunk, "content") and chunk.content:
                        yield sse_event("text_chunk", chunk.content)

                # ── Capture state_updater on_chain_end ──────────────────────
                if kind == "on_chain_end" and name == "state_updater":
                    output = event["data"].get("output", {})
                    new_form_data = output.get("form_data", {})
                    diff = {k: v for k, v in new_form_data.items() if v != last_form_data.get(k)}
                    if diff:
                        last_form_data.update(diff)
                        print(f"[STREAM] Emitting state_patch: {diff}")
                        yield sse_event("state_patch", json.dumps({"form_data": new_form_data}))

        except Exception as e:
            import traceback
            traceback.print_exc()
            yield sse_event("error", str(e))

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
