// @ts-nocheck
"use client";

import React, {useCallback, useEffect, useRef, useState} from "react";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,} from "@/components/ui/card";
import {Textarea} from "@/components/ui/textarea";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {
  ChartArea,
  ChartColumnBig,
  ChartLine,
  ChevronDown,
  Database,
  DatabaseZap,
  FileInput,
  Loader2,
  MessageCircleQuestion,
  Paperclip,
  Send
} from "lucide-react";
import FilePreview from "@/components/FilePreview";
import {ChartRenderer} from "@/components/ChartRenderer";
import {toast} from "@/hooks/use-toast";
import {Badge} from "@/components/ui/badge";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,} from "@/components/ui/dropdown-menu";
import type {ChartData} from "@/types/chart";
import TopNavBar from "@/components/TopNavBar";
import {readFileAsBase64, readFileAsPDFText, readFileAsText,} from "@/utils/fileHandling";
import MarkdownContent from "@/components/ui/markdown";

// Types
interface Message {
  id: string;
  role: string;
  content: string;
  hasToolUse?: boolean;
  file?: {
    base64: string;
    fileName: string;
    mediaType: string;
    isText?: boolean;
  };
  chartData?: ChartData;
}

type Model = {
  id: string;
  name: string;
};

interface FileUpload {
  base64: string;
  fileName: string;
  mediaType: string;
  isText?: boolean;
  fileSize?: number;
}

const models: Model[] = [
  // Claude 3.5 family
  { id: "claude-3-5-sonnet-20240620", name: "Claude 3.5 Sonnet" },
  // Claude 3 family
  { id: "claude-3-opus-20240229", name: "Claude 3 Opus" },
  { id: "claude-3-haiku-20240307", name: "Claude 3 Haiku" },
];

// Updated APIResponse interface
interface APIResponse {
  content: string;
  hasToolUse: boolean;
  toolUse?: {
    type: "tool_use";
    id: string;
    name: string;
    input: ChartData;
  };
  chartData?: ChartData;
}

interface MessageComponentProps {
  message: Message;
}

const ReverseChartDisplay = ({ messages, chartEndRef, SafeChartRenderer }) => {
  // Get only messages with chart data and reverse them
  const chartsMessages = messages
      .filter(message => message.chartData)
      .reverse();

  return (
      <div className="min-h-full flex flex-col overflow-y-auto">
        {chartsMessages.map((message, index) => (
            <div
                key={`chart-${index}`}
                className="w-full h-full flex-shrink-0"
                ref={index === 0 ? chartEndRef : null}
            >
              <SafeChartRenderer data={message.chartData} />
            </div>
        ))}
      </div>
  );
};

const SafeChartRenderer: React.FC<{ data: ChartData }> = ({ data }) => {
  try {
    return (
      <div className="w-full h-full p-6 flex flex-col">
        <div className="w-[90%] flex-1 mx-auto">
          <ChartRenderer data={data} />
        </div>
      </div>
    );
  } catch (error) {
    console.error("Chart rendering error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return (
      <div className="text-red-500">Error rendering chart: {errorMessage}</div>
    );
  }
};

const MessageComponent: React.FC<MessageComponentProps> = ({ message }) => {
  console.log("Message with chart data:", message); // Add this line for debugging
  return (
    <div className="flex items-start gap-2">
      {message.role === "assistant" && (
        <Avatar className="w-8 h-8 border">
          <AvatarImage src="/logo2.png" alt="AI Assistant Avatar" />
          <AvatarFallback>AI</AvatarFallback>
        </Avatar>
      )}
      <div
        className={`flex flex-col max-w-[75%] ${
          message.role === "user" ? "ml-auto" : ""
        }`}
      >
        <div
          className={`p-3 rounded-md text-base ${
            message.role === "user"
              ? "bg-primary text-primary-foreground"
              : "bg-muted border"
          }`}
        >
          {message.content === "thinking" ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2" />
              {message.hasToolUse ? (
                <div className="flex flex-col gap-2">
                  <Badge variant="secondary" className="inline-flex">
                    <ChartLine className="w-4 h-4 mr-1" /> Generated Chart
                  </Badge>
                  <span>Thinking...</span>
                </div>
              ) : (
                <span>Thinking...</span>
              )}
            </div>
          ) : message.role === "assistant" ? (
            <div className="flex flex-col gap-2">
              {message.hasToolUse && (
                <Badge variant="secondary" className="inline-flex px-0">
                  <ChartLine className="w-4 h-4 mr-1" /> Generated Chart
                </Badge>
              )}
              <MarkdownContent content={message.content} />
            </div>
          ) : (
            <span>{message.content}</span>
          )}
        </div>
        {message.file && (
          <div className="mt-1.5">
            <FilePreview file={message.file} size="small" />
          </div>
        )}
      </div>
    </div>
  );
};

