import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { LoginPage } from "@/components/LoginPage";
import { getSession } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  component: LoginRoute,
});

function LoginRoute() {
  const navigate = useNavigate();
  useEffect(() => {
    getSession().then((s) => { if (s) navigate({ to: "/" }); });
  }, []);
  return <LoginPage />;
}
