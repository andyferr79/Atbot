from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from firebase_config import db  # ✅ Centralizzato

router = APIRouter()

# ✅ Modelli struttura
class Geo(BaseModel):
    lat: float
    lng: float

class StructureProfile(BaseModel):
    user_id: str
    name: str
    structureType: str
    style: Optional[str]
    description: Optional[str]
    address: str
    city: str
    country: str
    geo: Optional[Geo]
    checkin: Optional[str]
    checkout: Optional[str]
    rules: Optional[List[str]]
    services: Optional[List[str]]
    extraServices: Optional[List[str]]
    animalsAllowed: Optional[bool]
    languages: Optional[List[str]]
    maxGuests: Optional[int]
    rooms: Optional[int]
    preferredContact: Optional[str]
    phoneNumber: Optional[str]
    conventions: Optional[List[str]]
    transports: Optional[List[str]]
    shuttleService: Optional[bool]
    accessibility: Optional[str]
    notes: Optional[str]
    logoUrl: Optional[str]

# ✅ POST - Salva profilo struttura
@router.post("/agent/profile")
async def save_structure_profile(profile: StructureProfile):
    try:
        doc_ref = db.collection("ai_agent_hub").document(profile.user_id).collection("properties").document("main")
        doc_ref.set(profile.dict(exclude={"user_id"}), merge=True)
        return {"message": "✅ Profilo struttura salvato correttamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore salvataggio profilo: {str(e)}")

# ✅ GET - Recupera profilo struttura
@router.get("/agent/profile/{user_id}")
async def get_structure_profile(user_id: str):
    try:
        doc_ref = db.collection("ai_agent_hub").document(user_id).collection("properties").document("main")
        doc = doc_ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Profilo struttura non trovato")
        return doc.to_dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore recupero profilo: {str(e)}")
