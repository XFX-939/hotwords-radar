import Link from "next/link";
import { EmptyState, Panel } from "@/components/ui";

export default function NotFound() {
  return (
    <Panel>
      <EmptyState title="页面不存在" description="返回首页继续查看今日热词。" />
      <div className="mt-4 text-center">
        <Link href="/" className="btn-secondary inline-flex rounded-md px-3 py-2 text-sm">
          返回首页
        </Link>
      </div>
    </Panel>
  );
}
