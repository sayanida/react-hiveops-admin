/*
useToast.js
	Custom hook to manage toast (temporary) notifications
	•	Keeps internal state for toast visibility
	•	showToast(msg, isError) shows a toast, which automatically hides after a short time
*/

import { useState, useCallback } from "react";

export default function useToast() {
  const [toast, setToast] = useState({ msg: "", error: false, visible: false });

  const showToast = useCallback((msg, isError = false) => {
    setToast({ msg, error: isError, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2600);
  }, []);

  return { toast, showToast };
}
