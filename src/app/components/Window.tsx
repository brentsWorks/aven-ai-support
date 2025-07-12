"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { fetchAvenData } from "../actions/fetchData";

export function Window() {
  const [data, setData] = useState<any>(null);
  const [isPending, startTransition] = useTransition();

  const handleFetch = () => {
    startTransition(async () => {
      const result = await fetchAvenData();
      setData(result);
    });
  };

  return (
    <div>
      <h1>Aven</h1>
      <Button onClick={handleFetch} disabled={isPending}>
        {isPending ? "Loading..." : "Fetch Aven Data"}
      </Button>
      {data && (
        <pre style={{ textAlign: "left", marginTop: 16 }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}