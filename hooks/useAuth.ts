"use client";
import { useState, useEffect } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut, User } from "firebase/auth";
import { auth } from "@/lib/firebase";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) { setLoading(false); return; }
    const unsub = onAuthStateChanged(auth, u => { setUser(u); setLoading(false); });
    return unsub;
  }, []);

  async function signIn(email: string, password: string) {
    if (!auth) throw new Error("Firebase não configurado");
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function signUp(email: string, password: string) {
    if (!auth) throw new Error("Firebase não configurado");
    return createUserWithEmailAndPassword(auth, email, password);
  }

  async function signOut() {
    if (!auth) return;
    return firebaseSignOut(auth);
  }

  return { user, loading, signIn, signUp, signOut };
}
