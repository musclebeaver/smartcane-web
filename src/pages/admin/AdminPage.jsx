import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Ban, Check, RefreshCcw, ShieldAlert, UserPlus } from "lucide-react";

const DEFAULT_FORM = {
  email: "",
  password: "",
  name: "",
  phoneNumber: "",
  role: "USER",
};

export default function AdminPage() {
  const { accessToken, me } = useAuth();
  const { toast } = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(null);

  // 관리자 전용 화면이므로 혹시라도 토큰이 없으면 API 호출을 생략합니다.
  const fetchUsers = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError("");
    try {
      const result = await AdminAPI.listUsers(accessToken);
      // 다양한 응답 포맷을 대응하기 위해 배열 형태로 안전하게 변환합니다.
      const extracted = Array.isArray(result)
        ? result
        : result?.content || result?.users || result?.data || [];
      setUsers(Array.isArray(extracted) ? extracted : []);
    } catch (err) {
      setError(err?.message || "회원 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateUser = async (event) => {
    event.preventDefault();
    if (!accessToken) return;
    setSaving(true);
    try {
      await AdminAPI.createUser(
        {
          email: form.email,
          password: form.password,
          name: form.name || undefined,
          phoneNumber: form.phoneNumber || undefined,
          roles: form.role ? [form.role] : undefined,
        },
        accessToken,
      );
      toast({
        title: "회원이 추가되었습니다.",
        description: "새로운 계정이 생성되어 목록에 반영됩니다.",
      });
      setForm(DEFAULT_FORM);
      await fetchUsers();
    } catch (err) {
      toast({
        title: "회원 추가에 실패했습니다.",
        description: err?.message || "입력 정보를 확인해 주세요.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (user, nextStatus) => {
    if (!accessToken) return;
    const userId = user?.id ?? user?.userId ?? user?.email;
    if (!userId) {
      toast({
        title: "회원 정보가 올바르지 않습니다.",
        description: "식별자를 찾을 수 없어 상태를 변경할 수 없습니다.",
      });
      return;
    }
    setStatusUpdating(userId);
    try {
      await AdminAPI.updateUserStatus(userId, nextStatus, accessToken);
      toast({
        title: "회원 상태가 변경되었습니다.",
        description: `${user?.email || "회원"}님의 상태가 ${nextStatus}로 업데이트되었습니다.`,
      });
      await fetchUsers();
    } catch (err) {
      toast({
        title: "상태 변경에 실패했습니다.",
        description: err?.message || "다시 시도해 주세요.",
      });
    } finally {
      setStatusUpdating(null);
    }
  };

  const normalizedUsers = useMemo(() => {
    return users.map((user) => {
      const roles = Array.isArray(user?.roles)
        ? user.roles
        : typeof user?.roles === "string"
          ? user.roles.split(/[,\s]+/).filter(Boolean)
          : [];
      const status = (() => {
        if (typeof user?.status === "string") return user.status.toUpperCase();
        if (user?.active === false) return "SUSPENDED";
        if (user?.active === true) return "ACTIVE";
        return "UNKNOWN";
      })();
      return {
        raw: user,
        id: user?.id ?? user?.userId ?? user?.email ?? Math.random().toString(36).slice(2),
        email: user?.email || "-",
        name: user?.name || user?.nickname || "-",
        phoneNumber: user?.phoneNumber || user?.tel || "-",
        roles,
        status,
        createdAt: user?.createdAt || user?.joinedAt || user?.created_at || "-",
      };
    });
  }, [users]);

  const stats = useMemo(() => {
    const total = normalizedUsers.length;
    const suspended = normalizedUsers.filter((user) => user.status === "SUSPENDED").length;
    const active = normalizedUsers.filter((user) => user.status === "ACTIVE").length;
    return { total, suspended, active };
  }, [normalizedUsers]);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">관리자 대시보드</h1>
            <p className="text-sm text-slate-600">
              {/* 로그인한 관리자가 누구인지 한눈에 확인할 수 있도록 간단한 설명을 덧붙였습니다. */}
              {me?.email || "관리자"} 계정으로 접속 중입니다.
            </p>
          </div>
          <div className="flex gap-3 text-sm text-slate-600">
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-2 shadow-sm">
              총 회원수 <span className="ml-2 font-semibold text-slate-900">{stats.total}</span>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-emerald-700 shadow-sm">
              활성 회원 <span className="ml-2 font-semibold text-emerald-900">{stats.active}</span>
            </div>
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-rose-700 shadow-sm">
              정지 회원 <span className="ml-2 font-semibold text-rose-900">{stats.suspended}</span>
            </div>
          </div>
        </header>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <UserPlus className="h-5 w-5" /> 신규 회원 등록
              </CardTitle>
              <CardDescription>필수 정보만 입력해도 계정을 바로 생성할 수 있습니다.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateUser} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">이메일 *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="user@example.com"
                  required
                  value={form.email}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">임시 비밀번호 *</Label>
                <Input
                  id="password"
                  name="password"
                  type="text"
                  placeholder="초기 비밀번호를 입력하세요"
                  required
                  value={form.password}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">이름</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="홍길동"
                  value={form.name}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">연락처</Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  placeholder="010-0000-0000"
                  value={form.phoneNumber}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="role">권한</Label>
                <select
                  id="role"
                  name="role"
                  value={form.role}
                  onChange={handleInputChange}
                  className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="USER">일반 사용자</option>
                  <option value="ADMIN">관리자</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" className="w-full sm:w-auto" disabled={saving}>
                  {saving ? "추가 중..." : "회원 추가"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <ShieldAlert className="h-5 w-5" /> 회원 목록 및 제재 관리
              </CardTitle>
              <CardDescription>
                회원 상태를 실시간으로 모니터링하고 필요 시 정지 또는 해제를 진행할 수 있습니다.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
              <RefreshCcw className="mr-2 h-4 w-4" /> 새로고침
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="py-10 text-center text-sm text-slate-500">회원 목록을 불러오는 중입니다...</p>
            ) : error ? (
              <p className="py-10 text-center text-sm text-rose-600">{error}</p>
            ) : normalizedUsers.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-500">등록된 회원이 없습니다.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-100">
                    <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-3">이메일</th>
                      <th className="px-4 py-3">이름</th>
                      <th className="px-4 py-3">연락처</th>
                      <th className="px-4 py-3">권한</th>
                      <th className="px-4 py-3">상태</th>
                      <th className="px-4 py-3">가입일</th>
                      <th className="px-4 py-3 text-right">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white text-sm text-slate-700">
                    {normalizedUsers.map((user) => {
                      const isSuspended = user.status === "SUSPENDED";
                      const nextStatus = isSuspended ? "ACTIVE" : "SUSPENDED";
                      return (
                        <tr key={user.id}>
                          <td className="px-4 py-3 font-medium text-slate-900">{user.email}</td>
                          <td className="px-4 py-3">{user.name}</td>
                          <td className="px-4 py-3">{user.phoneNumber}</td>
                          <td className="px-4 py-3">
                            {user.roles.length > 0 ? user.roles.join(", ") : "미지정"}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                isSuspended
                                  ? "bg-rose-100 text-rose-700"
                                  : user.status === "ACTIVE"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {isSuspended ? "정지" : user.status === "ACTIVE" ? "활성" : "미정"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500">{user.createdAt}</td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              size="sm"
                              variant={isSuspended ? "secondary" : "destructive"}
                              onClick={() => handleStatusChange(user.raw, nextStatus)}
                              disabled={statusUpdating === user.id}
                            >
                              {statusUpdating === user.id ? (
                                "처리 중..."
                              ) : isSuspended ? (
                                <>
                                  <Check className="mr-1 h-4 w-4" /> 정지 해제
                                </>
                              ) : (
                                <>
                                  <Ban className="mr-1 h-4 w-4" /> 정지
                                </>
                              )}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
