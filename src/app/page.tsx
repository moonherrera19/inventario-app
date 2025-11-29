import { redirect } from "next/navigation";

export default function Home() {
  // Redirección inmediata al login
  redirect("/login");
}
