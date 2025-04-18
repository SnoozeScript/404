"""
Multi-Agent System for FarmGenius
This module implements a multi-agent system architecture that coordinates specialized agents
for crop disease detection, yield prediction, market analysis, and voice interactions.
"""
import asyncio
from typing import Dict, List, Any, Optional, Callable, Union
import logging
from enum import Enum
from dataclasses import dataclass
import json

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AgentType(Enum):
    """Types of specialized agents in the system"""
    COORDINATOR = "coordinator"
    DISEASE_DETECTOR = "disease_detector"
    YIELD_PREDICTOR = "yield_predictor"
    MARKET_ANALYZER = "market_analyzer"
    VOICE_ASSISTANT = "voice_assistant"
    TRANSLATOR = "translator"
    CHAT_ASSISTANT = "chat_assistant"

@dataclass
class Message:
    """Message object for inter-agent communication"""
    sender: AgentType
    receiver: AgentType
    content: Any
    message_type: str
    context: Dict[str, Any] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert message to dictionary"""
        return {
            "sender": self.sender.value,
            "receiver": self.receiver.value,
            "content": self.content,
            "message_type": self.message_type,
            "context": self.context or {}
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Message':
        """Create message from dictionary"""
        return cls(
            sender=AgentType(data["sender"]),
            receiver=AgentType(data["receiver"]),
            content=data["content"],
            message_type=data["message_type"],
            context=data.get("context", {})
        )

class Agent:
    """Base agent class with common functionality"""
    
    def __init__(self, agent_type: AgentType, coordinator: 'AgentCoordinator' = None):
        self.agent_type = agent_type
        self.coordinator = coordinator
        self.message_handlers: Dict[str, Callable] = {}
        
    async def handle_message(self, message: Message) -> Optional[Message]:
        """Process incoming message and optionally return a response"""
        if message.message_type in self.message_handlers:
            return await self.message_handlers[message.message_type](message)
        else:
            logger.warning(f"Agent {self.agent_type.value} has no handler for message type {message.message_type}")
            return None
            
    def register_handler(self, message_type: str, handler: Callable):
        """Register a handler for a specific message type"""
        self.message_handlers[message_type] = handler
        
    async def send_message(self, receiver: AgentType, content: Any, message_type: str, context: Dict[str, Any] = None) -> Optional[Message]:
        """Send message to another agent via coordinator"""
        if self.coordinator:
            message = Message(
                sender=self.agent_type,
                receiver=receiver,
                content=content,
                message_type=message_type,
                context=context
            )
            return await self.coordinator.route_message(message)
        else:
            logger.error(f"Agent {self.agent_type.value} has no coordinator to send messages")
            return None

class AgentCoordinator:
    """Central coordinator for managing agent communication"""
    
    def __init__(self):
        self.agents: Dict[AgentType, Agent] = {}
        self.message_queue = asyncio.Queue()
        self.running = False
        
    def register_agent(self, agent: Agent):
        """Register an agent with the coordinator"""
        agent.coordinator = self
        self.agents[agent.agent_type] = agent
        logger.info(f"Registered agent: {agent.agent_type.value}")
        
    async def route_message(self, message: Message) -> Optional[Message]:
        """Route a message to the appropriate agent"""
        if message.receiver not in self.agents:
            logger.error(f"No agent registered for type: {message.receiver.value}")
            return None
            
        try:
            logger.debug(f"Routing message: {message.sender.value} -> {message.receiver.value} ({message.message_type})")
            return await self.agents[message.receiver].handle_message(message)
        except Exception as e:
            logger.error(f"Error routing message: {e}")
            return None
            
    async def broadcast_message(self, sender: AgentType, content: Any, message_type: str, context: Dict[str, Any] = None) -> List[Message]:
        """Send a message to all agents except the sender"""
        responses = []
        for agent_type, agent in self.agents.items():
            if agent_type != sender:
                message = Message(
                    sender=sender,
                    receiver=agent_type,
                    content=content,
                    message_type=message_type,
                    context=context
                )
                response = await agent.handle_message(message)
                if response:
                    responses.append(response)
        return responses
        
    async def start(self):
        """Start processing messages from the queue"""
        self.running = True
        logger.info("Agent coordinator started")
        
    async def stop(self):
        """Stop the coordinator"""
        self.running = False
        logger.info("Agent coordinator stopped")

class ModelContextProtocol:
    """
    Protocol for maintaining context between agent interactions.
    This allows agents to share a common understanding of the conversation state.
    """
    
    def __init__(self):
        self.contexts: Dict[str, Any] = {}
        
    def set_context(self, context_id: str, data: Any):
        """Set context data for a specific ID"""
        self.contexts[context_id] = data
        
    def get_context(self, context_id: str) -> Optional[Any]:
        """Get context data for a specific ID"""
        return self.contexts.get(context_id)
        
    def update_context(self, context_id: str, data: Dict[str, Any]):
        """Update existing context with new data"""
        if context_id in self.contexts:
            if isinstance(self.contexts[context_id], dict):
                self.contexts[context_id].update(data)
            else:
                logger.warning(f"Cannot update non-dict context: {context_id}")
        else:
            self.set_context(context_id, data)
            
    def clear_context(self, context_id: str):
        """Clear context for a specific ID"""
        if context_id in self.contexts:
            del self.contexts[context_id]

# Create global instances for use across the application
coordinator = AgentCoordinator()
context_protocol = ModelContextProtocol()

# Example usage
"""
# Create and register agents
disease_agent = DiseaseDetectorAgent()
coordinator.register_agent(disease_agent)

# Set up context for a user session
session_id = "user123"
context_protocol.set_context(session_id, {
    "language": "mr",  # Marathi
    "location": "Baramati"
})

# Send a message from one agent to another
response = await disease_agent.send_message(
    receiver=AgentType.MARKET_ANALYZER,
    content="What's the current price of wheat?",
    message_type="query",
    context={"session_id": session_id}
)
"""
