import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import SettingsModal from "@/components/SettingsModal";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { RetryButton } from "@/components/RetryButton";
import { CharacterCounter } from "@/components/CharacterCounter";
import { ToolCard } from "@/components/ToolCard";
import { OutputPanel } from "@/components/OutputPanel";
import { QuickPromptBar } from "@/components/QuickPromptBar";
import { HistoryDrawer } from "@/components/HistoryDrawer";
import { KeyboardShortcutsHelp } from "@/components/KeyboardShortcutsHelp";
import { useDebounce } from "@/hooks/useDebounce";
import { useAsyncOperation } from "@/hooks/useAsyncOperation";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import {
  useGenerationHistory,
  HistoryEntry,
} from "@/hooks/useGenerationHistory";
import { useSecureStorage } from "@/hooks/useSecureStorage";
import { sanitizeInput } from "@/utils/validation";
import { performanceMonitor } from "@/utils/performance";
import {
  Sparkles,
  Edit3,
  BookOpen,
  MessageSquare,
  Zap,
  AlertTriangle,
  Languages,
  FileText,
  Hash,
  Target,
  Lightbulb,
  Users,
  Search,
  CheckSquare,
  Minimize2,
  Maximize2,
  Wand2,
  Loader2,
  Download,
  X,
} from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { enhancedLLMService } from "@/services/enhancedLLMService";

