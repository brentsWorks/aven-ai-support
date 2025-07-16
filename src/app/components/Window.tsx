"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { fetchData, fetchEmbedAndUpsert } from "../actions/fetchData";

export function Window() {
  const [data, setData] = useState<any[]>([]);
  const [isPending, startTransition] = useTransition();
  const [embedResult, setEmbedResult] = useState<any>(null);

  const handleFetch = () => {
    startTransition(async () => {
      const result = await fetchData();
      setData(result);
    });
  };

  const handleFetchEmbedUpsert = () => {
    startTransition(async () => {
      setEmbedResult(null);
      const result = await fetchEmbedAndUpsert();
      setEmbedResult(result);
    });
  };

  // Optionally sort by title or another field
  const sortedData = [...data].sort((a, b) => (a.title || '').localeCompare(b.title || ''));

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 24 }}>Aven Data</h1>
      <div style={{ display: 'flex', gap: 16 }}>
        <Button onClick={handleFetch} disabled={isPending}>
          {isPending ? "Loading..." : "Fetch Combined Data"}
        </Button>
        <Button onClick={handleFetchEmbedUpsert} disabled={isPending}>
          {isPending ? "Processing..." : "Fetch, Embed & Upsert"}
        </Button>
      </div>
      {embedResult && (
        <Card style={{ marginTop: 32, background: '#e6ffe6' }}>
          <CardHeader>
            <CardTitle>Embed & Upsert Result</CardTitle>
          </CardHeader>
          <CardContent>
            <pre style={{ fontSize: 12 }}>{JSON.stringify(embedResult, null, 2)}</pre>
          </CardContent>
        </Card>
      )}
      <div style={{ marginTop: 32 }}>
        {data.length > 0 ? (
          data.map((item: any, idx: number) => (
            <Card key={idx} style={{ marginBottom: 20 }}>
              <CardHeader>
                <CardTitle>Item {idx + 1}</CardTitle>
              </CardHeader>
              <CardContent>
                <pre style={{ fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {JSON.stringify(item, null, 2)}
                </pre>
              </CardContent>
            </Card>
          ))
        ) : null}
      </div>
    </div>
  );
}