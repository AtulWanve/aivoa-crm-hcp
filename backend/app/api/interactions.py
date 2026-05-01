import datetime
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from app.db.database import SessionLocal
from app.db.models import InteractionLog  # triggers create_all

router = APIRouter()


class InteractionSubmitRequest(BaseModel):
    hcp_name:            Optional[str] = None
    interaction_date:    Optional[str] = None
    interaction_type:    Optional[str] = None
    time:                Optional[str] = None
    sentiment:           Optional[str] = None
    topics_discussed:    Optional[str] = None
    samples_distributed: Optional[str] = None
    attendees:           Optional[str] = None
    materials_shared:    Optional[str] = None
    follow_up_actions:   Optional[str] = None
    outcomes:            Optional[str] = None


@router.post("/interactions/submit")
async def submit_interaction(data: InteractionSubmitRequest):
    db = SessionLocal()
    try:
        record = InteractionLog(
            hcp_name=data.hcp_name,
            interaction_date=data.interaction_date,
            interaction_type=data.interaction_type,
            time=data.time,
            sentiment=data.sentiment,
            topics_discussed=data.topics_discussed,
            samples_distributed=data.samples_distributed,
            attendees=data.attendees,
            materials_shared=data.materials_shared,
            follow_up_actions=data.follow_up_actions,
            outcomes=data.outcomes,
            submitted_at=datetime.datetime.utcnow(),
        )
        db.add(record)
        db.commit()
        db.refresh(record)

        return {
            "success": True,
            "message": f"Interaction with {data.hcp_name or 'HCP'} successfully saved to CRM.",
            "record_id": record.id,
            "data": {c.key: getattr(record, c.key) for c in record.__table__.columns
                     if getattr(record, c.key) is not None},
        }
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


@router.get("/interactions")
async def list_interactions():
    db = SessionLocal()
    try:
        rows = db.query(InteractionLog).order_by(InteractionLog.submitted_at.desc()).all()
        return {
            "count": len(rows),
            "interactions": [
                {c.key: getattr(r, c.key) for c in r.__table__.columns}
                for r in rows
            ],
        }
    finally:
        db.close()