const Index = () => {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [activeTab, setActiveTab] = useState("generate");
  const [selectedTone, setSelectedTone] = useState("professional");
  const [selectedLength, setSelectedLength] = useState("medium");
  const [isConfigured, setIsConfigured] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastToolUsed, setLastToolUsed] = useState("generate");

  const outputRef = useRef<HTMLDivElement>(null);
  const generateButtonRef = useRef<HTMLButtonElement>(null);

  // Secure storage for draft auto-save
  const [savedDraft, setSavedDraft, removeSavedDraft] =
    useSecureStorage<string>("ai_draft", "");

  // History management
  const { addEntry } = useGenerationHistory();

  // Debounce input text to prevent excessive API calls
  const debouncedInputText = useDebounce(inputText, 300);

  // Use async operation hook for better state management
  const {
    loading: isLoading,
    error: lastError,
    execute: executeOperation,
    retry,
    canRetry,
  } = useAsyncOperation({
    onError: (error) => showError(error),
    retryCount: 3,
  });

  // Auto-save draft every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (inputText.trim() && inputText !== savedDraft) {
        setSavedDraft(inputText);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [inputText, savedDraft, setSavedDraft]);

  // Restore draft on mount
  useEffect(() => {
    if (savedDraft && !inputText) {
      setInputText(savedDraft);
    }
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: "Enter",
      ctrl: true,
      description: "Generate text",
      handler: () => {
        if (isConfigured && !isGenerating && inputText.trim()) {
          handleGenerate();
        }
      },
    },
    {
      key: "c",
      ctrl: true,
      shift: true,
      description: "Copy output",
      handler: () => {
        if (outputText) {
          handleCopy();
        }
      },
    },
    {
      key: "/",
      ctrl: true,
      description: "Show shortcuts help",
      handler: () => {
        // The help dialog has its own trigger, this is handled by the component
      },
    },
    {
      key: "?",
      description: "Show shortcuts help",
      handler: () => {
        // Handled by the KeyboardShortcutsHelp component
      },
    },
  ]);

  // Scroll to output after generation
  const scrollToOutput = useCallback(() => {
    if (outputRef.current) {
      outputRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  // Generic operation handler with performance monitoring
  const handleOperation = useCallback(
    async (
      operation: () => Promise<string>,
      successMessage: string,
      toolName: string,
    ) => {
      const configured = await enhancedLLMService.isConfigured();
      if (!configured) {
        showError("Backend server is not configured. Please check your server environment variables.");
        return;
      }

      setIsGenerating(true);
      setLastToolUsed(toolName);
      const timerId = performanceMonitor.startTimer("ai_operation");

      try {
        const result = await executeOperation(operation);
        setOutputText(result);
        showSuccess(successMessage);

        // Add to history
        addEntry({
          input: inputText,
          output: result,
          toolUsed: toolName,
          tone: selectedTone,
          length: selectedLength,
        });

        // Clear draft after successful generation
        removeSavedDraft();

        // Scroll to output
        setTimeout(scrollToOutput, 100);

        const duration = performanceMonitor.endTimer(timerId);
        console.log(`Operation completed in ${duration.toFixed(2)}ms`);

        return result;
      } catch (error) {
        performanceMonitor.endTimer(timerId);
        throw error;
      } finally {
        setIsGenerating(false);
      }
    },
    [
      executeOperation,
      inputText,
      selectedTone,
      selectedLength,
      addEntry,
      removeSavedDraft,
      scrollToOutput,
    ],
  );

  // Enhanced input handler with sanitization
  const handleInputChange = useCallback((value: string) => {
    const sanitized = sanitizeInput(value);
    setInputText(sanitized);
  }, []);

  // Restore history entry
  const handleRestoreHistoryEntry = useCallback((entry: HistoryEntry) => {
    setInputText(entry.input);
    setOutputText(entry.output);
    if (entry.tone) setSelectedTone(entry.tone);
    if (entry.length) setSelectedLength(entry.length);
    setActiveTab("generate");
  }, []);

  // Tool handlers
  const handleSummarize = useCallback(() => {
    if (!inputText.trim()) {
      showError("Please enter some text to summarize");
      return;
    }

    handleOperation(
      () => enhancedLLMService.summarizeText(inputText),
      "Text summarized",
      "summarize",
    );
  }, [inputText, handleOperation]);

  const handleRewrite = useCallback(() => {
    if (!inputText.trim()) {
      showError("Please enter some text to rewrite");
      return;
    }

    handleOperation(
      () =>
        enhancedLLMService.editText(
          inputText,
          "Rewrite this text in different words while maintaining the same meaning and tone.",
        ),
      "Text rewritten",
      "rewrite",
    );
  }, [inputText, handleOperation]);

  const handleSimplify = useCallback(() => {
    if (!inputText.trim()) {
      showError("Please enter some text to simplify");
      return;
    }

    handleOperation(
      () =>
        enhancedLLMService.editText(
          inputText,
          "Simplify this text using simple words and shorter sentences. Make it easy to understand for a general audience.",
        ),
      "Text simplified",
      "simplify",
    );
  }, [inputText, handleOperation]);

  const handleBulletPoints = useCallback(() => {
    if (!inputText.trim()) {
      showError("Please enter some text to convert to bullet points");
      return;
    }

    handleOperation(
      () =>
        enhancedLLMService.editText(
          inputText,
          "Convert this text to bullet point format. Use clear, concise bullet points that capture the main ideas.",
        ),
      "Converted to bullet points",
      "bullet",
    );
  }, [inputText, handleOperation]);

  const handleKeywords = useCallback(() => {
    if (!inputText.trim()) {
      showError("Please enter some text to extract keywords from");
      return;
    }

    handleOperation(
      () =>
        enhancedLLMService.editText(
          inputText,
          "Extract the main keywords and topics from this text. List them as comma-separated values.",
        ),
      "Keywords extracted",
      "keywords",
    );
  }, [inputText, handleOperation]);

  const handleCTA = useCallback(() => {
    if (!inputText.trim()) {
      showError("Please enter some text to generate a CTA for");
      return;
    }

    handleOperation(
      () =>
        enhancedLLMService.editText(
          inputText,
          "Based on this text, generate a compelling call-to-action that encourages readers to take action. Make it persuasive and clear.",
        ),
      "Call-to-action generated",
      "cta",
    );
  }, [inputText, handleOperation]);

  const handleIdeas = useCallback(() => {
    if (!inputText.trim()) {
      showError("Please enter some text to generate ideas for");
      return;
    }

    handleOperation(
      () =>
        enhancedLLMService.editText(
          inputText,
          "Based on this text, brainstorm related ideas, topics, and suggestions. Provide a list of creative and relevant ideas.",
        ),
      "Ideas generated",
      "ideas",
    );
  }, [inputText, handleOperation]);

  const handleSocialMedia = useCallback(() => {
    if (!inputText.trim()) {
      showError("Please enter some text to convert to social media format");
      return;
    }

    handleOperation(
      () =>
        enhancedLLMService.editText(
          inputText,
          "Convert this text to an engaging social media post. Use appropriate hashtags, emojis, and a conversational tone suitable for platforms like Twitter, Instagram, or LinkedIn.",
        ),
      "Social media post created",
      "social",
    );
  }, [inputText, handleOperation]);

  const handleGenerate = useCallback(() => {
    if (!inputText.trim()) {
      showError("Please enter some text to work with");
      return;
    }

    handleOperation(
      () =>
        enhancedLLMService.generateText(
          inputText,
          selectedTone,
          selectedLength,
        ),
      "Text generated",
      "generate",
    );
  }, [inputText, selectedTone, selectedLength, handleOperation]);

  const handleEdit = useCallback(
    (instruction: string) => {
      if (!inputText.trim()) {
        showError("Please enter some text to edit");
        return;
      }

      handleOperation(
        () => enhancedLLMService.editText(inputText, instruction),
        "Text edited",
        "edit",
      );
    },
    [inputText, handleOperation],
  );

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(outputText);
      showSuccess("Text copied to clipboard!");
    } catch (error) {
      showError("Failed to copy text to clipboard");
    }
  }, [outputText]);

  const handleDownload = useCallback(() => {
    try {
      const blob = new Blob([outputText], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ai-generated-text.txt";
      a.click();
      URL.revokeObjectURL(url);
      showSuccess("Text downloaded successfully!");
    } catch (error) {
      showError("Failed to download text");
    }
  }, [outputText]);

  const handleRewriteFromOutput = useCallback(() => {
    setInputText(outputText);
    setOutputText("");
    setActiveTab("edit");
  }, [outputText]);

  // Memoized data
  const writingTones = useMemo(
    () => [
      { id: "professional", label: "Professional" },
      { id: "casual", label: "Casual" },
      { id: "creative", label: "Creative" },
      { id: "academic", label: "Academic" },
    ],
    [],
  );

  const lengthOptions = useMemo(
    () => [
      {
        id: "short",
        label: "Short",
        description: "1-2 sentences",
        icon: FileText,
      },
      {
        id: "medium",
        label: "Medium",
        description: "1 paragraph",
        icon: FileText,
      },
      {
        id: "long",
        label: "Long",
        description: "Multiple paragraphs",
        icon: FileText,
      },
    ],
    [],
  );

  const editOptions = useMemo(
    () => [
      {
        id: "clarity",
        label: "Improve clarity",
        instruction: "Improve clarity and readability",
        description: "Make text clearer and easier to understand",
        icon: Search,
      },
      {
        id: "grammar",
        label: "Fix grammar",
        instruction: "Fix grammar and spelling errors",
        description: "Correct grammatical mistakes and typos",
        icon: CheckSquare,
      },
      {
        id: "concise",
        label: "Make concise",
        instruction: "Make the text more concise and to the point",
        description: "Remove unnecessary words and be more direct",
        icon: Minimize2,
      },
      {
        id: "expand",
        label: "Expand ideas",
        instruction: "Expand on the ideas and add more detail",
        description: "Add more information and elaborate on concepts",
        icon: Maximize2,
      },
    ],
    [],
  );

  const toolsOptions = useMemo(
    () => [
      {
        id: "summarize",
        title: "Summarize",
        description: "Extract key points and main ideas from your text",
        icon: BookOpen,
        onClick: handleSummarize,
      },
      {
        id: "rewrite",
        title: "Rewrite",
        description:
          "Rephrase content in different words while keeping meaning",
        icon: MessageSquare,
        onClick: handleRewrite,
      },
      {
        id: "simplify",
        title: "Simplify language",
        description:
          "Convert complex text to simple, easy-to-understand language",
        icon: Languages,
        onClick: handleSimplify,
      },
      {
        id: "bullet",
        title: "Bullet points",
        description: "Convert text to organized bullet point format",
        icon: FileText,
        onClick: handleBulletPoints,
      },
      {
        id: "keywords",
        title: "Extract keywords",
        description: "Identify main keywords and topics from your content",
        icon: Hash,
        onClick: handleKeywords,
      },
      {
        id: "cta",
        title: "Generate CTA",
        description: "Create compelling call-to-action text for marketing",
        icon: Target,
        onClick: handleCTA,
      },
      {
        id: "ideas",
        title: "Generate ideas",
        description: "Brainstorm related ideas and topics based on your text",
        icon: Lightbulb,
        onClick: handleIdeas,
      },
      {
        id: "social",
        title: "Social media post",
        description: "Convert to engaging social media format with hashtags",
        icon: Users,
        onClick: handleSocialMedia,
      },
    ],
    [
      handleSummarize,
      handleRewrite,
      handleSimplify,
      handleBulletPoints,
      handleKeywords,
      handleCTA,
      handleIdeas,
      handleSocialMedia,
    ],
  );

  // Configuration check - now reads from env/config, no localStorage polling needed
  useEffect(() => {
    const checkConfig = async () => {
      try {
        const configured = await enhancedLLMService.isConfigured();
        setIsConfigured(configured);
      } catch (error) {
        console.error("Error checking configuration:", error);
        setIsConfigured(false);
      }
    };

    checkConfig();
  }, []);

  return (
    <ErrorBoundary>
      <div className="min-h-[100dvh] bg-background noise-overlay">
        {/* Header */}
        <header className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex justify-between items-center gap-3">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="shrink-0">
                  <img
                    src="/write-right-light.png"
                    alt="WriteRight"
                    className="h-8 sm:h-9 w-auto"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                    A focused workspace for drafting with AI support
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                <KeyboardShortcutsHelp />
                <HistoryDrawer onRestoreEntry={handleRestoreHistoryEntry} />
                <SettingsModal />
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
          {/* Configuration Alert */}
          {!isConfigured && (
            <Alert className="mb-5 sm:mb-7 border-amber-500/20 bg-amber-500/5">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 text-sm">
                Backend server is not configured. Please set the LLM environment variables on the server.
              </AlertDescription>
            </Alert>
          )}

          {/* Error Recovery */}
          {lastError && canRetry && (
            <Alert className="mb-5 sm:mb-7 border-destructive/20 bg-destructive/5">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-destructive">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm">{lastError}</span>
                  <RetryButton onRetry={retry} isRetrying={isGenerating} />
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Quick Prompts Bar */}
          <section className="mb-5 sm:mb-7">
            <QuickPromptBar
              onPromptSelect={handleInputChange}
              currentText={inputText}
              onClear={() => setInputText("")}
            />
          </section>

          {/* Main Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-7 items-start">
            {/* Input Column */}
            <div className="space-y-5">
              <Card className="border shadow-sm">
                <CardHeader className="pb-3">
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-3 bg-muted h-10 p-1">
                      <TabsTrigger
                        value="generate"
                        className="gap-1.5 sm:gap-2 text-xs sm:text-sm rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm"
                      >
                        <Wand2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Generate</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="edit"
                        className="gap-1.5 sm:gap-2 text-xs sm:text-sm rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm"
                      >
                        <Edit3 className="h-4 w-4" />
                        <span className="hidden sm:inline">Edit</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="tools"
                        className="gap-1.5 sm:gap-2 text-xs sm:text-sm rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm"
                      >
                        <Zap className="h-4 w-4" />
                        <span className="hidden sm:inline">Tools</span>
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </CardHeader>

                <CardContent className="pt-0">
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsContent value="generate" className="space-y-5 mt-5">
                      <div className="space-y-2.5">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                          What would you like to write about?
                        </label>
                        <div className="relative">
                          <Textarea
                            placeholder="Enter your topic, idea, or starting point..."
                            value={inputText}
                            onChange={(e) => handleInputChange(e.target.value)}
                            className="min-h-[160px] sm:min-h-[200px] text-sm pr-10 rounded-xl resize-none"
                          />
                          {inputText && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setInputText("")}
                              className="absolute top-2 right-2 h-7 w-7 rounded-md text-muted-foreground hover:text-foreground transition-colors"
                              aria-label="Clear input text"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <CharacterCounter
                          current={inputText.length}
                          max={10000}
                          text={inputText}
                        />
                      </div>

                      <div className="space-y-2.5">
                        <label className="text-sm font-medium text-foreground">
                          Writing tone
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {writingTones.map((tone) => (
                            <Badge
                              key={tone.id}
                              className={`cursor-pointer px-3 py-1.5 transition-all duration-200 border text-xs ${
                                selectedTone === tone.id
                                  ? "bg-primary text-primary-foreground border-primary shadow-sm scale-105"
                                  : "bg-card text-muted-foreground hover:bg-muted border-border"
                              }`}
                              onClick={() => setSelectedTone(tone.id)}
                            >
                              {tone.label}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        <label className="text-sm font-medium text-foreground">
                          Length
                        </label>
                        <div className="flex gap-3">
                          {lengthOptions.map((option) => {
                            const Icon = option.icon;
                            return (
                              <div
                                key={option.id}
                                className={`flex-1 p-3 sm:p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                                  selectedLength === option.id
                                    ? "border-primary bg-primary/5 shadow-sm"
                                    : "border-border hover:border-primary/30 hover:bg-muted/50"
                                }`}
                                onClick={() => setSelectedLength(option.id)}
                              >
                                <div className="flex items-center justify-center mb-1.5">
                                  <Icon className="h-5 w-5 text-primary" />
                                </div>
                                <div className="font-medium text-sm text-center">
                                  {option.label}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1 text-center">
                                  {option.description}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <Button
                        ref={generateButtonRef}
                        onClick={handleGenerate}
                        disabled={
                          !isConfigured || isGenerating || !inputText.trim()
                        }
                        className="w-full h-11 sm:h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-sm transition-all duration-200 active:scale-[0.98]"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Wand2 className="h-4 w-4 mr-2" />
                            Generate text
                            <span className="hidden sm:inline ml-2 text-xs opacity-70">
                              (Ctrl+Enter)
                            </span>
                          </>
                        )}
                      </Button>
                    </TabsContent>

                    <TabsContent value="edit" className="space-y-5 mt-5">
                      <div className="space-y-2.5">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                          <Edit3 className="h-4 w-4 text-primary" />
                          Text to edit
                        </label>
                        <div className="relative">
                          <Textarea
                            placeholder="Paste your text here for editing..."
                            value={inputText}
                            onChange={(e) => handleInputChange(e.target.value)}
                            className="min-h-[160px] sm:min-h-[200px] text-sm pr-10 rounded-xl resize-none"
                          />
                          {inputText && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setInputText("")}
                              className="absolute top-2 right-2 h-7 w-7 rounded-md text-muted-foreground hover:text-foreground transition-colors"
                              aria-label="Clear input text"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <CharacterCounter
                          current={inputText.length}
                          max={10000}
                          text={inputText}
                        />
                      </div>

                      <div className="space-y-2.5">
                        <label className="text-sm font-medium text-foreground">
                          Choose an editing option
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {editOptions.map((option) => {
                            const Icon = option.icon;
                            return (
                              <Button
                                key={option.id}
                                variant="outline"
                                onClick={() => handleEdit(option.instruction)}
                                disabled={
                                  !isConfigured ||
                                  isGenerating ||
                                  !inputText.trim()
                                }
                                className="h-auto p-3 sm:p-4 flex flex-col items-start text-left w-full min-w-0 whitespace-normal hover:bg-primary/5 hover:border-primary/20 transition-all duration-200 group rounded-xl"
                              >
                                <div className="flex items-center gap-2 mb-1 sm:mb-2 w-full min-w-0">
                                  <Icon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-primary group-hover:scale-105 transition-transform duration-200" />
                                  <span className="font-medium text-sm break-words">
                                    {option.label}
                                  </span>
                                </div>
                                <span className="text-xs text-muted-foreground leading-relaxed break-words w-full">
                                  {option.description}
                                </span>
                              </Button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="p-3.5 sm:p-4 bg-primary/5 rounded-xl border border-primary/10">
                        <p className="text-sm text-foreground/80 leading-relaxed">
                          <span className="font-medium">Tip:</span> You can also
                          use the Rewrite button in the output panel to edit the
                          generated text.
                        </p>
                      </div>
                    </TabsContent>

                    <TabsContent value="tools" className="space-y-5 mt-5">
                      <div className="space-y-2.5">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                          <Zap className="h-4 w-4 text-primary" />
                          Text to process
                        </label>
                        <div className="relative">
                          <Textarea
                            placeholder="Enter or paste your text here to use the tools..."
                            value={inputText}
                            onChange={(e) => handleInputChange(e.target.value)}
                            className="min-h-[160px] sm:min-h-[200px] text-sm pr-10 rounded-xl resize-none"
                          />
                          {inputText && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setInputText("")}
                              className="absolute top-2 right-2 h-7 w-7 rounded-md text-muted-foreground hover:text-foreground transition-colors"
                              aria-label="Clear input text"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <CharacterCounter
                          current={inputText.length}
                          max={10000}
                          text={inputText}
                        />
                      </div>

                      <div className="space-y-2.5">
                        <label className="text-sm font-medium text-foreground">
                          Choose a tool
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {toolsOptions.map((tool) => (
                            <ToolCard
                              key={tool.id}
                              id={tool.id}
                              title={tool.title}
                              description={tool.description}
                              icon={tool.icon}
                              onClick={tool.onClick}
                              disabled={
                                !isConfigured ||
                                isGenerating ||
                                !inputText.trim()
                              }
                              isLoading={isGenerating}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="p-3.5 sm:p-4 bg-muted/50 rounded-xl border border-border">
                        <p className="text-sm text-foreground/80 leading-relaxed">
                          <span className="font-medium">Tip:</span> These tools
                          work best with longer text. Try using them on
                          paragraphs, articles, or detailed content.
                        </p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Output Column - Sticky on desktop */}
            <div ref={outputRef} className="lg:sticky lg:top-24 lg:self-start">
              <OutputPanel
                outputText={outputText}
                isLoading={isGenerating}
                onCopy={handleCopy}
                onDownload={handleDownload}
                onRewrite={handleRewriteFromOutput}
              />
            </div>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default Index;
