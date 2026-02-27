"use client";

import Link from "next/link";
import { ShieldCheck, UserCheck } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0B2B] via-[#1a1b4b] to-[#2a1b5b] flex items-center justify-center px-4">
      {/* Decorative blobs */}
      <div className="absolute -top-12 -left-24 w-[500px] h-[500px] bg-[#4F56D3]/50 rounded-full blur-[120px]" />
      <div className="absolute top-24 right-[-50px] w-[400px] h-[400px] bg-[#7B61FF]/25 rounded-full blur-[100px]" />

      <div className="relative z-10 w-full max-w-md flex flex-col items-center gap-8">
        {/* Logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-land.svg" alt="casco.kz" className="h-10" />

        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Панель управления</h1>
          <p className="text-[#8592AD] text-sm">Выберите тип авторизации</p>
        </div>

        <div className="w-full flex flex-col gap-4">
          <Link
            href="/admin/login"
            className="flex items-center gap-4 w-full bg-white/[0.08] border border-white/[0.13] rounded-2xl p-5 hover:bg-white/[0.14] transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-[#4F56D3] flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-white font-semibold text-base group-hover:text-[#B8C2F3] transition-colors">
                Администратор
              </span>
              <span className="text-[#8592AD] text-sm">Управление системой</span>
            </div>
          </Link>

          <Link
            href="/warranty-admin/login"
            className="flex items-center gap-4 w-full bg-white/[0.08] border border-white/[0.13] rounded-2xl p-5 hover:bg-white/[0.14] transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-[#E27109] flex items-center justify-center flex-shrink-0">
              <UserCheck className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-white font-semibold text-base group-hover:text-[#B8C2F3] transition-colors">
                Менеджер гарантий
              </span>
              <span className="text-[#8592AD] text-sm">Создание и управление гарантиями</span>
            </div>
          </Link>
        </div>

        <p className="text-[#8592AD]/50 text-xs mt-4">&copy; 2026 casco.kz</p>
      </div>
    </div>
  );
}
