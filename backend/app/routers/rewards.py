"""Rewards system endpoints"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.models import User, Reward
from app.schemas import RewardSubmit, RewardResponse
from app.routers.auth import get_current_user

router = APIRouter()

# Configurazione rewards
STEPS_GOAL = 7000
MAX_EURO = 20

def calculate_wblu(steps: int) -> float:
    """Calcola WBLU da numero di passi"""
    wblu_per_step = MAX_EURO / STEPS_GOAL
    return min(MAX_EURO, steps * wblu_per_step)

@router.post("/submit-steps", response_model=RewardResponse)
def submit_steps(token: str, reward_data: RewardSubmit, db: Session = Depends(get_db)):
    """Sottometti passi e ricevi ricompensa"""
    user = get_current_user(token, db)
    
    today = datetime.utcnow().strftime("%Y-%m-%d")
    
    # Calcola WBLU
    wblu_awarded = calculate_wblu(reward_data.steps)
    
    # Crea reward record
    reward = Reward(
        user_id=user.id,
        wblu_amount=wblu_awarded,
        day=today
    )
    
    db.add(reward)
    db.commit()
    db.refresh(reward)
    
    return reward

@router.get("/user-rewards", response_model=dict)
def get_user_rewards(token: str, db: Session = Depends(get_db)):
    """Ottieni totale ricompense utente"""
    user = get_current_user(token, db)
    
    total_wblu = db.query(Reward).filter(
        Reward.user_id == user.id
    ).with_entities(db.func.sum(Reward.wblu_amount)).scalar() or 0
    
    return {
        "user_id": user.id,
        "total_wblu": float(total_wblu),
        "wblu_awarded": float(total_wblu)
    }
