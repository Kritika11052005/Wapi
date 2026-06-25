#input_type_name: PreprocessInput
#output_type_name: PreprocessResult
#function_name: preprocess

from pydantic import BaseModel
from lemma_sdk import FunctionContext, Pod

class PreprocessInput(BaseModel):
    message: str

class PreprocessResult(BaseModel):
    cleanedEnglishQuery: str
    detectedLanguage: str
    isGibberishOrNoise: bool

async def preprocess(ctx: FunctionContext, data: PreprocessInput) -> PreprocessResult:
    raw_message = data.message
    if not raw_message or not raw_message.strip():
        return PreprocessResult(cleanedEnglishQuery="", detectedLanguage="English", isGibberishOrNoise=False)
    
    return PreprocessResult(
        cleanedEnglishQuery=raw_message, 
        detectedLanguage="English", 
        isGibberishOrNoise=False
    )
