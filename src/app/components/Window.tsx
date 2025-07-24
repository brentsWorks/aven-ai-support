"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { fetchData, fetchEmbedAndUpsert } from "../actions/fetchData";
import VapiWidget from "./VoiceWidget";

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
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      {/* VoiceWidget Section */}
      <VapiWidget 
        apiKey={process.env.NEXT_PUBLIC_VAPI_PUBLIC_API_KEY as string}
        assistantId={process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID as string}
      />

      {/* Data Actions Section */}
      <Card className="shadow">
        <CardHeader>
          <CardTitle>Data Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Button onClick={handleFetch} disabled={isPending}>
              {isPending ? "Loading..." : "Fetch Combined Data"}
            </Button>
            <Button onClick={handleFetchEmbedUpsert} disabled={isPending}>
              {isPending ? "Processing..." : "Fetch, Embed & Upsert"}
            </Button>
          </div>
          {embedResult && (
            <Card className="bg-white border border-gray-300 text-gray-900 shadow-inner mt-4">
              <CardHeader>
                <CardTitle>Embed & Upsert Result</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-sm bg-gray-100 p-3 rounded overflow-x-auto">{JSON.stringify(embedResult, null, 2)}</pre>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Data Display Section */}
      {data.length > 0 && (
        <Card className="shadow">
          <CardHeader>
            <CardTitle>Fetched Data Chunks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sortedData.map((item: any, idx: number) => (
                <Card key={idx} className="bg-gray-50 border border-gray-200">
                  <CardHeader>
                    <CardTitle>Item {idx + 1}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs whitespace-pre-wrap break-words">{JSON.stringify(item, null, 2)}</pre>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}