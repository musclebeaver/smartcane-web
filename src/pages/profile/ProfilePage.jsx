import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut } from "lucide-react";

export default function ProfilePage() {
  const auth = useAuth();
  if (!auth?.me) return <p className="text-gray-500 text-center">로딩 중...</p>;
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="flex justify-between items-center">
          <CardTitle>프로필</CardTitle>
          <Button variant="ghost" size="icon" onClick={auth.logout} title="로그아웃">
            <LogOut className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <pre className="text-sm bg-gray-100 p-2 rounded overflow-x-auto">
            {JSON.stringify(auth.me, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
