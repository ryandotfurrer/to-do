"use client";

import {
  Authenticated,
  Unauthenticated,
  useMutation,
  useQuery,
} from "convex/react";
import { api } from "../convex/_generated/api";
import Link from "next/link";
import { SignUpButton } from "@clerk/nextjs";
import { SignInButton } from "@clerk/nextjs";
import { UserButton } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";

function TaskList() {
  const { user } = useUser();
  const clerkUserId = user?.id;
  const tasks = useQuery(api.myFunctions.getTaskList, {
    clerkUserId: clerkUserId ?? "",
  });
  const setTaskCompleted = useMutation(api.myFunctions.setTaskCompleted);
  const deleteTask = useMutation(api.myFunctions.deleteTask);
  const createTask = useMutation(api.myFunctions.createTask);

  if (tasks === undefined) {
    return <p>Loading tasks...</p>;
  }

  return (
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
      <ul className="list-none">
        {tasks.map(({ _id, value, completed }) => (
          <div key={_id}>
            <input
              checked={completed}
              type="checkbox"
              name={value}
              id={_id}
              onChange={() => {
                setTaskCompleted({ taskId: _id, completed: !completed });
              }}
            />
            <li className={completed ? "line-through text-gray-500" : ""}>
              {value}
            </li>
            <button
              type="button"
              onClick={() => {
                deleteTask({ taskId: _id });
              }}
            >
              Delete
            </button>
          </div>
        ))}
      </ul>
    </form>
  );
}

export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-10 bg-background p-4 border-b-2 border-slate-200 dark:border-slate-800 flex flex-row justify-between items-center">
        Convex + Next.js + Clerk
        <UserButton />
      </header>
      <main className="p-8 flex flex-col gap-8">
        <h1 className="text-4xl font-bold text-center">
          Convex + Next.js + Clerk
        </h1>
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
      <p>Log in to see the numbers</p>
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
  const addNumber = useMutation(api.myFunctions.addNumber);

  if (viewer === undefined || numbers === undefined) {
    return (
      <div className="mx-auto">
        <p>loading... (consider a loading skeleton)</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-lg mx-auto">
      <p>
        Welcome, {user?.firstName ?? user?.emailAddresses[0]?.emailAddress}!
      </p>
      <p>Hey there, you have {numbers.length} tasks left to complete today.</p>
      <TaskList />
      <p>
        Click the button below and open this page in another window - this data
        is persisted in the Convex cloud database!
      </p>
      <p>
        <button
          className="bg-foreground text-background text-sm px-4 py-2 rounded-md"
          onClick={() => {
            void addNumber({ value: Math.floor(Math.random() * 10) });
          }}
        >
          Add a random number
        </button>
      </p>
      <p>
        Numbers:{" "}
        {numbers?.length === 0
          ? "Click the button!"
          : (numbers?.join(", ") ?? "...")}
      </p>
      <p>
        See the{" "}
        <Link href="/server" className="underline hover:no-underline">
          /server route
        </Link>{" "}
        for an example of loading data in a server component
      </p>
    </div>
  );
}
