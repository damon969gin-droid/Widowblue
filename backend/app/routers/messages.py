"""Messages endpoints"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List
import json

from app.database import get_db
from app.models import User, Message, Contact
from app.schemas import MessageResponse, MessageCreate
from app.routers.auth import get_current_user

router = APIRouter()

@router.get("/messages/{contact_id}", response_model=List[MessageResponse])
def get_messages(token: str = Query(...), contact_id: str = None, db: Session = Depends(get_db)):
    """Ottieni messaggi di una conversazione"""
    user = get_current_user(token, db)
    
    # Verifica che il contatto appartiene all'utente
    contact = db.query(Contact).filter(
        Contact.id == contact_id,
        Contact.owner_user_id == user.id
    ).first()
    
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found"
        )
    
    messages = db.query(Message).filter(
        Message.to_contact_id == contact_id,
        Message.from_user_id == user.id
    ).order_by(Message.created_at.asc()).all()
    
    return messages

@router.post("/messages/{contact_id}/send", response_model=MessageResponse)
def send_message(token: str = Query(...), contact_id: str = None, message_data: MessageCreate = None, db: Session = Depends(get_db)):
    """Invia messaggio a contatto"""
    user = get_current_user(token, db)
    
    # Verifica che il contatto appartiene all'utente
    contact = db.query(Contact).filter(
        Contact.id == contact_id,
        Contact.owner_user_id == user.id
    ).first()
    
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found"
        )
    
    # Crea messaggio
    new_message = Message(
        from_user_id=user.id,
        to_contact_id=contact_id,
        text=message_data.text
    )
    
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    
    return new_message

@router.delete("/messages/{message_id}")
def delete_message(token: str = Query(...), message_id: int = None, db: Session = Depends(get_db)):
    """Elimina messaggio"""
    user = get_current_user(token, db)
    
    message = db.query(Message).filter(
        Message.id == message_id,
        Message.from_user_id == user.id
    ).first()
    
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    db.delete(message)
    db.commit()
    
    return {"message": "Message deleted"}

# === SSE Stream per chat realtime ===
@router.get("/messages/{contact_id}/stream")
def stream_messages(token: str = Query(...), contact_id: str = None, db: Session = Depends(get_db)):
    """Stream messaggi in tempo reale via SSE"""
    user = get_current_user(token, db)
    
    # Verifica che il contatto appartiene all'utente
    contact = db.query(Contact).filter(
        Contact.id == contact_id,
        Contact.owner_user_id == user.id
    ).first()
    
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found"
        )
    
    def message_generator():
        # Invia messaggi esistenti
        messages = db.query(Message).filter(
            Message.to_contact_id == contact_id,
            Message.from_user_id == user.id
        ).order_by(Message.created_at.asc()).all()
        
        for msg in messages:
            yield f"data: {json.dumps({'id': msg.id, 'from_user_id': msg.from_user_id, 'to_contact_id': msg.to_contact_id, 'text': msg.text, 'created_at': msg.created_at.isoformat()})}\n\n"
    
    return StreamingResponse(message_generator(), media_type="text/event-stream")
