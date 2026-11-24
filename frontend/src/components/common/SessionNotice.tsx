import Link from "next/link";
import { useLocale } from "@/components/common/LocaleProvider";

interface SessionNoticeProps {
  message: string;
  showLogin?: boolean;
}

export default function SessionNotice({ message, showLogin = false }: SessionNoticeProps) {
  const { t } = useLocale();
  return (
    <main className="mx-auto max-w-5xl space-y-3 px-4 py-8">
      <p role="status" className="text-sm text-slate-700">{message}</p>
      {showLogin ? (
        <Link href="/login" className="text-sm font-semibold text-blue-700 underline">{t("common.login")}</Link>
      ) : null}
    </main>
  );
}
