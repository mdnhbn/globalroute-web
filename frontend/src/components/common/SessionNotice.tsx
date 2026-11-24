import Link from "next/link";

interface SessionNoticeProps {
  message: string;
  showLogin?: boolean;
}

export default function SessionNotice({ message, showLogin = false }: SessionNoticeProps) {
  return (
    <main className="mx-auto max-w-5xl space-y-3 px-4 py-8">
      <p role="status" className="text-sm text-slate-700">{message}</p>
      {showLogin ? (
        <Link href="/login" className="text-sm font-semibold text-blue-700 underline">লগইন করুন</Link>
      ) : null}
    </main>
  );
}
