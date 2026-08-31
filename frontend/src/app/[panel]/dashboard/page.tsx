import { Suspense } from "react";
import { getSession } from "@/app/auth/sign-in/_handlers/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

async function UserProfileCard() {
  const session = await getSession();

  if (!session) {
    return (
      <div className="flex flex-col gap-4">
        <p>You are not logged in.</p>
      </div>
    );
  }

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>User Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-muted-foreground text-sm font-medium">Name</p>
          <p>{session.user.name}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-sm font-medium">Email</p>
          <p>{session.user.email}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-sm font-medium">Role</p>
          <p>{session.user.role || "N/A"}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-sm font-medium">Phone</p>
          <p>{session.user.phone || "-"}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  return (
    <div className="p-8">
      <h1 className="mb-6 text-3xl font-bold">Dashboard</h1>
      <Suspense
        fallback={
          <div className="text-muted-foreground">Loading profile...</div>
        }
      >
        <UserProfileCard />
      </Suspense>
    </div>
  );
}
