"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OldServiceCentersPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/partners/service-centers");
  }, [router]);
  return null;
}
