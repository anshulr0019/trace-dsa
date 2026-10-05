"use client";
import { useEffect, useState } from "react";
import { cloud, result } from "@/lib/product/cloud";
import { useAccount } from "../product/account";
export function useOwnerAccess() {
  const { user, ready } = useAccount(),
    [owner, setOwner] = useState(false),
    [checked, setChecked] = useState(!cloud),
    [error, setError] = useState("");
  useEffect(() => {
    setOwner(false);
    setError("");
    if (!cloud || !user) {
      setChecked(ready);
      return;
    }
    let active = true;
    setChecked(false);
    void result(cloud.rpc("trace_is_admin"))
      .then((value) => {
        if (active) setOwner(value === true);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setChecked(true);
      });
    return () => {
      active = false;
    };
  }, [user, ready]);
  return { owner, checked, error, local: !cloud };
}
