"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowUp, Sparkles, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Camera, fetchCameras } from "@/lib/services/cameraService";
import { getStoredCases, CaseItem } from "@/lib/services/caseService";
import { submitQuery } from "@/lib/services/aiAssistantService";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  status?: "sending" | "processing" | "complete" | "error";
  image_base64?: string;
  model?: string;
  isStreaming?: boolean;
}

function TypewriterText({
  content,
  isStreaming = false,
  onFinish,
}: {
  content: string;
  isStreaming?: boolean;
  onFinish?: () => void;
}) {
  const [displayedText, setDisplayedText] = useState(isStreaming ? "" : content);
  const [isTyping, setIsTyping] = useState(isStreaming);

  useEffect(() => {
    if (!isStreaming) {
      setDisplayedText(content);
      setIsTyping(false);
      return;
    }

    setDisplayedText("");
    setIsTyping(true);

    let index = 0;
    const total = content.length;
    // Fast, realistic character typing speed
    const chunkSize = Math.max(1, Math.min(5, Math.ceil(total / 110)));

    const timer = setInterval(() => {
      index += chunkSize;
      if (index >= total) {
        setDisplayedText(content);
        setIsTyping(false);
        clearInterval(timer);
        onFinish?.();
      } else {
        setDisplayedText(content.slice(0, index));
      }
    }, 10);

    return () => clearInterval(timer);
  }, [content, isStreaming, onFinish]);

  return (
    <div className="whitespace-pre-wrap leading-relaxed relative">
      {displayedText}
      {isTyping && (
        <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-primary rounded-[1px] align-baseline animate-pulse shadow-sm" />
      )}
    </div>
  );
}

