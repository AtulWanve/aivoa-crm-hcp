from typing import TypedDict, Annotated, Sequence, List, Dict, Any, Optional
import operator
from langchain_core.messages import BaseMessage

class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], operator.add]
    form_data: Dict[str, Any]
    compliance_warnings: List[str]
