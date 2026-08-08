import { Redirect } from "expo-router";
import { useEffect } from "react";

import { Loading } from "../src/components/ui";
import { useWelift } from "../src/store/welift";

export default function Index() {
  const hydrated = useWelift((s) => s.hydrated);
  const meId = useWelift((s) => s.meId);
  const setHydrated = useWelift((s) => s.setHydrated);

  useEffect(() => {
    const unsub = useWelift.persist.onFinishHydration(() => setHydrated(true));
    if (useWelift.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, [setHydrated]);

  if (!hydrated) return <Loading />;
  if (!meId) return <Redirect href="/onboard" />;
  return <Redirect href="/week" />;
}
