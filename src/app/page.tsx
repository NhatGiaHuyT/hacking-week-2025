"use client";

import Ragsubmit from "./components/ragsubmit";
import { useState } from "react";
import { TaskContext } from "./context/taskContext";

export default function Home() {
  const [taskType, setTaskType] = useState<string>("customer_support");

  return (
    <TaskContext.Provider value={{ taskType, setTaskType }}>
      <div className="min-h-screen bg-gray-50">
        <Ragsubmit />
      </div>
    </TaskContext.Provider>
  );
}
