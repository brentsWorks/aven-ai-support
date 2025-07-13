"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { fetchAvenCombinedData } from "../actions/fetchData";
import { fetchAvenDynamicData } from "../actions/fetchData";
import { getEmbedding } from "../actions/embedData";
import { normalizeText } from "@/lib/utils";

export function Window() {
  const [data, setData] = useState<any[]>([]);
  const [isPending, startTransition] = useTransition();
  const [embedding, setEmbedding] = useState<number[] | null>(null);
  const [embedStatus, setEmbedStatus] = useState<string>("");
  const [debugMsg, setDebugMsg] = useState<string>("");
  const [normalizedText, setNormalizedText] = useState<string>("");

  const handleFetch = () => {
    startTransition(async () => {
      const result = await fetchAvenCombinedData();
      setData(result);
    });
  };

  const handleFetchDynamic = () => {
    startTransition(async () => {
      const dynamicData = await fetchAvenDynamicData();
      setData(dynamicData);
      setDebugMsg(`Fetched ${dynamicData.length} dynamic items.`);
    });
  };

  const handleEmbed = async () => {
    setEmbedStatus("Embedding...");
    setEmbedding(null);
    try {
      const chunks = data.length > 0 ? data : await fetchAvenCombinedData();
      const firstChunk = chunks.find((chunk: any) => !!chunk.content);
      if (!firstChunk) {
        setEmbedStatus("No chunk with content found.");
        return;
      }
      setEmbedStatus(`Embedding chunk: ${firstChunk.title}`);
      const embedding = await getEmbedding(firstChunk.content);
      if (embedding) {
        setEmbedding(embedding);
        setEmbedStatus("Embedding successful!");
        // Optionally log to server here
      } else {
        setEmbedStatus("Failed to get embedding.");
      }
    } catch (err) {
      setEmbedStatus("Error during embedding.");
    }
  };

  const handleNormalizeFirst = () => {
    if (data.length > 0) {
      // Try to find a content or text field
      const item = data[0];
      const raw = item.content || item.text || item.summary || "";
      setNormalizedText(normalizeText(raw));
    } else {
      setNormalizedText("");
    }
  };

  // Optionally sort by title or another field
  const sortedData = [...data].sort((a, b) => (a.title || '').localeCompare(b.title || ''));

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 24 }}>Aven Data</h1>
      <Button onClick={handleFetch} disabled={isPending}>
        {isPending ? "Loading..." : "Fetch Combined Data"}
      </Button>
      <Button onClick={handleFetchDynamic} style={{ marginLeft: 16 }}>
        Fetch Only Dynamic Data
      </Button>
      <Button onClick={handleEmbed} style={{ marginLeft: 16 }}>
        Test Embedding
      </Button>
      <Button onClick={handleNormalizeFirst} style={{ marginLeft: 16 }}>
        Show Normalized Text (First Chunk)
      </Button>
      {embedStatus && <div style={{ marginTop: 16, fontWeight: 500 }}>{embedStatus}</div>}
      {debugMsg && <div style={{ marginTop: 16, color: '#b91c1c', fontWeight: 500 }}>{debugMsg}</div>}
      {embedding && (
        <div style={{ marginTop: 8 }}>
          <div>Embedding (first 5 values):</div>
          <pre>{JSON.stringify(embedding.slice(0, 5))} ...</pre>
        </div>
      )}
      {normalizedText && (
        <div style={{ marginTop: 24 }}>
          <Card>
            <CardHeader>
              <CardTitle>Normalized Text (First Chunk)</CardTitle>
            </CardHeader>
            <CardContent>
              <pre style={{ fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{normalizedText}</pre>
            </CardContent>
          </Card>
        </div>
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