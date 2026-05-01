import uuid
from sqlalchemy import Column, String, Integer, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy import TypeDecorator, String as SAString
import datetime
from app.db.database import Base, engine


# UUID column that works on both PostgreSQL and SQLite
class PortableUUID(TypeDecorator):
    """Stores UUID as native UUID on Postgres, as VARCHAR(36) on SQLite."""
    impl = SAString(36)
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        return str(value)

    def process_result_value(self, value, dialect):
        return value


class HCPProfile(Base):
    __tablename__ = "hcp_profiles"
    id           = Column(PortableUUID, primary_key=True, default=lambda: str(uuid.uuid4()))
    first_name   = Column(String(100), nullable=False)
    last_name    = Column(String(100), nullable=False)
    specialty    = Column(String(200), nullable=True)
    license_status = Column(String(50), default="Active")
    clinic_address = Column(Text, nullable=True)


class InteractionLog(Base):
    __tablename__ = "interaction_logs"
    id                 = Column(PortableUUID, primary_key=True, default=lambda: str(uuid.uuid4()))
    hcp_name           = Column(String(200), nullable=True)
    interaction_date   = Column(String(50),  nullable=True)
    interaction_type   = Column(String(100), nullable=True)
    time               = Column(String(50),  nullable=True)
    sentiment          = Column(String(50),  nullable=True)
    topics_discussed   = Column(Text,        nullable=True)
    samples_distributed= Column(String(200), nullable=True)
    attendees          = Column(String(200), nullable=True)
    materials_shared   = Column(String(200), nullable=True)
    follow_up_actions  = Column(Text,        nullable=True)
    outcomes           = Column(Text,        nullable=True)
    submitted_at       = Column(DateTime,    default=datetime.datetime.utcnow)


class SampleInventory(Base):
    __tablename__ = "sample_inventory"
    id                        = Column(PortableUUID, primary_key=True, default=lambda: str(uuid.uuid4()))
    product_name              = Column(String(200), nullable=False)
    max_samples_per_interaction = Column(Integer, default=5)


# Auto-create all tables on startup (works for both Postgres & SQLite)
Base.metadata.create_all(bind=engine)
