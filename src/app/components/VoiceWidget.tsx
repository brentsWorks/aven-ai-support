import React, { useState, useEffect } from "react";
import Vapi from "@vapi-ai/web";
import { Mic, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface VapiWidgetProps {
  apiKey: string;
  assistantId: string;
}

const VapiWidget: React.FC<VapiWidgetProps> = ({ apiKey, assistantId }) => {
  const [vapi, setVapi] = useState<Vapi | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    const vapiInstance = new Vapi(apiKey);
    setVapi(vapiInstance);

    // Event listeners
    vapiInstance.on("call-start", () => {
      console.log("Call started");
      setIsConnected(true);
    });

    vapiInstance.on("call-end", () => {
      console.log("Call ended");
      setIsConnected(false);
      setIsSpeaking(false);
    });

    vapiInstance.on("speech-start", () => {
      console.log("Assistant started speaking");
      setIsSpeaking(true);
    });

    vapiInstance.on("speech-end", () => {
      console.log("Assistant stopped speaking");
      setIsSpeaking(false);
    });

    vapiInstance.on("message", message => {
      if (message.type === "transcript") {
        console.log("Message:", message.transcript);
      }
    });

    vapiInstance.on("error", error => {
      console.error("Vapi error:", error);
    });

    return () => {
      vapiInstance?.stop();
    };
  }, [apiKey]);

  const startCall = () => {
    if (vapi) {
      vapi.start(assistantId);
    }
  };

  const endCall = () => {
    if (vapi) {
      vapi.stop();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {!isConnected ? (
        // Start Call Button
        <div className="text-center space-y-6">
          <div className="relative flex justify-center">
            {/* Outer glow rings */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full bg-primary/10 animate-ping animation-duration-2000"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-28 h-28 rounded-full bg-primary/20 animate-ping animation-duration-1500 animation-delay-500"></div>
            </div>

            {/* Button container with enhanced effects */}
            <div className="relative">
              {/* Background glow */}
              <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-primary via-primary/90 to-primary opacity-75 blur-xl"></div>
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-primary/80 via-primary to-primary/80 opacity-90 blur-lg"></div>

              {/* Main button */}
              <Button
                onClick={startCall}
                size="lg"
                className="relative h-24 w-24 rounded-full bg-gradient-to-br from-primary via-primary/95 to-primary/90 
                          hover:from-primary/90 hover:via-primary hover:to-primary 
                          shadow-2xl hover:shadow-primary/60 
                          transition-all duration-500 group 
                          border-4 border-white/20 
                          hover:border-white/30
                          hover:scale-110
                          active:scale-105"
              >
                {/* Icon with enhanced effects */}
                <div className="relative">
                  <Mic className="h-10 w-10 text-primary-foreground group-hover:scale-125 group-hover:rotate-12 transition-all duration-300 drop-shadow-2xl filter" />
                  {/* Icon glow */}
                  <div className="absolute inset-0 h-10 w-10">
                    <Mic className="h-10 w-10 text-white/50 blur-sm" />
                  </div>
                </div>
              </Button>
            </div>
          </div>
        </div>
      ) : (
        // Active Call Interface
        <div className="space-y-4">
          {/* Call Status Header */}
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-3 w-3 rounded-full ${isSpeaking ? "bg-red-500 animate-pulse" : "bg-green-500"}`}
                  ></div>
                  <span className="font-semibold text-sm">
                    {isSpeaking ? "Assistant Speaking..." : "Listening..."}
                  </span>
                </div>
                <Button
                  onClick={endCall}
                  variant="destructive"
                  size="sm"
                  className="gap-2"
                >
                  <PhoneOff className="h-4 w-4" />
                  End Call
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Active Call Controls */}
          <div className="flex justify-center gap-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span>Recording active</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VapiWidget;
