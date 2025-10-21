import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AuthAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function SignupForm({ onSuccess }) {
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const { toast } = useToast();

  const submit = async (e) => {
    e.preventDefault();
    // 변경 사항: 기본적인 이메일 패턴을 검사하여 형식이 맞지 않으면 토스트로 사용자에게 안내합니다.
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      toast({ title: "이메일 형식 오류", description: "올바른 이메일 주소를 입력해주세요." });
      setError("이메일 형식을 다시 확인해주세요.");
      return;
    }
    // 변경 사항: 비밀번호는 8자 이상 입력되도록 조건을 완화하고, 토스트와 에러 메시지로 안내합니다.
    if (password.length < 8) {
      toast({ title: "비밀번호 길이 오류", description: "비밀번호는 8자 이상 입력해주세요." });
      setError("비밀번호는 8자 이상 입력해주세요.");
      return;
    }
    // 변경 사항: 비밀번호와 확인 값이 다르면 즉시 토스트로 알려 사용자 혼선을 줄입니다.
    if (password !== confirm) {
      toast({ title: "비밀번호 불일치", description: "비밀번호와 확인 값이 일치하는지 확인해주세요." });
      setError("비밀번호가 서로 다릅니다.");
      return;
    }
    // 변경 사항: 브라우저 기본 검증 이외에도 YYYY-MM-DD 형식을 검사하여 잘못된 생일 입력 시 토스트로 안내합니다.
    const birthPattern = /^\d{4}-\d{2}-\d{2}$/;
    const isBirthFormatValid = birthPattern.test(birthDate);
    let isBirthDateValid = false;
    if (isBirthFormatValid) {
      const [year, month, day] = birthDate.split("-").map(Number);
      const parsed = new Date(birthDate);
      isBirthDateValid =
        parsed.getFullYear() === year &&
        parsed.getMonth() + 1 === month &&
        parsed.getDate() === day;
    }
    if (!isBirthFormatValid || !isBirthDateValid) {
      toast({ title: "생일 형식 오류", description: "YYYY-MM-DD 형식으로 올바른 생일을 입력해주세요." });
      setError("생일 형식을 다시 확인해주세요.");
      return;
    }
    setError(""); setOk("");
    try {
      await AuthAPI.signup({ email, nickname, birthDate, password });
      setOk("회원가입 성공! 로그인 해주세요.");
      // 변경 사항: 가입 성공 시 사용자에게 토스트로 알린 뒤 로그인 탭으로 전환되도록 부모 콜백 호출.
      toast({ title: "회원가입 성공", description: "로그인 탭으로 이동합니다." });
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
