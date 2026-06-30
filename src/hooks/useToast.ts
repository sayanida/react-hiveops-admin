/*
useToast.ts
	Custom hook to manage toast (temporary) notifications
	•	Keeps internal state for toast visibility
	•	showToast(msg, isError) shows a toast, which automatically hides after a short time
*/

import { useState, useCallback } from "react";

interface Toast {
  msg: string;
  error: boolean;
  visible: boolean;
}

interface UseToastReturn {
  toast: Toast;
  showToast: (msg: string, isError?: boolean) => void;
}

export default function useToast(): UseToastReturn {
  const [toast, setToast] = useState<Toast>({
    msg: "",
    error: false,
    visible: false,
  });

  const showToast = useCallback((msg: string, isError: boolean = false) => {
    setToast({ msg, error: isError, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2600);
  }, []);

  return { toast, showToast };
}
