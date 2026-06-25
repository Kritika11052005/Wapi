#input_type_name: PersistInput
#output_type_name: PersistResult
#function_name: persist

from pydantic import BaseModel
from lemma_sdk import FunctionContext, Pod

class PersistInput(BaseModel):
    business_id: str
    customer_id: str
    intent_score: float
    estimated_value: int
    action: str
    escalate_reason: str = None

class PersistResult(BaseModel):
    success: bool

async def persist(ctx: FunctionContext, data: PersistInput) -> PersistResult:
    pod = Pod.from_env()
    status = "escalated" if data.action == "escalate" else "open"
    
    row = {
        "business_id": data.business_id,
        "customer_id": data.customer_id,
        "intent_score": data.intent_score,
        "estimated_value": data.estimated_value,
        "status": status
    }
    if data.escalate_reason:
        row["escalation_reason"] = data.escalate_reason
        
    pod.table("conversations").create(row)
    return PersistResult(success=True)
