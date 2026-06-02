"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { getConta, getProdutos, getProximoNumeroPedido, savePedido } from "@/lib/firestore";
import Image from "next/image";
import { Plus, Minus, ShoppingBag, CheckCircle2, ChevronRight, X, ArrowLeft } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import type { Conta, Produto } from "@/types";

// ── Splash Screen ────────────────────────────────────────────────────────────
const LOGO_PATH = "M100.00 10.50C98.25 10.58 93.17 10.83 90.00 11.50C86.83 12.17 85.17 12.50 81.00 14.50C76.83 16.50 69.17 20.83 65.00 23.50C60.83 26.17 60.25 26.58 56.00 30.50C51.75 34.42 43.58 42.58 39.50 47.00C35.42 51.42 34.83 52.17 31.50 57.00C28.17 61.83 23.00 68.67 19.50 76.00C16.00 83.33 12.17 93.83 10.50 101.00C8.83 108.17 9.33 114.67 9.50 119.00C9.67 123.33 10.50 124.50 11.50 127.00C12.50 129.50 13.75 131.75 15.50 134.00C17.25 136.25 19.42 138.75 22.00 140.50C24.58 142.25 28.00 143.67 31.00 144.50C34.00 145.33 36.67 145.67 40.00 145.50C43.33 145.33 47.17 144.83 51.00 143.50C54.83 142.17 59.33 139.67 63.00 137.50C66.67 135.33 68.17 134.67 73.00 130.50C77.83 126.33 88.58 115.42 92.00 112.50C95.42 109.58 93.25 112.25 93.50 113.00C93.75 113.75 92.92 115.42 93.50 117.00C94.08 118.58 95.08 121.25 97.00 122.50C98.92 123.75 102.00 125.00 105.00 124.50C108.00 124.00 111.83 122.00 115.00 119.50C118.17 117.00 122.42 110.58 124.00 109.50C125.58 108.42 123.83 111.67 124.50 113.00C125.17 114.33 126.92 116.58 128.00 117.50C129.08 118.42 129.50 118.50 131.00 118.50C132.50 118.50 135.00 118.33 137.00 117.50C139.00 116.67 140.67 115.67 143.00 113.50C145.33 111.33 149.42 104.42 151.00 104.50C152.58 104.58 151.17 111.67 152.50 114.00C153.83 116.33 156.42 118.25 159.00 118.50C161.58 118.75 165.50 117.17 168.00 115.50C170.50 113.83 172.75 109.58 174.00 108.50C175.25 107.42 175.08 107.92 175.50 109.00C175.92 110.08 175.75 113.42 176.50 115.00C177.25 116.58 178.58 117.92 180.00 118.50C181.42 119.08 181.83 120.33 185.00 118.50C188.17 116.67 196.58 108.25 199.00 107.50C201.42 106.75 198.83 112.17 199.50 114.00C200.17 115.83 201.42 117.75 203.00 118.50C204.58 119.25 206.17 119.83 209.00 118.50C211.83 117.17 218.08 111.25 220.00 110.50C221.92 109.75 219.83 112.67 220.50 114.00C221.17 115.33 221.92 117.58 224.00 118.50C226.08 119.42 230.83 119.67 233.00 119.50C235.17 119.33 233.83 120.67 237.00 117.50C240.17 114.33 249.42 101.58 252.00 100.50C254.58 99.42 252.08 108.42 252.50 111.00C252.92 113.58 253.42 114.58 254.50 116.00C255.58 117.42 256.75 118.92 259.00 119.50C261.25 120.08 265.33 120.17 268.00 119.50C270.67 118.83 272.33 117.67 275.00 115.50C277.67 113.33 282.42 106.92 284.00 106.50C285.58 106.08 283.67 111.00 284.50 113.00C285.33 115.00 287.25 117.58 289.00 118.50C290.75 119.42 292.00 120.00 295.00 118.50C298.00 117.00 304.75 110.92 307.00 109.50C309.25 108.08 308.25 109.25 308.50 110.00C308.75 110.75 307.92 112.75 308.50 114.00C309.08 115.25 310.58 116.75 312.00 117.50C313.42 118.25 315.17 118.67 317.00 118.50C318.83 118.33 319.83 119.00 323.00 116.50C326.17 114.00 333.75 103.92 336.00 103.50C338.25 103.08 335.67 111.50 336.50 114.00C337.33 116.50 339.58 117.58 341.00 118.50C342.42 119.42 343.17 119.67 345.00 119.50C346.83 119.33 349.67 118.67 352.00 117.50C354.33 116.33 355.25 116.25 359.00 112.50C362.75 108.75 371.58 98.75 374.50 95.00C377.42 91.25 376.58 90.92 376.50 90.00C376.42 89.08 376.75 86.75 374.00 89.50C371.25 92.25 363.67 102.67 360.00 106.50C356.33 110.33 354.00 111.50 352.00 112.50C350.00 113.50 348.92 112.75 348.00 112.50C347.08 112.25 346.75 112.58 346.50 111.00C346.25 109.42 345.17 107.83 346.50 103.00C347.83 98.17 353.42 85.75 354.50 82.00C355.58 78.25 354.25 80.58 353.00 80.50C351.75 80.42 348.83 82.17 347.00 81.50C345.17 80.83 344.00 77.50 342.00 76.50C340.00 75.50 338.17 74.67 335.00 75.50C331.83 76.33 326.75 78.58 323.00 81.50C319.25 84.42 314.92 89.58 312.50 93.00C310.08 96.42 310.75 98.92 308.50 102.00C306.25 105.08 301.25 109.75 299.00 111.50C296.75 113.25 295.92 112.58 295.00 112.50C294.08 112.42 293.75 112.08 293.50 111.00C293.25 109.92 293.17 108.00 293.50 106.00C293.83 104.00 293.67 103.17 295.50 99.00C297.33 94.83 303.00 84.50 304.50 81.00C306.00 77.50 304.75 78.75 304.50 78.00C304.25 77.25 304.08 76.92 303.00 76.50C301.92 76.08 299.25 75.42 298.00 75.50C296.75 75.58 296.58 75.75 295.50 77.00C294.42 78.25 292.83 79.83 291.50 83.00C290.17 86.17 289.17 92.50 287.50 96.00C285.83 99.50 284.42 101.08 281.50 104.00C278.58 106.92 272.58 111.92 270.00 113.50C267.42 115.08 267.08 114.08 266.00 113.50C264.92 112.92 263.92 112.75 263.50 110.00C263.08 107.25 260.17 102.67 263.50 97.00C266.83 91.33 278.33 82.17 283.50 76.00C288.67 69.83 290.83 66.33 294.50 60.00C298.17 53.67 303.83 43.83 305.50 38.00C307.17 32.17 305.25 27.58 304.50 25.00C303.75 22.42 302.75 22.92 301.00 22.50C299.25 22.08 296.83 21.50 294.00 22.50C291.17 23.50 287.25 25.58 284.00 28.50C280.75 31.42 277.92 34.58 274.50 40.00C271.08 45.42 266.17 54.83 263.50 61.00C260.83 67.17 259.75 74.08 258.50 77.00C257.25 79.92 257.25 78.75 256.00 78.50C254.75 78.25 253.00 76.00 251.00 75.50C249.00 75.00 246.50 74.83 244.00 75.50C241.50 76.17 238.75 77.42 236.00 79.50C233.25 81.58 230.25 83.92 227.50 88.00C224.75 92.08 221.92 100.08 219.50 104.00C217.08 107.92 214.75 110.08 213.00 111.50C211.25 112.92 209.92 113.08 209.00 112.50C208.08 111.92 207.25 110.92 207.50 108.00C207.75 105.08 209.00 99.67 210.50 95.00C212.00 90.33 215.75 82.92 216.50 80.00C217.25 77.08 216.08 78.08 215.00 77.50C213.92 76.92 211.25 76.25 210.00 76.50C208.75 76.75 209.58 74.75 207.50 79.00C205.42 83.25 200.42 96.75 197.50 102.00C194.58 107.25 191.75 108.92 190.00 110.50C188.25 112.08 187.75 111.58 187.00 111.50C186.25 111.42 185.75 111.42 185.50 110.00C185.25 108.58 184.00 108.33 185.50 103.00C187.00 97.67 193.25 82.58 194.50 78.00C195.75 73.42 194.42 75.75 193.00 75.50C191.58 75.25 188.08 74.25 186.00 76.50C183.92 78.75 181.75 85.42 180.50 89.00C179.25 92.58 180.58 94.42 178.50 98.00C176.42 101.58 170.58 108.25 168.00 110.50C165.42 112.75 164.08 111.58 163.00 111.50C161.92 111.42 161.75 111.25 161.50 110.00C161.25 108.75 160.67 107.33 161.50 104.00C162.33 100.67 165.00 93.33 166.50 90.00C168.00 86.67 169.83 85.50 170.50 84.00C171.17 82.50 170.92 81.75 170.50 81.00C170.08 80.25 169.25 79.58 168.00 79.50C166.75 79.42 164.83 81.17 163.00 80.50C161.17 79.83 159.00 76.33 157.00 75.50C155.00 74.67 154.00 74.50 151.00 75.50C148.00 76.50 142.25 79.25 139.00 81.50C135.75 83.75 134.58 84.58 131.50 89.00C128.42 93.42 123.75 103.42 120.50 108.00C117.25 112.58 114.42 114.92 112.00 116.50C109.58 118.08 107.42 117.75 106.00 117.50C104.58 117.25 103.75 118.08 103.50 115.00C103.25 111.92 102.50 103.50 104.50 99.00C106.50 94.50 111.17 93.17 115.50 88.00C119.83 82.83 126.50 73.83 130.50 68.00C134.50 62.17 137.00 58.00 139.50 53.00C142.00 48.00 144.67 42.50 145.50 38.00C146.33 33.50 145.25 28.58 144.50 26.00C143.75 23.42 142.58 23.08 141.00 22.50C139.42 21.92 136.83 22.17 135.00 22.50C133.17 22.83 132.08 23.08 130.00 24.50C127.92 25.92 126.08 26.42 122.50 31.00C118.92 35.58 112.67 44.00 108.50 52.00C104.33 60.00 100.17 70.00 97.50 79.00C94.83 88.00 95.58 99.25 92.50 106.00C89.42 112.75 84.08 115.25 79.00 119.50C73.92 123.75 66.67 128.67 62.00 131.50C57.33 134.33 55.17 135.67 51.00 136.50C46.83 137.33 40.00 136.83 37.00 136.50C34.00 136.17 34.75 136.25 33.00 134.50C31.25 132.75 27.92 128.75 26.50 126.00C25.08 123.25 24.83 120.67 24.50 118.00C24.17 115.33 23.67 114.83 24.50 110.00C25.33 105.17 27.33 95.33 29.50 89.00C31.67 82.67 34.50 77.50 37.50 72.00C40.50 66.50 43.83 61.17 47.50 56.00C51.17 50.83 55.08 45.75 59.50 41.00C63.92 36.25 70.25 30.75 74.00 27.50C77.75 24.25 79.00 23.33 82.00 21.50C85.00 19.67 88.67 17.50 92.00 16.50C95.33 15.50 99.50 15.17 102.00 15.50C104.50 15.83 105.92 17.58 107.00 18.50C108.08 19.42 108.25 19.08 108.50 21.00C108.75 22.92 108.83 27.83 108.50 30.00C108.17 32.17 107.92 32.08 106.50 34.00C105.08 35.92 102.33 39.33 100.00 41.50C97.67 43.67 93.75 45.75 92.50 47.00C91.25 48.25 92.08 48.42 92.50 49.00C92.92 49.58 93.58 50.75 95.00 50.50C96.42 50.25 98.92 49.08 101.00 47.50C103.08 45.92 105.58 43.42 107.50 41.00C109.42 38.58 111.50 36.50 112.50 33.00C113.50 29.50 113.92 23.08 113.50 20.00C113.08 16.92 111.42 15.92 110.00 14.50C108.58 13.08 106.58 12.08 105.00 11.50C103.42 10.92 101.33 11.17 100.50 11.00C99.67 10.83 101.75 10.42 100.00 10.50ZM298.00 29.50C296.42 30.75 292.58 33.08 289.50 37.00C286.42 40.92 282.83 46.67 279.50 53.00C276.17 59.33 271.17 70.83 269.50 75.00C267.83 79.17 270.17 76.00 269.50 78.00C268.83 80.00 266.08 85.08 265.50 87.00C264.92 88.92 264.67 90.17 266.00 89.50C267.33 88.83 270.75 85.92 273.50 83.00C276.25 80.08 279.17 76.67 282.50 72.00C285.83 67.33 290.33 60.83 293.50 55.00C296.67 49.17 300.17 40.83 301.50 37.00C302.83 33.17 301.92 33.25 301.50 32.00C301.08 30.75 299.58 29.92 299.00 29.50C298.42 29.08 299.58 28.25 298.00 29.50ZM138.00 30.50C136.75 31.42 134.42 32.25 131.50 36.00C128.58 39.75 123.83 46.83 120.50 53.00C117.17 59.17 113.83 67.00 111.50 73.00C109.17 79.00 107.25 85.92 106.50 89.00C105.75 92.08 104.17 94.33 107.00 91.50C109.83 88.67 119.08 77.92 123.50 72.00C127.92 66.08 130.50 61.83 133.50 56.00C136.50 50.17 140.17 40.83 141.50 37.00C142.83 33.17 141.92 34.08 141.50 33.00C141.08 31.92 139.58 30.92 139.00 30.50C138.42 30.08 139.25 29.58 138.00 30.50ZM377.00 53.50C376.42 53.92 375.08 53.58 374.50 56.00C373.92 58.42 374.67 64.50 373.50 68.00C372.33 71.50 368.42 75.25 367.50 77.00C366.58 78.75 367.58 78.25 368.00 78.50C368.42 78.75 368.08 80.08 370.00 78.50C371.92 76.92 377.42 71.42 379.50 69.00C381.58 66.58 381.83 65.33 382.50 64.00C383.17 62.67 383.50 62.50 383.50 61.00C383.50 59.50 383.42 56.25 382.50 55.00C381.58 53.75 378.92 53.75 378.00 53.50C377.08 53.25 377.58 53.08 377.00 53.50ZM399.00 67.50C397.00 68.33 390.75 70.25 388.00 72.50C385.25 74.75 383.25 77.92 382.50 81.00C381.75 84.08 382.00 86.83 383.50 91.00C385.00 95.17 392.25 102.58 391.50 106.00C390.75 109.42 382.33 109.50 379.00 111.50C375.67 113.50 373.25 116.08 371.50 118.00C369.75 119.92 368.83 120.83 368.50 123.00C368.17 125.17 368.75 129.08 369.50 131.00C370.25 132.92 371.58 133.58 373.00 134.50C374.42 135.42 374.83 136.33 378.00 136.50C381.17 136.67 388.67 136.17 392.00 135.50C395.33 134.83 395.92 134.08 398.00 132.50C400.08 130.92 402.92 128.08 404.50 126.00C406.08 123.92 407.08 123.42 407.50 120.00C407.92 116.58 402.58 109.08 407.00 105.50C411.42 101.92 428.33 100.33 434.00 98.50C439.67 96.67 439.42 95.75 441.00 94.50C442.58 93.25 443.33 92.17 443.50 91.00C443.67 89.83 444.25 86.75 442.00 87.50C439.75 88.25 436.33 93.17 430.00 95.50C423.67 97.83 409.75 102.42 404.00 101.50C398.25 100.58 397.42 93.58 395.50 90.00C393.58 86.42 392.83 82.17 392.50 80.00C392.17 77.83 392.42 78.25 393.50 77.00C394.58 75.75 397.25 73.25 399.00 72.50C400.75 71.75 402.75 72.08 404.00 72.50C405.25 72.92 406.00 74.00 406.50 75.00C407.00 76.00 406.42 77.92 407.00 78.50C407.58 79.08 409.25 78.75 410.00 78.50C410.75 78.25 411.25 77.92 411.50 77.00C411.75 76.08 412.42 74.42 411.50 73.00C410.58 71.58 407.92 69.42 406.00 68.50C404.08 67.58 401.17 67.67 400.00 67.50C398.83 67.33 401.00 66.67 399.00 67.50ZM348.00 128.50C347.17 129.00 347.17 130.17 344.00 131.50C340.83 132.83 336.83 134.83 329.00 136.50C321.17 138.17 309.67 140.83 297.00 141.50C284.33 142.17 262.00 141.00 253.00 140.50C244.00 140.00 249.50 139.17 243.00 138.50C236.50 137.83 220.50 137.17 214.00 136.50C207.50 135.83 209.67 135.00 204.00 134.50C198.33 134.00 184.17 133.83 180.00 133.50C175.83 133.17 182.50 132.67 179.00 132.50C175.50 132.33 162.50 132.67 159.00 132.50C155.50 132.33 163.50 131.50 158.00 131.50C152.50 131.50 136.50 131.50 126.00 132.50C115.50 133.50 102.83 135.83 95.00 137.50C87.17 139.17 84.50 140.17 79.00 142.50C73.50 144.83 65.25 149.58 62.00 151.50C58.75 153.42 59.83 153.17 59.50 154.00C59.17 154.83 59.42 156.08 60.00 156.50C60.58 156.92 59.33 158.00 63.00 156.50C66.67 155.00 76.50 149.67 82.00 147.50C87.50 145.33 86.33 145.17 96.00 143.50C105.67 141.83 126.67 138.50 140.00 137.50C153.33 136.50 169.83 137.33 176.00 137.50C182.17 137.67 174.50 138.33 177.00 138.50C179.50 138.67 188.50 138.33 191.00 138.50C193.50 138.67 187.33 139.17 192.00 139.50C196.67 139.83 214.33 140.17 219.00 140.50C223.67 140.83 213.17 141.00 220.00 141.50C226.83 142.00 253.17 143.00 260.00 143.50C266.83 144.00 252.17 144.50 261.00 144.50C269.83 144.50 301.33 144.17 313.00 143.50C324.67 142.83 326.00 141.67 331.00 140.50C336.00 139.33 339.42 138.08 343.00 136.50C346.58 134.92 351.00 132.33 352.50 131.00C354.00 129.67 352.58 128.92 352.00 128.50C351.42 128.08 349.67 128.50 349.00 128.50C348.33 128.50 348.83 128.00 348.00 128.50Z";

