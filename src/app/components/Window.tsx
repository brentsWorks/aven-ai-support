"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { fetchAvenCombinedData } from "../actions/fetchData";
import { fetchAvenDynamicData } from "../actions/fetchData";
import { getEmbedding, getEmbeddingsBatch } from "../actions/embedData";
import { upsertChunksToPineconeAction } from "../actions/upsertAction";
import { normalizeText } from "@/lib/utils";

export function Window() {
  const [data, setData] = useState<any[]>([]);
  const [isPending, startTransition] = useTransition();
  const [embedding, setEmbedding] = useState<number[] | null>(null);
  const [embedStatus, setEmbedStatus] = useState<string>("");
  const [batchEmbeddings, setBatchEmbeddings] = useState<(number[] | null)[] | null>(null);
  const [upsertStatus, setUpsertStatus] = useState<string>("");

  const handleFetch = () => {
    startTransition(async () => {
      const result = await fetchAvenCombinedData();
      setData(result);
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

  const handleBatchEmbed = async () => {
    setEmbedStatus("Batch embedding...");
    setBatchEmbeddings(null);
    try {
      const chunks = data.length > 0 ? data : await fetchAvenCombinedData();
      const contents = chunks.map((chunk: any) => chunk.content);
      const embeddings = await getEmbeddingsBatch(contents);
      setBatchEmbeddings(embeddings);
      setEmbedStatus(`Batch embedding successful! Embedded ${embeddings.length} chunks.`);
    } catch (err) {
      setEmbedStatus("Error during batch embedding.");
    }
  };

  const handleUpsertToPinecone = async () => {
    setUpsertStatus("Upserting to Pinecone...");
    try {
      const chunks = data.length > 0 ? data : await fetchAvenCombinedData();
      await upsertChunksToPineconeAction(chunks);
      setUpsertStatus(`Upserted ${chunks.length} chunks to Pinecone successfully!`);
    } catch (err) {
      setUpsertStatus("Error during upsert to Pinecone.");
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
      <Button onClick={handleEmbed} style={{ marginLeft: 16 }}>
        Test Embedding
      </Button>
      <Button onClick={handleBatchEmbed} style={{ marginLeft: 16 }}>
        Batch Embed All Chunks
      </Button>
      <Button onClick={handleUpsertToPinecone} style={{ marginLeft: 16 }}>
        Upsert All Chunks to Pinecone
      </Button>
      {embedStatus && <div style={{ marginTop: 16, fontWeight: 500 }}>{embedStatus}</div>}
      {upsertStatus && <div style={{ marginTop: 16, fontWeight: 500 }}>{upsertStatus}</div>}
      {embedding && (
        <div style={{ marginTop: 8 }}>
          <div>Embedding (first 5 values):</div>
          <pre>{JSON.stringify(embedding.slice(0, 5))} ...</pre>
        </div>
      )}
      {batchEmbeddings && (
        <div style={{ marginTop: 16 }}>
          <div>Batch Embeddings (first 5, first 5 values each):</div>
          <pre style={{ fontSize: 12 }}>
            {JSON.stringify(batchEmbeddings.slice(0, 5).map(e => e ? e.slice(0, 5) : null), null, 2)} ...
          </pre>
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