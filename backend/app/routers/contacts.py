"""Contacts management endpoints"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid

from app.database import get_db
from app.models import User, Contact
from app.schemas import ContactResponse, ContactCreate, ContactsAddBatch
from app.routers.auth import get_current_user

router = APIRouter()

@router.get("/contacts", response_model=List[ContactResponse])
def get_contacts(token: str, db: Session = Depends(get_db)):
    """Ottieni lista contatti dell'utente"""
    user = get_current_user(token, db)
    
    contacts = db.query(Contact).filter(
        Contact.owner_user_id == user.id
    ).all()
    
    return contacts

@router.post("/contacts", response_model=ContactResponse)
def create_contact(token: str, contact_data: ContactCreate, db: Session = Depends(get_db)):
    """Crea nuovo contatto"""
    user = get_current_user(token, db)
    
    contact_id = f"{'group' if contact_data.is_group else 'user'}-{uuid.uuid4().hex[:12]}"
    
    new_contact = Contact(
        id=contact_id,
        owner_user_id=user.id,
        name=contact_data.name,
        email=contact_data.email,
        phone=contact_data.phone,
        is_group=contact_data.is_group,
        color=contact_data.color,
        initials=contact_data.initials
    )
    
    db.add(new_contact)
    db.commit()
    db.refresh(new_contact)
    
    return new_contact

@router.post("/contacts/batch", response_model=List[ContactResponse])
def add_contacts_batch(token: str, batch_data: ContactsAddBatch, db: Session = Depends(get_db)):
    """Aggiungi molteplici contatti (es. da import CSV)"""
    user = get_current_user(token, db)
    
    new_contacts = []
    for contact_data in batch_data.contacts:
        contact_id = f"user-{uuid.uuid4().hex[:12]}"
        
        new_contact = Contact(
            id=contact_id,
            owner_user_id=user.id,
            name=contact_data.name,
            email=contact_data.email,
            phone=contact_data.phone,
            is_group=contact_data.is_group,
            color=contact_data.color,
            initials=contact_data.initials
        )
        db.add(new_contact)
        new_contacts.append(new_contact)
    
    db.commit()
    for contact in new_contacts:
        db.refresh(contact)
    
    return new_contacts

@router.get("/contacts/{contact_id}", response_model=ContactResponse)
def get_contact(token: str, contact_id: str, db: Session = Depends(get_db)):
    """Ottieni dettagli contatto"""
    user = get_current_user(token, db)
    
    contact = db.query(Contact).filter(
        Contact.id == contact_id,
        Contact.owner_user_id == user.id
    ).first()
    
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found"
        )
    
    return contact

@router.delete("/contacts/{contact_id}")
def delete_contact(token: str, contact_id: str, db: Session = Depends(get_db)):
    """Elimina contatto"""
    user = get_current_user(token, db)
    
    contact = db.query(Contact).filter(
        Contact.id == contact_id,
        Contact.owner_user_id == user.id
    ).first()
    
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found"
        )
    
    db.delete(contact)
    db.commit()
    
    return {"message": "Contact deleted"}
