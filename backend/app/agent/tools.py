import json
from langchain_core.tools import tool
from pydantic import BaseModel, Field
from typing import Optional


class LogInteractionInput(BaseModel):
    hcp_name: Optional[str] = Field(None, description="Full name of the Healthcare Professional")
    interaction_date: Optional[str] = Field(None, description="Date of interaction in YYYY-MM-DD or DD-MM-YYYY format")
    interaction_type: Optional[str] = Field(None, description="Type: Meeting, Phone Call, Email, Conference, etc.")
    time: Optional[str] = Field(None, description="Time of interaction e.g. 2:00 PM or 14:00")
    sentiment: Optional[str] = Field(None, description="Classify sentiment as Positive, Neutral, or Negative")
    topics_discussed: Optional[str] = Field(None, description="Summary of the clinical or business topics discussed")
    samples_distributed: Optional[str] = Field(None, description="Details of pharmaceutical samples given (name and quantity)")
    attendees: Optional[str] = Field(None, description="Other attendees present besides the primary HCP")
    materials_shared: Optional[str] = Field(None, description="Brochures, slides or other materials shared")
    follow_up_actions: Optional[str] = Field(None, description="Planned next steps, follow-up visits, or scheduled tasks")
    outcomes: Optional[str] = Field(None, description="Outcomes, adverse events, or notable clinical observations")


@tool("log_interaction", args_schema=LogInteractionInput)
def log_interaction(
    hcp_name: Optional[str] = None,
    interaction_date: Optional[str] = None,
    interaction_type: Optional[str] = None,
    time: Optional[str] = None,
    sentiment: Optional[str] = None,
    topics_discussed: Optional[str] = None,
    samples_distributed: Optional[str] = None,
    attendees: Optional[str] = None,
    materials_shared: Optional[str] = None,
    follow_up_actions: Optional[str] = None,
    outcomes: Optional[str] = None,
) -> str:
    """Captures and structures all HCP interaction data from the user's description to populate the CRM log form. Call this tool with every field you can extract."""
    data = {
        "hcp_name": hcp_name,
        "interaction_date": interaction_date,
        "interaction_type": interaction_type,
        "time": time,
        "sentiment": sentiment,
        "topics_discussed": topics_discussed,
        "samples_distributed": samples_distributed,
        "attendees": attendees,
        "materials_shared": materials_shared,
        "follow_up_actions": follow_up_actions,
        "outcomes": outcomes,
    }
    clean = {k: v for k, v in data.items() if v is not None}
    # Encode as JSON so the state-update node can parse it
    return json.dumps({"__form_update__": clean})


class EditInteractionInput(BaseModel):
    field_name: str = Field(description="The exact JSON key of the field to update (e.g. 'sentiment', 'time')")
    new_value: str = Field(description="The corrected value for that field")


@tool("edit_interaction", args_schema=EditInteractionInput)
def edit_interaction(field_name: str, new_value: str) -> str:
    """Edits a single specific field in the currently logged interaction."""
    return json.dumps({"__form_update__": {field_name: new_value}})


class QueryHCPDirectoryInput(BaseModel):
    search_term: str = Field(description="Name or partial name of the HCP to look up")


@tool("query_hcp_directory", args_schema=QueryHCPDirectoryInput)
def query_hcp_directory(search_term: str) -> str:
    """Looks up an HCP in the directory to verify their name, specialty, and licence status."""
    if "inactive" in search_term.lower():
        return "WARNING: Licence Inactive. Do not log this interaction."
    return f"HCP Found: {search_term} | Licence: Active | Specialty: General Practice"


class VerifySamplingComplianceInput(BaseModel):
    sample_name: str = Field(description="Name of the pharmaceutical sample")
    quantity: int = Field(description="Number of samples distributed")


@tool("verify_sampling_compliance", args_schema=VerifySamplingComplianceInput)
def verify_sampling_compliance(sample_name: str, quantity: int) -> str:
    """Checks whether the proposed sample distribution complies with PDMA regulatory limits (max 5 per interaction)."""
    limit = 5
    if quantity > limit:
        return f"COMPLIANCE VIOLATION: Cannot distribute {quantity} of {sample_name}. Limit is {limit} per interaction."
    return f"Compliant: {quantity} unit(s) of {sample_name} approved for distribution."


class ExtractMedicalEntitiesInput(BaseModel):
    clinical_notes: str = Field(description="The raw clinical notes to parse")


@tool("extract_medical_entities", args_schema=ExtractMedicalEntitiesInput)
def extract_medical_entities(clinical_notes: str) -> str:
    """Parses clinical notes to extract drug names, medical conditions, adverse events, and off-label inquiries."""
    outcomes = ""
    lower = clinical_notes.lower()
    if "adverse" in lower or "side effect" in lower:
        outcomes = "Flagged: Adverse Event / Side Effect discussed."
    if "off-label" in lower or "off label" in lower:
        outcomes += " Off-label use inquiry noted."
    result = outcomes.strip() or "No adverse events or off-label usage detected."
    return json.dumps({"__form_update__": {"outcomes": result}})


tools_list = [
    log_interaction,
    edit_interaction,
    query_hcp_directory,
    verify_sampling_compliance,
    extract_medical_entities,
]
