import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AuthAPI } from "@/lib/api";

export default function SignupForm({ onSuccess }) {
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (password !== confirm) { setError("비밀번호 불일치"); return; }
    setError(""); setOk("");
    try {
      await AuthAPI.signup({ email, nickname, birthDate, password });
      setOk("회원가입 성공! 로그인 해주세요.");
      onSuccess?.();
    } catch (e) { setError(e.message || "회원가입 실패"); }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <Input placeholder="이메일" value={email} onChange={(e)=>setEmail(e.target.value)} autoComplete="email" required />
      <Input placeholder="닉네임" value={nickname} onChange={(e)=>setNickname(e.target.value)} autoComplete="nickname" required />
      <Input type="date" value={birthDate} onChange={(e)=>setBirthDate(e.target.value)} autoComplete="bday" required />
      <Input type="password" placeholder="비밀번호" value={password} onChange={(e)=>setPassword(e.target.value)} autoComplete="new-password" required />
      <Input type="password" placeholder="비밀번호 확인" value={confirm} onChange={(e)=>setConfirm(e.target.value)} autoComplete="new-password" required />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {ok && <p className="text-sm text-green-600">{ok}</p>}
      <Button type="submit" className="w-full">회원가입</Button>
    </form>
  );
}
