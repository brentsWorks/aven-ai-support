"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { fetchAvenCombinedData } from "../actions/fetchData";

export function Window() {
  const [data, setData] = useState<any[]>([]);
  const [isPending, startTransition] = useTransition();

  const handleFetch = () => {
    startTransition(async () => {
      const result = await fetchAvenCombinedData();
      setData(result);
    });
  };

  // Optionally sort by title or another field
  const sortedData = [...data].sort((a, b) => (a.title || '').localeCompare(b.title || ''));

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 24 }}>Aven Data</h1>
      <Button onClick={handleFetch} disabled={isPending}>
        {isPending ? "Loading..." : "Fetch Combined Data"}
      </Button>
      <div style={{ marginTop: 32 }}>
        {sortedData.length > 0 ? (
          sortedData.map((item: any, idx: number) => (
            <Card key={item.id + idx} style={{ marginBottom: 20 }}>
              <CardHeader>
                <CardTitle>{item.title}</CardTitle>
                {item.section_heading && (
                  <div style={{ fontWeight: 500, fontSize: 16, marginTop: 4 }}>{item.section_heading}</div>
                )}
                <div style={{ color: "#888", fontSize: 12, marginTop: 4 }}>
                  {item.date && <span>{item.date} • </span>}
                  {item.source_type && <span>{item.source_type} • </span>}
                  <span>{item.source}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ fontWeight: 500 }}>Summary:</span>
                  <div>{item.summary || "No summary available."}</div>
                </div>
                {item.content && (
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ fontWeight: 500 }}>Content:</span>
                    <div>{item.content}</div>
                  </div>
                )}
                {item.tags && item.tags.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ fontWeight: 500 }}>Tags:</span>
                    <span style={{ marginLeft: 8 }}>
                      {item.tags.map((tag: string) => (
                        <span
                          key={tag}
                          style={{
                            background: "#e0e7ff",
                            color: "#3730a3",
                            borderRadius: 4,
                            padding: "2px 8px",
                            marginRight: 4,
                            fontSize: 12,
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </span>
                  </div>
                )}
                <div>
                  <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb" }}>
                    {item.url}
                  </a>
                </div>
              </CardContent>
            </Card>
          ))
        ) : null}
      </div>
    </div>
  );
}