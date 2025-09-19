import { useState } from "react";

export function useToast() {
  const [message, setMessage] = useState(null);

  const toast = ({ title, description }) => {
    setMessage({ title, description });
    setTimeout(() => setMessage(null), 3000);
  };

  return {
    toast,
    message,
  };
}
