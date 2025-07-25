"use client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  Mic,
  MessageCircle,
  HelpCircle,
  Book,
  Settings,
  Info,
  CheckCircle2,
} from "lucide-react";
import VapiWidget from "./VoiceWidget";

export function Window() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header Section */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="mx-auto max-w-4xl space-y-4">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Aven AI Support
            </h1>
            <p className="text-lg text-muted-foreground">
              Get instant help with our AI-powered voice assistant
            </p>
          </div>
        </div>
      </div>

      {/* Main Content - Voice Widget Front and Center */}
      <div className="container mx-auto px-4 py-12">
        {/* Primary Voice Widget Section */}
        <div className="mb-16 text-center">
          <div className="mx-auto max-w-2xl space-y-8">
            {/* Main CTA Card with Voice Widget */}
            <Card className="border-2 border-primary/20 bg-gradient-to-b from-primary/5 to-background shadow-2xl">
              <CardContent className="p-12">
                <div className="space-y-8">
                  {/* Icon and Title */}
                  <div className="space-y-4">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 ring-4 ring-blue-500/20">
                      <MessageCircle className="h-10 w-10 text-blue-600" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-3xl font-bold">
                        Start a Conversation
                      </h2>
                      <p className="text-lg text-muted-foreground">
                        Click the microphone below to begin talking with our AI
                        assistant
                      </p>
                    </div>
                  </div>

                  {/* Embedded Voice Widget */}
                  <div className="flex justify-center">
                    <div className="relative">
                      {/* Enhanced Background */}
                      <div className="absolute -inset-4 rounded-full bg-primary/20"></div>
                      <div className="absolute -inset-2 rounded-full bg-primary/30"></div>
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/40 to-primary/60"></div>

                      {/* Glow Effect */}
                      <div className="absolute inset-0 rounded-full bg-primary/50 blur-xl opacity-75"></div>

                      {/* Main Voice Widget */}
                      <div className="relative z-10 transform transition-transform duration-300 hover:scale-105">
                        <VapiWidget
                          apiKey={process.env.NEXT_PUBLIC_VAPI_PUBLIC_API_KEY!}
                          assistantId={process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID!}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quick Instructions */}
                  <div className="mx-auto max-w-md space-y-2">
                    <p className="text-sm font-medium text-primary">
                      🎤 Simply click and speak naturally
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Our AI will understand your question and provide instant
                      assistance
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status Indicator */}
            <div className="flex justify-center">
              <Card className="border-green-200 bg-green-50/50">
                <CardContent className="flex items-center gap-3 p-3">
                  <div className="flex h-2 w-2">
                    <CheckCircle2 className="h-2 w-2 animate-pulse text-green-500" />
                  </div>
                  <span className="text-sm font-medium text-green-800">
                    AI Assistant Online
                  </span>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Secondary Content - How It Works */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* How It Works */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <MessageCircle className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-xl">How It Works</CardTitle>
              <CardDescription>Three simple steps to get help</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    step: "1",
                    title: "Click & Speak",
                    description:
                      "Press the microphone button above and describe your issue",
                    color: "bg-blue-500",
                  },
                  {
                    step: "2",
                    title: "AI Listens",
                    description:
                      "Our assistant processes your question in real-time",
                    color: "bg-green-500",
                  },
                  {
                    step: "3",
                    title: "Get Answers",
                    description: "Receive instant, personalized assistance",
                    color: "bg-purple-500",
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${item.color} text-white text-xs font-semibold`}
                    >
                      {item.step}
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-semibold text-sm">{item.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* What We Help With */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <HelpCircle className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-xl">What We Help With</CardTitle>
              <CardDescription>Support across multiple areas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  {
                    icon: HelpCircle,
                    title: "Technical Support",
                    description: "Bug fixes & troubleshooting",
                    color: "text-blue-600",
                    bgColor: "bg-blue-50",
                  },
                  {
                    icon: Book,
                    title: "Documentation",
                    description: "Guides & how-to articles",
                    color: "text-green-600",
                    bgColor: "bg-green-50",
                  },
                  {
                    icon: Settings,
                    title: "Account Help",
                    description: "Settings & preferences",
                    color: "text-indigo-600",
                    bgColor: "bg-indigo-50",
                  },
                  {
                    icon: Info,
                    title: "General Questions",
                    description: "Features & functionality",
                    color: "text-orange-600",
                    bgColor: "bg-orange-50",
                  },
                ].map((feature, index) => (
                  <div
                    key={index}
                    className="group flex items-center gap-3 rounded-lg border p-2 transition-all hover:border-primary/50 hover:bg-muted/50"
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${feature.bgColor}`}
                    >
                      <feature.icon className={`h-4 w-4 ${feature.color}`} />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">
                        {feature.title}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feature Highlights - Compact */}
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {[
            {
              title: "Voice-First",
              description: "Natural conversation interface",
              icon: Mic,
            },
            {
              title: "Instant Help",
              description: "Immediate responses to questions",
              icon: MessageCircle,
            },
            {
              title: "Always Available",
              description: "24/7 support when you need it",
              icon: CheckCircle2,
            },
          ].map((highlight, index) => (
            <Card key={index} className="border-0 bg-muted/30 text-center">
              <CardContent className="p-4">
                <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <highlight.icon className="h-4 w-4 text-primary" />
                </div>
                <h3 className="mb-1 font-semibold text-sm">
                  {highlight.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {highlight.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