export default function AiAssistant() {
  const [mode, setMode] = useState<"case" | "camera">("case");
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  const [query, setQuery] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessingQuery, setIsProcessingQuery] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const selectedCase = cases.find((c) => c.id === selectedCaseId) || null;
  const selectedCamObj = cameras.find((cam) => cam.id === selectedCamera) || null;

  // Load cases and cameras on mount
  useEffect(() => {
    try {
      const storedCases = getStoredCases();
      setCases(storedCases);
      if (storedCases.length > 0) {
        setSelectedCaseId(storedCases[0].id);
      }
    } catch (e) {
      console.error("Failed to load cases:", e);
    }

    async function loadCameras() {
      try {
        const camerasData = await fetchCameras();
        setCameras(camerasData);
        if (camerasData.length > 0 && camerasData[0].id) {
          setSelectedCamera(camerasData[0].id);
        }
      } catch (error) {
        console.error("Failed to load cameras:", error);
      }
    }

    loadCameras();
  }, []);

  // Scroll to bottom on message updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isProcessingQuery]);

  // Handle case switch
  const handleCaseChange = (caseId: string) => {
    setSelectedCaseId(caseId);
    inputRef.current?.focus();
  };

  // Handle camera switch
  const handleCameraChange = (cameraId: string) => {
    setSelectedCamera(cameraId);
    inputRef.current?.focus();
  };

  // Reset conversation to fresh AI state
  const handleResetChat = () => {
    setMessages([]);
    setQuery("");
    inputRef.current?.focus();
  };

  // Quick prompt starters
  const quickCasePrompts = [
    {
      title: "Executive Summary",
      prompt: "Provide a comprehensive executive summary of this case, severity, and key suspects.",
    },
    {
      title: "Video Detections",
      prompt: "What objects, persons, or vehicles were detected in the attached surveillance footage?",
    },
    {
      title: "Incident Timeline",
      prompt: "Generate a chronological timeline of events recorded in the case logs.",
    },
    {
      title: "Evidence & Hashes",
      prompt: "List all attached evidence files and verify their SHA-256 integrity hashes.",
    },
  ];

  const quickCameraPrompts = [
    {
      title: "Persons in View",
      prompt: "Are any persons currently detected in this camera view?",
    },
    {
      title: "Vehicle Activity",
      prompt: "How many vehicles or cars are visible in this camera feed?",
    },
    {
      title: "Threat Assessment",
      prompt: "Analyze the current frame for perimeter breaches or suspicious activity.",
    },
    {
      title: "Scene Summary",
      prompt: "Provide a complete visual summary of what the camera is seeing right now.",
    },
  ];

  // Quick prompt chip clicked
  const handleQuickPrompt = (promptText: string) => {
    setQuery(promptText);
    executeSendQuery(promptText);
  };

  // Execute query submission
  const executeSendQuery = async (queryToSend: string) => {
    const currentQuery = queryToSend.trim();
    if (!currentQuery) return;

    if (mode === "case" && !selectedCaseId) {
      toast({
        title: "No Case Selected",
        description: "Please select an investigation case to query.",
        variant: "destructive",
      });
      return;
    }

    if (mode === "camera" && !selectedCamera) {
      toast({
        title: "No Camera Selected",
        description: "Please select a camera feed to query.",
        variant: "destructive",
      });
      return;
    }

    const userMessageId = `user-${Date.now()}`;
    const assistantMessageId = `assistant-${Date.now()}`;

    // Add user message
    setMessages((prev) => [
      ...prev,
      {
        id: userMessageId,
        role: "user",
        content: currentQuery,
        timestamp: new Date(),
        status: "complete",
      },
    ]);

    setQuery("");
    setIsProcessingQuery(true);

    // Placeholder assistant message
    setMessages((prev) => [
      ...prev,
      {
        id: assistantMessageId,
        role: "assistant",
        content:
          mode === "case"
            ? `Analyzing ${selectedCase?.name || selectedCaseId} evidence & findings...`
            : `Analyzing visual detections from ${selectedCamObj?.name || selectedCamera}...`,
        timestamp: new Date(),
        status: "processing",
      },
    ]);

    try {
      const payload =
        mode === "case"
          ? {
              case_id: selectedCaseId,
              case_data: selectedCase,
              query: currentQuery,
            }
          : {
              camera_id: selectedCamera,
              query: currentQuery,
            };

      const apiResponse = await submitQuery(payload);

      if (apiResponse.success) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content:
                    apiResponse.response ||
                    "Analysis processed but returned no specific text.",
                  status: "complete",
                  model: apiResponse.model,
                  image_base64: apiResponse.image_base64,
                  isStreaming: true,
                }
              : msg
          )
        );
      } else {
        const errorMsg =
          apiResponse.error || "Failed to retrieve AI analysis.";
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: errorMsg, status: "error" }
              : msg
          )
        );
        toast({
          title: "AI Notice",
          description: errorMsg,
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error("Failed to query AI assistant:", err);
      const errorMessage =
        err?.message || "Failed to connect to the AI analysis service.";
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, content: `Error: ${errorMessage}`, status: "error" }
            : msg
        )
      );
      toast({
        title: "Query Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessingQuery(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const formatTimestamp = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const activePrompts = mode === "case" ? quickCasePrompts : quickCameraPrompts;

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative overflow-hidden">
      {/* TOP HEADER: Clean bar to select case & mode */}
      <header className="h-14 border-b border-border/60 px-4 md:px-6 flex items-center justify-between gap-3 bg-background/80 backdrop-blur shrink-0 z-10">
        <div className="flex items-center gap-2 md:gap-3 flex-wrap min-w-0">
          {/* Mode Switcher */}
          <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border/50 text-xs shrink-0">
            <button
              type="button"
              onClick={() => setMode("case")}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                mode === "case"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Case Q&amp;A
            </button>
            <button
              type="button"
              onClick={() => setMode("camera")}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                mode === "camera"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Live Camera
            </button>
          </div>

          {/* TOP CASE SELECTOR */}
          {mode === "case" && (
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs text-muted-foreground hidden sm:inline">Case:</span>
              <Select value={selectedCaseId} onValueChange={handleCaseChange}>
                <SelectTrigger className="h-8 max-w-[260px] md:max-w-[340px] text-xs bg-muted/30 hover:bg-muted/60 border-border/70 rounded-lg transition-colors">
                  <SelectValue placeholder="Select Case">
                    {selectedCase ? (
                      <span className="truncate font-medium text-foreground">
                        <span className="font-mono font-semibold mr-1.5">{selectedCase.id}</span>
                        <span className="text-muted-foreground">&bull; {selectedCase.name}</span>
                      </span>
                    ) : (
                      "Select Case"
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {cases.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-mono font-semibold">{c.id}</span>
                        <span className="text-muted-foreground truncate">{c.name}</span>
                        <span className="ml-auto text-[10px] uppercase font-mono px-1 rounded bg-muted/80 text-muted-foreground">
                          {c.severity}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* TOP CAMERA SELECTOR */}
          {mode === "camera" && (
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs text-muted-foreground hidden sm:inline">Camera:</span>
              <Select value={selectedCamera} onValueChange={handleCameraChange}>
                <SelectTrigger className="h-8 max-w-[220px] text-xs bg-muted/30 hover:bg-muted/60 border-border/70 rounded-lg transition-colors">
                  <SelectValue placeholder="Select Camera">
                    <span className="truncate font-medium text-foreground">
                      {selectedCamObj?.name || selectedCamera || "Select Camera"}
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {cameras.map((camera) => (
                    <SelectItem
                      key={camera.id}
                      value={camera.id || ""}
                      className="text-xs"
                    >
                      {camera.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Top Right: Status & New Chat */}
        <div className="flex items-center gap-2 shrink-0">
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetChat}
              className="h-8 text-xs text-muted-foreground hover:text-foreground rounded-lg gap-1.5 px-2.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New Chat</span>
            </Button>
          )}

          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>CyberVision Copilot</span>
          </div>
        </div>
      </header>

      {/* CHAT AREA: Natural conversational AI experience, no heavy nested boxes */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          /* REAL AI EMPTY STATE (ChatGPT / Gemini style) */
          <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 ring-1 ring-primary/20 shadow-sm">
              <Sparkles className="h-6 w-6" />
            </div>

            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground mb-2">
              {mode === "case"
                ? selectedCase
                  ? `Investigate ${selectedCase.id}`
                  : "Select a Case to Investigate"
                : `Live Vision: ${selectedCamObj?.name || "Camera Feed"}`}
            </h2>

            <p className="text-xs md:text-sm text-muted-foreground max-w-md mb-8 leading-relaxed">
              {mode === "case" && selectedCase
                ? `Case "${selectedCase.name}" loaded with ${
                    selectedCase.attachedFiles?.length || 0
                  } evidence artifact(s). Ask any question about suspects, incident timeline, or video detections.`
                : "Ask questions about live camera scene activity, person detection, or vehicle counts."}
            </p>

            {/* Quick Suggestion Starters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-xl text-left">
              {activePrompts.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickPrompt(item.prompt)}
                  className="group p-3 rounded-xl border border-border/70 hover:border-primary/50 bg-card/60 hover:bg-muted/40 transition-all text-left flex flex-col gap-1 shadow-sm"
                >
                  <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
                    {item.title}
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-primary text-xs">
                      &rarr;
                    </span>
                  </span>
                  <span className="text-[11px] text-muted-foreground line-clamp-2">
                    {item.prompt}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* ACTIVE CHAT STREAM: Clean messages */
          <div className="max-w-3xl mx-auto w-full px-4 py-6 space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5 ring-1 ring-primary/20">
                    <Sparkles className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`flex flex-col ${
                    message.role === "user"
                      ? "items-end max-w-[85%]"
                      : "items-start max-w-[90%]"
                  }`}
                >
                  <div
                    className={`rounded-2xl px-4 py-3 text-xs md:text-sm leading-relaxed ${
                      message.role === "user"
                        ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-tr-sm shadow-sm font-medium"
                        : "text-foreground"
                    }`}
                  >
                    <div className="text-xs md:text-sm">
                      {message.role === "assistant" && message.status === "complete" ? (
                        <TypewriterText
                          content={message.content}
                          isStreaming={message.isStreaming}
                          onFinish={() => {
                            setMessages((prev) =>
                              prev.map((m) =>
                                m.id === message.id ? { ...m, isStreaming: false } : m
                              )
                            );
                          }}
                        />
                      ) : (
                        <div className="whitespace-pre-wrap">{message.content}</div>
                      )}
                    </div>

                    {message.status === "processing" && (
                      <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span className="text-xs font-medium">
                          Processing response...
                        </span>
                      </div>
                    )}

                    {message.image_base64 && (
                      <div className="mt-3">
                        <img
                          src={`data:image/jpeg;base64,${message.image_base64}`}
                          alt="Visual evidence"
                          className="rounded-xl w-full h-auto max-h-[320px] object-contain border border-border"
                        />
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] text-muted-foreground/60 mt-1 px-1 font-mono">
                    {formatTimestamp(message.timestamp)}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* BOTTOM INPUT: Real AI prompt text field */}
      <footer className="p-4 bg-background shrink-0">
        <div className="max-w-3xl mx-auto w-full">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              executeSendQuery(query);
            }}
            className="relative flex items-center bg-muted/40 hover:bg-muted/60 focus-within:bg-background border border-border/80 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 rounded-2xl transition-all shadow-sm pl-4 pr-2 py-1.5"
          >
            <input
              ref={inputRef}
              type="text"
              placeholder={
                mode === "case"
                  ? selectedCase
                    ? `Ask about Case ${selectedCase.id}, evidence, detections, suspects...`
                    : "Ask anything about this case..."
                  : `Ask about camera '${selectedCamObj?.name || selectedCamera || "feed"}' activity...`
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isProcessingQuery}
              className="flex-1 bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-xs md:text-sm text-foreground placeholder:text-muted-foreground/70 py-2"
            />
            <Button
              type="submit"
              size="icon"
              disabled={isProcessingQuery || !query.trim()}
              className="h-8 w-8 md:h-9 md:w-9 rounded-xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 transition-all shrink-0 ml-2 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {isProcessingQuery ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowUp className="h-4 w-4 stroke-[2.5]" />
              )}
              <span className="sr-only">Send message</span>
            </Button>
          </form>

          <p className="text-[10px] md:text-[11px] text-center text-muted-foreground/60 mt-2">
            CyberVision AI analyzes attached video artifacts, YOLOv8 detections, and forensic evidence dossiers.
          </p>
        </div>
      </footer>
    </div>
  );
}