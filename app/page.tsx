import { globalGETRateLimit } from "@/lib/requests";
import type { JSX } from "react";
import { Search } from "lucide-react";
import { SearchInput } from "@/components/SearchForm";

export default async function ProfileContent(): Promise<JSX.Element> {
  if (!(await globalGETRateLimit())) {
    return <div>Too many requests</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[linear-gradient(135deg,#f1eff9_0%,#e3e1f4_40%,#d5e4f6_75%,#c7dcf4_100%)]">
      <div className="flex flex-col items-center gap-8">
        <form action="/search" method="GET" className="relative">
          <span
            aria-hidden
            className="
      absolute inset-[-12px] rounded-[18px]
      border border-white/35
      bg-white/20
      backdrop-blur-[10px]
      pointer-events-none
      -z-10
    "
          />
          <div className="flex items-center gap-4 bg-white rounded-[16px] px-7 py-5 min-w-[500px]">
            <Search className="w-[22px] h-[22px] opacity-60 text-current" />
            <SearchInput
              placeholder="What would you like to find today?"
              className="flex-1 text-[18px] placeholder-[#999] text-[#666] focus:outline-none bg-transparent border-0"
            />
          </div>
        </form>
      </div>
    </div>
  );
}
