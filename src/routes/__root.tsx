import { Outlet, createRootRoute, redirect } from "@tanstack/react-router";
import { getSession } from "@/lib/auth";

export const Route = createRootRoute({
  beforeLoad: async ({ location }) => {
    const session = await getSession();
    if (!session && !location.pathname.startsWith("/login")) {
      throw redirect({ to: "/login" });
    }
  },
  component: () => <Outlet />,
});
