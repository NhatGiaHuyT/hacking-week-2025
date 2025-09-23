"use client";

import Ragsubmit from "./components/ragsubmit";
import { useState, useEffect } from "react";
import { TaskContext } from "./context/taskContext";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Home() {
  const [taskType, setTaskType] = useState<string>("customer_support");
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <TaskContext.Provider value={{ taskType, setTaskType }}>
          <Ragsubmit /> 
    </TaskContext.Provider>
  );
}
