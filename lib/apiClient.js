"use client";

import { createClient } from '@supabase/supabase-js';

/**
 * Supabase-backed API client. Exports the same functions the UI expects:
 * - checkHealth
 * - loginOrRegister
 * - apiGetContacts
 * - apiAddContacts
 * - apiGetMessages
 * - apiSendMessage
 * - apiSubmitSteps
 * - subscribeMessages (realtime)
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to be set in env.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabase = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (e) {
    // intentionally ignore - runtime will fallback to demo mode
  }
}

async function safe(fn) {
  try {
    return await fn();
  } catch (e) {
    return { ok: false, offline: true, error: String(e) };
  }
}

export async function checkHealth() {
  if (!supabase) return false;
  return safe(async () => {
    // quick read to validate DB access
    const { error } = await supabase.from('messages').select('id').limit(1);
    return { ok: !error };
  }).then((r) => (r && r.ok ? true : false));
}

export async function loginOrRegister(email, password, phone) {
  if (!supabase) return { ok: false, offline: true };
  return safe(async () => {
    // try sign in
    const signIn = await supabase.auth.signInWithPassword({ email, password });
    if (!signIn.error && signIn.data?.session) {
      return { ok: true, data: { token: signIn.data.session.access_token } };
    }

    // try sign up
    const signUp = await supabase.auth.signUp({ email, password }, { data: { phone } });
    if (signUp.error) {
      return { ok: false, offline: false, error: signUp.error.message, data: signUp };
    }
    return { ok: true, data: { token: signUp.data?.user?.id || null } };
  });
}

export async function apiGetContacts(token) {
  if (!supabase) return { ok: false, offline: true };
  return safe(async () => {
    const userRes = await supabase.auth.getUser();
    const user = userRes?.data?.user;
    if (!user) return { ok: false, offline: false, error: 'No user' };
    const { data, error } = await supabase.from('contacts').select('*').eq('owner_user_id', user.id);
    if (error) return { ok: false, offline: false, error: error.message };
    return { ok: true, data };
  });
}

export async function apiAddContacts(token, contacts) {
  if (!supabase) return { ok: false, offline: true };
  return safe(async () => {
    const userRes = await supabase.auth.getUser();
    const user = userRes?.data?.user;
    if (!user) return { ok: false, offline: false, error: 'No user' };
    const toInsert = contacts.map((c) => ({ ...c, owner_user_id: user.id }));
    const { data, error } = await supabase.from('contacts').insert(toInsert);
    if (error) return { ok: false, offline: false, error: error.message };
    return { ok: true, data };
  });
}

export async function apiGetMessages(token, conversationId) {
  if (!supabase) return { ok: false, offline: true };
  return safe(async () => {
    const { data, error } = await supabase.from('messages').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: true });
    if (error) return { ok: false, offline: false, error: error.message };
    return { ok: true, data };
  });
}

export async function apiSendMessage(token, conversationId, text) {
  if (!supabase) return { ok: false, offline: true };
  return safe(async () => {
    const userRes = await supabase.auth.getUser();
    const user = userRes?.data?.user;
    if (!user) return { ok: false, offline: false, error: 'No user' };
    const { data, error } = await supabase.from('messages').insert([{ conversation_id: conversationId, from_user_id: user.id, text }]);
    if (error) return { ok: false, offline: false, error: error.message };
    return { ok: true, data };
  });
}

export async function apiSubmitSteps(token, steps) {
  if (!supabase) return { ok: false, offline: true };
  return safe(async () => {
    const userRes = await supabase.auth.getUser();
    const user = userRes?.data?.user;
    if (!user) return { ok: false, offline: false, error: 'No user' };
    const { data, error } = await supabase.from('rewards').insert([{ user_id: user.id, wblu_amount: steps }]);
    if (error) return { ok: false, offline: false, error: error.message };
    return { ok: true, data: data[0] };
  });
}

export function subscribeMessages(conversationId, callback) {
  if (!supabase) return () => {};
  try {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => {
        callback(payload.new);
      })
      .subscribe();
    return () => {
      try { supabase.removeChannel(channel); } catch (e) { /* ignore */ }
    };
  } catch (e) {
    return () => {};
  }
}
