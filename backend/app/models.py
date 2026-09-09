"""SQLAlchemy models"""
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, Float, ForeignKey, Table, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

# Association table per contacts (molti-a-molti per group members)
contact_members = Table(
    'contact_members',
    Base.metadata,
    Column('group_id', String, ForeignKey('contacts.id')),
    Column('member_id', String, ForeignKey('contacts.id'))
)

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, nullable=True)
    password_hash = Column(String, nullable=False)
    totp_secret = Column(String, nullable=True)
    totp_enabled = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    contacts = relationship("Contact", back_populates="owner")
    messages = relationship("Message", back_populates="sender")
    rewards = relationship("Reward", back_populates="user")

class Contact(Base):
    __tablename__ = "contacts"
    
    id = Column(String, primary_key=True, index=True)  # "user-123" o "group-456"
    owner_user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    name = Column(String, nullable=False)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    is_group = Column(Boolean, default=False)
    color = Column(String, default="#7C3AED")  # Colore avatar
    initials = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    owner = relationship("User", back_populates="contacts")
    messages_sent = relationship("Message", foreign_keys="Message.to_contact_id", back_populates="contact")
    
    # Membri del gruppo
    members = relationship(
        "Contact",
        secondary=contact_members,
        primaryjoin=id == contact_members.c.group_id,
        secondaryjoin=id == contact_members.c.member_id,
        foreign_keys=[contact_members.c.group_id, contact_members.c.member_id]
    )

class Message(Base):
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    from_user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    to_contact_id = Column(String, ForeignKey('contacts.id'), nullable=False)
    text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    sender = relationship("User", back_populates="messages")
    contact = relationship("Contact", back_populates="messages_sent", foreign_keys=[to_contact_id])

class Reward(Base):
    __tablename__ = "rewards"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    wblu_amount = Column(Float, nullable=False)  # Amount in WBLU tokens
    day = Column(String, nullable=True)  # YYYY-MM-DD per tracking giornaliero
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    user = relationship("User", back_populates="rewards")
