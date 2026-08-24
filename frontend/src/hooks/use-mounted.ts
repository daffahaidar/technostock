import { useEffect, useState } from "react";

export default function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  return {
    isMounted: mounted,
  };
}
