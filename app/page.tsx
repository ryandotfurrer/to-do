"use client";

import {
  Authenticated,
  Unauthenticated,
  useMutation,
  useQuery,
} from "convex/react";
import { api } from "../convex/_generated/api";
import Link from "next/link";
import { SignUpButton, SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { useState } from "react";
import { Id } from "../convex/_generated/dataModel";
import { SquarePen, Trash2 } from "lucide-react";
function TaskList() {
  const { user } = useUser();
  const clerkUserId = user?.id;
  const [optimisticTasks, setOptimisticTasks] = useState<
    { _id: Id<"tasks">; value: string; completed: boolean }[]
  >([]);

  // Apply optimistic updates
  const tasks = useQuery(api.myFunctions.getTaskList, {
    clerkUserId: clerkUserId ?? "",
  });
  const displayTasks = optimisticTasks.length > 0 ? optimisticTasks : tasks;
  const taskCount = displayTasks?.filter((task) => !task.completed).length;
  const setTaskCompleted = useMutation(api.myFunctions.setTaskCompleted);
  const deleteTask = useMutation(api.myFunctions.deleteTask);
  const createTask = useMutation(api.myFunctions.createTask);
  const editTask = useMutation(api.myFunctions.editTask);

  const handleEditTask = async (taskId: Id<"tasks">, newValue: string) => {
    // Apply optimistic update
    setOptimisticTasks(
      tasks?.map((t) => (t._id === taskId ? { ...t, value: newValue } : t)) ??
        [],
    );
    // Make the actual update
    await editTask({ taskId, value: newValue });
    // Clear optimistic state after successful update

    setOptimisticTasks([]);
  };

  const [editingTaskId, setEditingTaskId] = useState<Id<"tasks"> | null>(null);
  if (displayTasks === undefined) {
    return <p>Loading tasks...</p>;
  }

  return (
    <>
      <p>
        You have {taskCount} {taskCount === 1 ? "task" : "tasks"} left for the
        day.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);
          const value = formData.get("value") as string;
          createTask({ value, clerkUserId: clerkUserId ?? "" });
          (e.target as HTMLFormElement).reset();
        }}
      >
        <input
          className="border-2 border-gray-300 rounded-md p-2"
          type="text"
          name="value"
        />
        <button
          className="bg-foreground text-background px-4 py-2 rounded-md"
          type="submit"
        >
          Create Task
        </button>
      </form>

      <ul className="list-none space-y-2">
        {displayTasks.map(({ _id, value, completed }) => (
          <div key={_id} className="flex flex-row justify-between">
            {editingTaskId === _id ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setEditingTaskId(null);
                  setOptimisticTasks([]);
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={value}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    handleEditTask(_id, newValue);
                  }}
                  className="border-2 border-gray-300 rounded-md p-1"
                  autoFocus
                />
                <button
                  type="submit"
                  className="bg-foreground text-background px-2 py-1 rounded-md"
                >
                  Save
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2 w-full justify-between">
                <div className="flex items-center gap-2">
                  <input
                    checked={completed}
                    type="checkbox"
                    name={value}
                    id={_id}
                    onChange={() => {
                      setTaskCompleted({ taskId: _id, completed: !completed });
                    }}
                  />
                  <li
                    id={_id}
                    className={completed ? "line-through text-gray-500" : ""}
                  >
                    {value}
                  </li>
                </div>
                <div className="flex flex-row gap-2 *:p-1 *:text-gray-400">
                  <button
                    type="button"
                    onClick={() => {
                      deleteTask({ taskId: _id });
                    }}
                  >
                    <Trash2 />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTaskId(_id);
                    }}
                  >
                    <SquarePen />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </ul>
    </>
  );
}

export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-10 bg-background p-4 border-b-2 border-slate-200 dark:border-slate-800 flex flex-row justify-between items-center">
        Tasks
        <UserButton />
      </header>
      <main className="p-8 flex flex-col gap-8">
        <h1 className="text-4xl font-bold text-center">Tasks</h1>
        <Authenticated>
          <Content />
        </Authenticated>
        <Unauthenticated>
          <SignInForm />
        </Unauthenticated>
      </main>
    </>
  );
}

function SignInForm() {
  return (
    <div className="flex flex-col gap-8 w-96 mx-auto">
      <p>Log in to see your tasks</p>
      <SignInButton mode="modal">
        <button className="bg-foreground text-background px-4 py-2 rounded-md">
          Sign in
        </button>
      </SignInButton>
      <SignUpButton mode="modal">
        <button className="bg-foreground text-background px-4 py-2 rounded-md">
          Sign up
        </button>
      </SignUpButton>
    </div>
  );
}

function Content() {
  const { user } = useUser();
  const { viewer, numbers } =
    useQuery(api.myFunctions.listNumbers, {
      count: 10,
    }) ?? {};

  if (viewer === undefined || numbers === undefined) {
    return (
      <div className="mx-auto">
        <p>loading... (consider a loading skeleton)</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 max-w-lg mx-auto">
      <p>
        Welcome, {user?.firstName ?? user?.emailAddresses[0]?.emailAddress}!
      </p>
      <TaskList />
      <p className="bg-amber-200 p-4 rounded-md">
        See the{" "}
        <Link href="/server" className="underline hover:no-underline">
          /server route
        </Link>{" "}
        for an example of loading data in a server component
      </p>
    </div>
  );
}
