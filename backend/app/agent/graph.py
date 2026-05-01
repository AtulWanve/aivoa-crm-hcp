import json
from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import ToolNode, tools_condition
from langchain_groq import ChatGroq
from app.agent.state import AgentState
from app.agent.tools import tools_list
from app.core.config import settings

# LLM
llm = ChatGroq(model="llama-3.3-70b-versatile", api_key=settings.groq_api_key, temperature=0.1)
llm_with_tools = llm.bind_tools(tools_list)

SYSTEM_PROMPT = (
    "You are an AI assistant for a pharmaceutical CRM system, helping field representatives log HCP (Healthcare Professional) interactions. "
    "When the user describes an interaction, ALWAYS call the `log_interaction` tool to extract and populate the form fields. "
    "Extract every piece of information you can: name, date, time, sentiment, topics, samples, attendees, materials, follow-up actions, and outcomes. "
    "After calling tools, give a friendly confirmation summary. "
    "If the user mentions compliance or samples, also call `verify_sampling_compliance`. "
    "Never ask the user to fill fields manually."
)

def agent_node(state: AgentState):
    messages = list(state.get("messages", []))
    # Inject system prompt at front if not present
    if not messages or getattr(messages[0], "type", None) != "system":
        from langchain_core.messages import SystemMessage
        messages = [SystemMessage(content=SYSTEM_PROMPT)] + messages
    response = llm_with_tools.invoke(messages)
    return {"messages": [response]}


def state_updater_node(state: AgentState):
    """After tools run, scan the latest tool messages for __form_update__ payloads and merge them into form_data."""
    messages = list(state.get("messages", []))
    form_data = dict(state.get("form_data", {}))

    for msg in reversed(messages):
        # ToolMessage has type "tool"
        if getattr(msg, "type", None) == "tool":
            try:
                payload = json.loads(msg.content)
                if isinstance(payload, dict) and "__form_update__" in payload:
                    form_data.update(payload["__form_update__"])
            except (json.JSONDecodeError, AttributeError):
                pass

    return {"form_data": form_data}


# Build Graph
graph_builder = StateGraph(AgentState)
graph_builder.add_node("agent", agent_node)
graph_builder.add_node("tools", ToolNode(tools=tools_list))
graph_builder.add_node("state_updater", state_updater_node)

# Edges
graph_builder.add_edge(START, "agent")
graph_builder.add_conditional_edges("agent", tools_condition)
graph_builder.add_edge("tools", "state_updater")
graph_builder.add_edge("state_updater", "agent")

graph = graph_builder.compile()
