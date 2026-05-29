"use client";
import { createContext, useContext } from "react";
import type { Conta } from "@/types";

interface ContaCtx { conta: Conta | null; loading: boolean; }
import React from "react";
export const ContaContext = createContext<ContaCtx>({ conta: null, loading: true });
export function useConta() { return useContext(ContaContext); }
