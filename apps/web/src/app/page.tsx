// ---------------------------------------------------------------------------
// Landing page — redirects to /chat
// ---------------------------------------------------------------------------

import { redirect } from "next/navigation";

export default function Home() {
  redirect("/chat");
}
