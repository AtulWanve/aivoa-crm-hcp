from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.stream import router as stream_router
from app.api.interactions import router as interactions_router

app = FastAPI(title="AI-First CRM API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stream_router, prefix="/api")
app.include_router(interactions_router, prefix="/api")

@app.get("/health")
def health_check():
    return {"status": "ok"}