const ChartPagination = ({
  total,
  current,
  onDotClick,
}: {
  total: number;
  current: number;
  onDotClick: (index: number) => void;
}) => (
  <div className="fixed right-12 top-1/2 -translate-y-1/2 flex flex-col gap-2">
    {Array.from({ length: total }).map((_, i) => (
      <button
        key={i}
        onClick={() => onDotClick(i)}
        className={`w-2 h-2 rounded-full transition-all ${
          i === current
            ? "bg-primary scale-125"
            : "bg-muted hover:bg-primary/50"
        }`}
      />
    ))}
  </div>
);

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(
    "claude-3-5-sonnet-20240620",
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chartEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentUpload, setCurrentUpload] = useState<FileUpload | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentChartIndex, setCurrentChartIndex] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isScrollLocked, setIsScrollLocked] = useState(false);

  const [dataSources, setDataSources] = useState([]);
  const [activeDataSource, setActiveDataSource] = useState(null);
  const [isLoadingSources, setIsLoadingSources] = useState(true);

  useEffect(() => {
    const fetchDataSources = async () => {
      try {
        const response = await fetch('/api/postgresql-config');
        if (!response.ok) throw new Error('Failed to fetch data sources');
        const data = await response.json();
        setDataSources(data);
      } catch (error) {
        console.error('Error fetching data sources:', error);
        toast({
          title: "Error",
          description: "Failed to fetch data sources.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingSources(false);
      }
    };

    fetchDataSources();
  }, []);

  const activateDataSource = (dataSource) => {
    setActiveDataSource(dataSource);
    toast({
      title: "Data Source Activated",
      description: `${dataSource.name} is now active. You can query this database.`,
    });
  };


  useEffect(() => {
    const scrollToBottom = () => {
      if (!messagesEndRef.current) return;

      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      });
    };

    // Scroll when messages change or when loading state changes
    const timeoutId = setTimeout(scrollToBottom, 100);

    return () => clearTimeout(timeoutId);
  }, [messages, isLoading]); // Add isLoading to dependencies

  useEffect(() => {
    if (!messagesEndRef.current) return;

    const observer = new ResizeObserver(() => {
      if (!isScrollLocked) {
        messagesEndRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      }
    });

    observer.observe(messagesEndRef.current);

    return () => observer.disconnect();
  }, [isScrollLocked]);

  const handleChartScroll = useCallback(() => {
    if (!contentRef.current) return;

    const { scrollTop, clientHeight } = contentRef.current;
    const newIndex = Math.round(scrollTop / clientHeight);
    setCurrentChartIndex(newIndex);
  }, []);

  const scrollToChart = (index: number) => {
    if (!contentRef.current) return;

    const targetScroll = index * contentRef.current.clientHeight;
    contentRef.current.scrollTo({
      top: targetScroll,
      behavior: "smooth",
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;


    const csvTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (csvTypes.includes(file.type) || file.name.toLowerCase().endsWith('.csv') || file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
      toast({
        title: "Unsupported file type",
        description: "CSV and Excel files are not supported",
        variant: "destructive",
      });
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setIsUploading(true);

    // Create a ref to store the toast handlers
    let loadingToastRef: { dismiss: () => void } | undefined;

    if (file.type === "application/pdf") {
      loadingToastRef = toast({
        title: "Processing PDF",
        description: "Extracting text content...",
        duration: Infinity, // This will keep the toast until we dismiss it
      });
    }

    try {
      const isImage = file.type.startsWith("image/");
      const isPDF = file.type === "application/pdf";
      let base64Data = "";
      let isText = false;

      if (isImage) {
        base64Data = await readFileAsBase64(file);
        isText = false;
      } else if (isPDF) {
        try {
          const pdfText = await readFileAsPDFText(file);
          base64Data = btoa(encodeURIComponent(pdfText));
          isText = true;
        } catch (error) {
          console.error("Failed to parse PDF:", error);
          toast({
            title: "PDF parsing failed",
            description: "Unable to extract text from the PDF",
            variant: "destructive",
          });
          return;
        }
      } else {
        try {
          const textContent = await readFileAsText(file);
          base64Data = btoa(encodeURIComponent(textContent));
          isText = true;
        } catch (error) {
          console.error("Failed to read as text:", error);
          toast({
            title: "Invalid file type",
            description: "File must be readable as text, PDF, or be an image",
            variant: "destructive",
          });
          return;
        }
      }

      setCurrentUpload({
        base64: base64Data,
        fileName: file.name,
        mediaType: isText ? "text/plain" : file.type,
        isText,
      });

      toast({
        title: "File uploaded",
        description: `${file.name} ready to analyze`,
      });
    } catch (error) {
      console.error("Error processing file:", error);
      toast({
        title: "Upload failed",
        description: "Failed to process the file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (loadingToastRef) {
        loadingToastRef.dismiss(); // Use the dismiss method from the toast ref
        // Show success toast for PDF
        if (file.type === "application/pdf") {
          toast({
            title: "PDF Processed",
            description: "Text extracted successfully",
          });
        }
      }
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!input.trim() && !currentUpload) return;
    if (isLoading) return;

    setIsScrollLocked(true);

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
      file: currentUpload || undefined,
    };

    const thinkingMessage: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "thinking",
    };

    // Update messages in a single state update
    setMessages((prev) => [...prev, userMessage, thinkingMessage]);
    setInput("");
    setIsLoading(true);

    // Prepare all messages for the API request
    const apiMessages = [...messages, userMessage].map((msg) => {
      if (msg.file) {
        if (msg.file.isText) {
          // For text files, decode the content before sending
          const decodedText = decodeURIComponent(atob(msg.file.base64));
          return {
            role: msg.role,
            content: `File contents of ${msg.file.fileName}:\n\n${decodedText}\n\n${msg.content}`,
          };
        } else {
          // Handle images as before
          return {
            role: msg.role,
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: msg.file.mediaType,
                  data: msg.file.base64,
                },
              },
              {
                type: "text",
                text: msg.content,
              },
            ],
          };
        }
      }
      // Handle text-only messages
      return {
        role: msg.role,
        content: msg.content,
      };
    });

    const requestBody = {
      messages: apiMessages,
      model: selectedModel,
      dataSource: activeDataSource ? {
        host: activeDataSource.host,
        port: activeDataSource.port,
        database: activeDataSource.database,
        username: activeDataSource.username,
        password: activeDataSource.password,
        tables: activeDataSource.tables,
      } : null,
    };

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.json();
        throw new Error(`Query Failed! Please try specifying chart type (bar, area, line or pie)`);
      }

      const data: APIResponse = await response.json();

      setMessages((prev) => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.content,
          hasToolUse: data.hasToolUse || !!data.toolUse,
          chartData:
            data.chartData || (data.toolUse?.input as ChartData) || null,
        };
        return newMessages;
      });

      setCurrentUpload(null);
    } catch (error) {
      console.error("Submit Error:", error);
      setMessages((prev) => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `${error instanceof Error ? error.message : String(error)}`,
        };
        return newMessages;
      });
    } finally {
      setIsLoading(false);
      setIsScrollLocked(false);

      // Force a final scroll after state updates
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() || currentUpload) {
        const form = e.currentTarget.form;
        if (form) {
          const submitEvent = new Event("submit", {
            bubbles: true,
            cancelable: true,
          });
          form.dispatchEvent(submitEvent);
        }
      }
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = event.target;
    setInput(textarea.value);
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 300)}px`;
  };

  return (
    <div className="flex flex-col h-screen">
      <TopNavBar
        features={{
          showDomainSelector: false,
          showViewModeSelector: false,
          showPromptCaching: false,
        }}
      />

      <div className="flex-1 flex bg-background p-4 pt-0 gap-4 h-[calc(100vh-4rem)]">
        {/* Chat Sidebar */}
        <Card className="w-1/3 flex flex-col h-full">
          <CardHeader className="py-3 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {messages.length > 0 && (
                  <>
                    <Avatar className="w-8 h-8 border">
                      <AvatarImage
                        src="/logo2.png"
                        alt="AI Assistant Avatar"
                      />
                      <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">
                        Multi-Agent Analyst
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Powered by Freight Companion
                      </CardDescription>
                    </div>
                  </>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-8 text-sm">
                    {models.find((m) => m.id === selectedModel)?.name}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {models.map((model) => (
                    <DropdownMenuItem
                      key={model.id}
                      onSelect={() => setSelectedModel(model.id)}
                    >
                      {model.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-4 scroll-smooth snap-y snap-mandatory">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full animate-fade-in-up max-w-[95%] mx-auto">
                <Avatar className="w-10 h-10 mb-4 border">
                  <AvatarImage
                    src="/logo2.png"
                    alt="AI Assistant Avatar"
                    width={40}
                    height={40}
                  />
                </Avatar>
                <h2 className="text-xl font-semibold mb-2">
                  Multi-Agent Analyst
                </h2>
                <div className="space-y-4 text-base">
                  <div className="flex items-center gap-3">
                    <ChartArea className="text-muted-foreground w-6 h-6" />
                    <p className="text-muted-foreground">
                      I can analyze your data and create visualizations
                      from your database.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <FileInput className="text-muted-foreground w-6 h-6" />
                    <p className="text-muted-foreground">
                      Upload CSVs, PDFs, or images and I&apos;ll help you
                      understand the data.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <MessageCircleQuestion className="text-muted-foreground w-6 h-6" />
                    <p className="text-muted-foreground">
                      Ask questions about your data and I&apos;ll
                      create insightful charts.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 min-h-full">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`animate-fade-in-up ${
                      message.content === "thinking" ? "animate-pulse" : ""
                    }`}
                  >
                    <MessageComponent message={message} />
                  </div>
                ))}
                <div ref={messagesEndRef} className="h-4" />{" "}
                {/* Add height to ensure scroll space */}
              </div>
            )}
          </CardContent>

          <CardFooter className="p-4 border-t">
            <form onSubmit={handleSubmit} className="w-full">
              <div className="flex flex-col space-y-2">
                {currentUpload && (
                    <FilePreview
                        file={currentUpload}
                        onRemove={() => setCurrentUpload(null)}
                    />
                )}
                <div className="flex items-end space-x-2">
                  <div className="flex-1 relative">
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 flex space-x-1">
                      <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isLoading || isUploading || !!activeDataSource}
                          className="h-8 w-8"
                      >
                        <Paperclip className="h-5 w-5" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              disabled={isLoading}
                          >
                            {activeDataSource ? (
                                <DatabaseZap className="h-5 w-5 text-primary" />
                            ) : (
                                <Database className="h-5 w-5" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {isLoadingSources ? (
                              <DropdownMenuItem disabled>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Loading sources...
                              </DropdownMenuItem>
                          ) : dataSources.length === 0 ? (
                              <DropdownMenuItem disabled>
                                No data sources available
                              </DropdownMenuItem>
                          ) : (
                              dataSources.map((source) => (
                                  <DropdownMenuItem
                                      key={source.id}
                                      onSelect={() => activateDataSource(source)}
                                  >
                                    {source.name}
                                    {activeDataSource?.id === source.id && (
                                        <Badge variant="secondary" className="ml-2">Active</Badge>
                                    )}
                                  </DropdownMenuItem>
                              ))
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <Textarea
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your message..."
                        disabled={isLoading}
                        className="min-h-[44px] h-[44px] resize-none pl-24 py-3 flex items-center"
                        rows={1}
                    />
                  </div>
                  <Button
                      type="submit"
                      disabled={isLoading || (!input.trim() && !currentUpload && !activeDataSource)}
                      className="h-[44px]"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileSelect}
              />
            </form>
          </CardFooter>
        </Card>

        {/* Content Area */}
        <Card className="flex-1 flex flex-col h-full overflow-hidden">
          {messages.some((m) => m.chartData) && (
            <CardHeader className="py-3 px-4 shrink-0">
              <CardTitle className="text-lg">
                Analysis & Visualizations
              </CardTitle>
            </CardHeader>
          )}
          <CardContent
            ref={contentRef}
            className="flex-1 overflow-y-auto min-h-0 snap-y snap-mandatory"
            onScroll={handleChartScroll}
          >
            {messages.some((m) => m.chartData) ? (
                <ReverseChartDisplay
                    messages={messages}
                    chartEndRef={chartEndRef}
                    SafeChartRenderer={SafeChartRenderer}
                />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="flex flex-col items-center justify-center gap-4 -translate-y-8">
                  <ChartColumnBig className="w-8 h-8 text-muted-foreground" />
                  <div className="space-y-2">
                    <CardTitle className="text-lg">
                      Analysis & Visualizations
                    </CardTitle>
                    <CardDescription className="text-base">
                      Charts and detailed analysis will appear here as you chat
                    </CardDescription>
                    <div className="flex flex-wrap justify-center gap-2 mt-4">
                      <Badge variant="outline">Bar Charts</Badge>
                      <Badge variant="outline">Area Charts</Badge>
                      <Badge variant="outline">Linear Charts</Badge>
                      <Badge variant="outline">Pie Charts</Badge>
                      <Badge variant="outline">Tabular</Badge>
                    </div>
                  </div>
                </div>
                {activeDataSource && (
                    <div className="mt-8 w-full max-w-2xl mx-auto bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 rounded-lg border p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-semibold flex items-center space-x-2">
                          <Database className="h-7 w-7 text-primary" />
                          <span>Available Tables for Exploration</span>
                        </h3>
                        <Badge variant="secondary" className="text-sm px-3 py-1">
                          {activeDataSource.tables.length} Tables
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {activeDataSource.tables.map((table, index) => (
                            <Card key={index} className="hover:shadow-md transition-all duration-300 hover:scale-105 bg-card">
                              <CardContent className="p-4 flex items-center space-x-3">
                                <span className="font-medium text-base truncate flex-1" title={table}>
                {table}
              </span>
                              </CardContent>
                            </Card>
                        ))}
                      </div>
                    </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      {messages.some((m) => m.chartData) && (
        <ChartPagination
          total={messages.filter((m) => m.chartData).length}
          current={currentChartIndex}
          onDotClick={scrollToChart}
        />
      )}
    </div>
  );
}