function SplashCardapio({ nomeConta, onEnter }: { nomeConta: string; onEnter: () => void }) {
  const [step1, setStep1] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number }[]>([]);

  useEffect(() => {
    const pts = Array.from({ length: 18 }, (_, i) => ({
      id: i, x: Math.random() * 100, y: Math.random() * 100,
    }));
    setParticles(pts);
    setTimeout(() => setStep1(true), 300);
  }, []);

  function enter() {
    setRevealed(true);
    setTimeout(onEnter, 1100);
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999, background: "#F6EFE1",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", overflow: "hidden",
        fontFamily: "'Lora', 'Georgia', serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital@0;1&family=Poppins:wght@300;400;600&display=swap');
        @keyframes particleFloat {
          0% { opacity:0; transform: translate(0,0); }
          40% { opacity: 0.5; }
          100% { opacity:0; transform: translate(var(--tx), var(--ty)); }
        }
      `}</style>

      {/* Fundo escuro que desliza para cima */}
      <div style={{
        position: "absolute", inset: 0, background: "#2A1F1A",
        transform: revealed ? "translateY(-100%)" : "translateY(0%)",
        transition: "transform 1.1s cubic-bezier(0.76,0,0.24,1)",
        zIndex: 0,
      }} />

      {/* Partículas douradas */}
      {particles.map((p, i) => (
        <div key={p.id} style={{
          position: "absolute", width: 3, height: 3, borderRadius: "50%",
          background: "#D8B974", left: `${p.x}%`, top: `${p.y}%`,
          opacity: 0, zIndex: 1,
          animation: step1 ? `particleFloat ${800 + i * 80}ms ease ${200 + i * 60}ms forwards` : "none",
          ["--tx" as string]: `${(Math.random() - 0.5) * 60}px`,
          ["--ty" as string]: `-${Math.random() * 80 + 30}px`,
        } as React.CSSProperties} />
      ))}

      {/* Conteúdo */}
      <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>

        {/* Logo SVG */}
        <div style={{
          opacity: step1 ? 1 : 0,
          transform: step1 ? "translateY(0)" : "translateY(18px)",
          transition: "opacity 0.7s ease, transform 0.7s ease",
        }}>
          <svg viewBox="6 7 441 178" width={220} style={{ height: "auto", display: "block" }} aria-label={nomeConta}>
            <path fill="#F6EFE1" fillRule="evenodd" d={LOGO_PATH} />
          </svg>
        </div>

        {/* Tagline */}
        <div style={{
          fontFamily: "'Lora', serif", fontSize: 13, color: "#D8B974",
          letterSpacing: "0.18em", textTransform: "uppercase",
          opacity: step1 ? 1 : 0,
          transform: step1 ? "translateY(0)" : "translateY(10px)",
          transition: "opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s",
          marginTop: 6,
        }}>
          Sabor e Afeto
        </div>

        {/* Ornamento */}
        <div style={{
          marginTop: 22, display: "flex", alignItems: "center", gap: 6,
          opacity: step1 ? 1 : 0,
          transition: "opacity 0.5s ease 0.45s",
        }}>
          <div style={{ width: 52, height: 0.6, background: "#D8B974" }} />
          <div style={{ width: 5, height: 5, background: "#D8B974", transform: "rotate(45deg)" }} />
          <div style={{ width: 5, height: 5, background: "#D8B974", transform: "rotate(45deg)" }} />
          <div style={{ width: 5, height: 5, background: "#D8B974", transform: "rotate(45deg)" }} />
          <div style={{ width: 52, height: 0.6, background: "#D8B974" }} />
        </div>

        {/* Subtítulo referência ao cardápio */}
        <div style={{
          marginTop: 18,
          fontFamily: "'Poppins', sans-serif", fontSize: 11, fontWeight: 300,
          color: "#D8B974", letterSpacing: "0.12em", textTransform: "uppercase",
          opacity: step1 ? 1 : 0,
          transition: "opacity 0.5s ease 0.55s",
          textAlign: "center",
        }}>
          🎂 Confeitaria artesanal • Encomendas
        </div>

        {/* Botão */}
        <button
          onClick={enter}
          style={{
            marginTop: 32,
            fontFamily: "'Poppins', sans-serif", fontSize: 11.5, fontWeight: 600,
            letterSpacing: "0.22em", textTransform: "uppercase",
            color: "#2A1F1A", background: "#D8B974", border: "none",
            padding: "11px 34px", cursor: "pointer",
            opacity: step1 ? 1 : 0,
            transform: step1 ? "translateY(0)" : "translateY(8px)",
            transition: "opacity 0.5s ease 0.65s, transform 0.5s ease 0.65s",
          }}
        >
          Ver Cardápio
        </button>
      </div>
    </div>
  );
}

interface ItemCarrinho { produto: Produto; quantidade: number; }

const CATS = ["Confeitaria", "Salgado", "Panificado", "Kit", "Outro"] as const;
const CAT_EMOJI: Record<string, string> = {
  Confeitaria: "🎂", Salgado: "🥐", Panificado: "🍞", Kit: "🎁", Outro: "✨",
};

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function PedidoClientePage() {
  const { contaId } = useParams<{ contaId: string }>();
  const [conta, setConta] = useState<Conta | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [step, setStep] = useState<"menu" | "dados" | "confirmado">("menu");
  const [enviando, setEnviando] = useState(false);
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);
  const [catAtiva, setCatAtiva] = useState<string>("todas");
  const catRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [dataEntrega, setDataEntrega] = useState("");
  const [obs, setObs] = useState("");
  const [personalizacao, setPersonalizacao] = useState("");
  const [endereco, setEndereco] = useState("");
  const [numEnd, setNumEnd] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");

  useEffect(() => {
    if (!contaId) return;
    Promise.all([getConta(contaId), getProdutos(contaId)]).then(([c, ps]) => {
      setConta(c);
      setProdutos(ps.filter(p => p.status === "ativo" || p.status === "encomenda"));
      setLoading(false);
    });
  }, [contaId]);

  function addItem(produto: Produto) {
    setCarrinho(prev => {
      const ex = prev.find(i => i.produto.id === produto.id);
      if (ex) return prev.map(i => i.produto.id === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i);
      return [...prev, { produto, quantidade: 1 }];
    });
  }

  function removeItem(produtoId: string) {
    setCarrinho(prev => {
      const ex = prev.find(i => i.produto.id === produtoId);
      if (!ex) return prev;
      if (ex.quantidade === 1) return prev.filter(i => i.produto.id !== produtoId);
      return prev.map(i => i.produto.id === produtoId ? { ...i, quantidade: i.quantidade - 1 } : i);
    });
  }

  function qtd(produtoId: string) {
    return carrinho.find(i => i.produto.id === produtoId)?.quantidade ?? 0;
  }

  const total = carrinho.reduce((s, i) => s + i.produto.precoVenda * i.quantidade, 0);
  const totalItens = carrinho.reduce((s, i) => s + i.quantidade, 0);

  const catsComProdutos = CATS.filter(c => produtos.some(p => p.categoria === c));

  function scrollToCategoria(cat: string) {
    setCatAtiva(cat);
    catRefs.current[cat]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleConfirmar() {
    if (!nome.trim()) { toast.error("Informe seu nome"); return; }
    if (!whatsapp.trim()) { toast.error("Informe seu WhatsApp"); return; }
    if (!dataEntrega) { toast.error("Informe a data de entrega desejada"); return; }
    if (carrinho.length === 0) { toast.error("Adicione itens ao pedido"); return; }
    setEnviando(true);
    try {
      const numero = await getProximoNumeroPedido(contaId);
      const itens = carrinho.map(i => ({
        produtoId: i.produto.id,
        produtoNome: i.produto.nome,
        quantidade: i.quantidade,
        precoUnit: i.produto.precoVenda,
        subtotal: i.produto.precoVenda * i.quantidade,
      }));
      await savePedido(contaId, {
        numero,
        clienteId: "",
        clienteNome: nome.trim(),
        clienteWhatsapp: whatsapp.trim(),
        itens,
        total,
        desconto: 0,
        totalFinal: total,
        formaPagamento: "a_definir",
        dataEntrega,
        status: "aguardando",
        obs: obs.trim(),
        personalizacao: personalizacao.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Notifica a dona via email
      fetch("/api/notificar-pedido", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contaId,
          numero,
          clienteNome: nome.trim(),
          clienteWhatsapp: whatsapp.trim(),
          dataEntrega,
          itens: carrinho.map(i => ({
            quantidade: i.quantidade,
            produtoNome: i.produto.nome,
            subtotal: i.produto.precoVenda * i.quantidade,
          })),
          total,
          obs: obs.trim(),
          personalizacao: personalizacao.trim(),
        }),
      }).catch(e => console.error("Erro ao notificar:", e));

      const enderecoCompleto = [endereco.trim(), numEnd.trim(), complemento.trim(), bairro.trim(), cidade.trim()].filter(Boolean).join(", ");
      const itensTexto = carrinho.map(i => `• ${i.quantidade}x ${i.produto.nome} — ${fmt(i.produto.precoVenda * i.quantidade)}`).join("\n");
      const msg = [
        `🎂 *Novo Pedido #${numero} — ${conta?.nome}*`,
        ``,
        `👤 *Cliente:* ${nome.trim()}`,
        `📱 *WhatsApp:* ${whatsapp.trim()}`,
        enderecoCompleto ? `📍 *Endereço:* ${enderecoCompleto}` : "",
        `📅 *Entrega desejada:* ${new Date(dataEntrega + "T12:00:00").toLocaleDateString("pt-BR")}`,
        ``,
        `*Itens:*`,
        itensTexto,
        ``,
        `💰 *Total: ${fmt(total)}*`,
        personalizacao.trim() ? `✏️ *Personalização:* ${personalizacao.trim()}` : "",
        obs.trim() ? `📝 *Obs:* ${obs.trim()}` : "",
      ].filter(Boolean).join("\n");

      const telefone = conta?.telefone?.replace(/\D/g, "") ?? "";
      if (telefone) window.open(`https://wa.me/55${telefone}?text=${encodeURIComponent(msg)}`, "_blank");

      // Notificar dono via email + push
      fetch("/api/notificar-pedido", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numero,
          clienteNome: nome.trim(),
          clienteWhatsapp: whatsapp.trim(),
          dataEntrega,
          itens,
          total,
          obs: obs.trim(),
          personalizacao: personalizacao.trim(),
          fcmToken: conta?.fcmToken ?? null,
        }),
      }).catch(console.error);

      setStep("confirmado");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao enviar pedido. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDF8F4] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#FAEDEF] border-t-[#C4566A] rounded-full animate-spin" />
      </div>
    );
  }

  if (showSplash && conta) {
    return <SplashCardapio nomeConta={conta.nome} onEnter={() => setShowSplash(false)} />;
  }

  if (!conta) {
    return (
      <div className="min-h-screen bg-[#FDF8F4] flex items-center justify-center p-6 text-center">
        <div><p className="text-2xl mb-2">😕</p><p className="text-[#7A6860]">Confeitaria não encontrada.</p></div>
      </div>
    );
  }

  if (step === "confirmado") {
    return (
      <div className="min-h-screen bg-[#FDF8F4] flex items-center justify-center p-6">
        <Toaster position="top-center" />
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={40} className="text-emerald-500" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-[#2A1F1A] mb-2">Pedido enviado! 🎉</h1>
          <p className="text-[#7A6860] text-sm mb-6">
            Seu pedido foi registrado com sucesso. O WhatsApp da <strong>{conta.nome}</strong> foi aberto com todos os detalhes — confirme por lá para garantir sua encomenda!
          </p>
          <button
            onClick={() => { setStep("menu"); setCarrinho([]); setNome(""); setWhatsapp(""); setObs(""); setPersonalizacao(""); setDataEntrega(""); setEndereco(""); setNumEnd(""); setComplemento(""); setBairro(""); setCidade(""); }}
            className="w-full bg-[#C4566A] hover:bg-[#b04d60] text-white font-semibold py-3 rounded-2xl text-sm transition"
          >
            Fazer outro pedido
          </button>
        </div>
      </div>
    );
  }

  if (step === "dados") {
    return (
      <div className="min-h-screen bg-[#FDF8F4]">
        <Toaster position="top-center" />
        <div className="bg-white border-b border-[#FAEDEF] px-4 py-4 flex items-center gap-3">
          <button onClick={() => setStep("menu")} className="p-2 hover:bg-[#FAEDEF] rounded-full transition">
            <ArrowLeft size={18} className="text-[#7A6860]" />
          </button>
          <h2 className="font-semibold text-[#2A1F1A] text-sm">Seus dados</h2>
        </div>

        <div className="max-w-lg mx-auto px-4 py-5 pb-32 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#7A6860] mb-1.5">Seu nome *</label>
            <input className="w-full border border-[#FAEDEF] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E8A0AE] bg-white transition" value={nome} onChange={e => setNome(e.target.value)} placeholder="Como quer ser chamado(a)?" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#7A6860] mb-1.5">WhatsApp *</label>
            <input type="tel" className="w-full border border-[#FAEDEF] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E8A0AE] bg-white transition" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="(27) 99999-9999" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#7A6860] mb-1.5">Data de entrega desejada *</label>
            <input type="date" className="w-full border border-[#FAEDEF] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E8A0AE] bg-white transition" value={dataEntrega} onChange={e => setDataEntrega(e.target.value)} min={new Date().toISOString().slice(0, 10)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#7A6860] mb-1.5">Personalização (opcional)</label>
            <input className="w-full border border-[#FAEDEF] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E8A0AE] bg-white transition" value={personalizacao} onChange={e => setPersonalizacao(e.target.value)} placeholder="Ex: Feliz Aniversário Maria! 🎉" />
          </div>

          {/* Endereço de entrega */}
          <div>
            <p className="text-xs font-semibold text-[#7A6860] mb-2">📍 Endereço de entrega (opcional)</p>
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_80px] gap-2">
                <input className="w-full border border-[#FAEDEF] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E8A0AE] bg-white transition" value={endereco} onChange={e => setEndereco(e.target.value)} placeholder="Rua / Avenida" />
                <input className="w-full border border-[#FAEDEF] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E8A0AE] bg-white transition" value={numEnd} onChange={e => setNumEnd(e.target.value)} placeholder="Nº" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input className="w-full border border-[#FAEDEF] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E8A0AE] bg-white transition" value={complemento} onChange={e => setComplemento(e.target.value)} placeholder="Complemento" />
                <input className="w-full border border-[#FAEDEF] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E8A0AE] bg-white transition" value={bairro} onChange={e => setBairro(e.target.value)} placeholder="Bairro" />
              </div>
              <input className="w-full border border-[#FAEDEF] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E8A0AE] bg-white transition" value={cidade} onChange={e => setCidade(e.target.value)} placeholder="Cidade" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#7A6860] mb-1.5">Observações (opcional)</label>
            <textarea className="w-full border border-[#FAEDEF] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E8A0AE] bg-white transition resize-none h-16" value={obs} onChange={e => setObs(e.target.value)} placeholder="Alguma observação para o pedido..." />
          </div>

          {/* Resumo */}
          <div className="bg-white rounded-2xl border border-[#FAEDEF] p-4">
            <p className="font-semibold text-[#2A1F1A] text-sm mb-3">Resumo do pedido</p>
            <div className="space-y-2">
              {carrinho.map(i => (
                <div key={i.produto.id} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#FAEDEF] text-[#C4566A] text-[0.6rem] font-bold w-5 h-5 rounded-full flex items-center justify-center">{i.quantidade}</span>
                    <span className="text-[#2A1F1A]">{i.produto.nome}</span>
                  </div>
                  <span className="font-semibold text-[#2A1F1A]">{fmt(i.produto.precoVenda * i.quantidade)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-[#FAEDEF] mt-3 pt-3 flex justify-between font-bold text-[#2A1F1A]">
              <span>Total</span>
              <span className="text-[#B87444] text-lg">{fmt(total)}</span>
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-[#FAEDEF] shadow-lg">
          <button onClick={handleConfirmar} disabled={enviando}
            className="w-full max-w-lg mx-auto flex items-center justify-center gap-2 bg-[#C4566A] hover:bg-[#b04d60] disabled:opacity-60 text-white font-semibold py-4 rounded-2xl transition text-sm">
            {enviando ? "Enviando..." : "✅ Confirmar e abrir WhatsApp"}
          </button>
        </div>
      </div>
    );
  }

  // ── MENU ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FDF8F4]">
      <Toaster position="top-center" />

      {/* Header */}
      <div className="bg-[#FDF8F4] px-4 pt-8 pb-5 text-center border-b border-[#FAEDEF]">
        <div className="flex justify-center mb-3">
          <Image src="/logo.png" alt={conta.nome} width={180} height={75} className="object-contain" />
        </div>
        <p className="text-[#7A6860] text-xs">Faça seu pedido direto com a gente 🎂</p>
        {conta.instagram && (
          <a href={`https://instagram.com/${conta.instagram.replace("@","")}`} target="_blank" rel="noopener noreferrer"
            className="inline-block mt-1.5 text-[0.65rem] text-[#C4566A] font-semibold">
            {conta.instagram}
          </a>
        )}
      </div>

      {/* Categorias sticky */}
      {catsComProdutos.length > 1 && (
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-[#FAEDEF] px-4 py-2.5 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setCatAtiva("todas")}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition ${catAtiva === "todas" ? "bg-[#C4566A] text-white" : "bg-[#FAEDEF] text-[#7A6860]"}`}
          >
            Todos
          </button>
          {catsComProdutos.map(c => (
            <button key={c} onClick={() => scrollToCategoria(c)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition ${catAtiva === c ? "bg-[#C4566A] text-white" : "bg-[#FAEDEF] text-[#7A6860]"}`}>
              {CAT_EMOJI[c]} {c}
            </button>
          ))}
        </div>
      )}

      {/* Produtos */}
      <div className="max-w-lg mx-auto pb-36">
        {catsComProdutos.length === 0 ? (
          <div className="text-center py-20 text-[#7A6860]">
            <ShoppingBag size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">Nenhum produto disponível no momento.</p>
          </div>
        ) : (
          (catAtiva === "todas" ? catsComProdutos : catsComProdutos.filter(c => c === catAtiva)).map(cat => {
            const prods = produtos.filter(p => p.categoria === cat);
            if (!prods.length) return null;
            return (
              <div key={cat} ref={el => { catRefs.current[cat] = el; }}>
                {/* Cabeçalho da categoria */}
                <div className="px-4 pt-6 pb-3 flex items-center gap-2">
                  <span className="text-xl">{CAT_EMOJI[cat]}</span>
                  <h2 className="font-serif font-bold text-[#2A1F1A] text-lg">{cat}</h2>
                  <div className="flex-1 h-px bg-[#FAEDEF] ml-1" />
                </div>

                <div className="px-4 space-y-3">
                  {prods.map(p => {
                    const q = qtd(p.id);
                    return (
                      <div key={p.id} className="bg-white rounded-2xl overflow-hidden border border-[#FAEDEF] shadow-sm">
                        {/* Foto */}
                        {p.imagemUrl ? (
                          <div className="relative w-full h-44">
                            <Image src={p.imagemUrl} alt={p.nome} fill className="object-cover" />
                            {p.status === "encomenda" && (
                              <span className="absolute top-2 left-2 text-[0.6rem] bg-amber-500 text-white font-bold px-2 py-0.5 rounded-full">Sob encomenda</span>
                            )}
                          </div>
                        ) : (
                          <div className="w-full h-36 bg-gradient-to-br from-[#FAEDEF] to-[#FDF8F4] flex items-center justify-center">
                            <span className="text-5xl opacity-40">{CAT_EMOJI[cat]}</span>
                          </div>
                        )}

                        {/* Info */}
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-serif font-bold text-[#2A1F1A] text-base leading-snug">{p.nome}</h3>
                              {p.descricao && <p className="text-xs text-[#7A6860] mt-1 leading-relaxed">{p.descricao}</p>}
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            <p className="font-bold text-[#B87444] text-lg">{fmt(p.precoVenda)}</p>
                            <div className="flex items-center gap-2">
                              {q > 0 && (
                                <>
                                  <button onClick={() => removeItem(p.id)}
                                    className="w-9 h-9 rounded-full border-2 border-[#C4566A] text-[#C4566A] flex items-center justify-center hover:bg-[#FAEDEF] transition font-bold">
                                    <Minus size={15} />
                                  </button>
                                  <span className="w-6 text-center font-bold text-[#2A1F1A]">{q}</span>
                                </>
                              )}
                              <button onClick={() => addItem(p)}
                                className="w-9 h-9 rounded-full bg-[#C4566A] text-white flex items-center justify-center hover:bg-[#b04d60] transition shadow-sm">
                                <Plus size={15} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Carrinho flutuante */}
      {totalItens > 0 && (
        <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-2">
          {carrinhoAberto && (
            <div className="max-w-lg mx-auto bg-white rounded-2xl border border-[#FAEDEF] shadow-xl mb-3 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-[#2A1F1A] text-sm">Meu pedido</p>
                <button onClick={() => setCarrinhoAberto(false)} className="p-1 hover:bg-[#FAEDEF] rounded-full transition">
                  <X size={16} className="text-[#7A6860]" />
                </button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {carrinho.map(i => (
                  <div key={i.produto.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button onClick={() => removeItem(i.produto.id)} className="w-6 h-6 rounded-full bg-[#FAEDEF] text-[#C4566A] flex items-center justify-center text-xs font-bold hover:bg-[#E8A0AE] transition">
                        <Minus size={10} />
                      </button>
                      <span className="text-xs text-[#2A1F1A] font-medium">{i.quantidade}x {i.produto.nome}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#2A1F1A]">{fmt(i.produto.precoVenda * i.quantidade)}</span>
                      <button onClick={() => addItem(i.produto)} className="w-6 h-6 rounded-full bg-[#C4566A] text-white flex items-center justify-center hover:bg-[#b04d60] transition">
                        <Plus size={10} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-[#FAEDEF] mt-3 pt-2 flex justify-between text-sm font-bold text-[#2A1F1A]">
                <span>Total</span>
                <span className="text-[#B87444]">{fmt(total)}</span>
              </div>
            </div>
          )}

          <div className="max-w-lg mx-auto">
            <button
              onClick={() => carrinhoAberto ? setStep("dados") : setCarrinhoAberto(true)}
              className="w-full bg-[#C4566A] hover:bg-[#b04d60] text-white font-semibold px-5 py-4 rounded-2xl shadow-xl transition flex items-center justify-between"
            >
              <span className="bg-white/20 text-xs font-bold px-2.5 py-1 rounded-full">
                {totalItens} {totalItens === 1 ? "item" : "itens"}
              </span>
              <span className="flex items-center gap-1.5 text-sm">
                {carrinhoAberto ? "Finalizar pedido" : "Ver pedido"}
                <ChevronRight size={16} />
              </span>
              <span className="text-sm font-bold">{fmt(total)}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
