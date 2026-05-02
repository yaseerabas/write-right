import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Sparkles, Mail, FileText, MessageSquare, Briefcase, Star, Plus } from "lucide-react";
import { useState, useMemo } from "react";
import { useSecureStorage } from "@/hooks/useSecureStorage";
import { showSuccess } from "@/utils/toast";

interface QuickPrompt {
  id: string;
  text: string;
  category: string;
  icon: any;
  isCustom?: boolean;
  isFavorite?: boolean;
}

const defaultPrompts: QuickPrompt[] = [
  { id: "1", text: "Write a blog post about the benefits of remote work", category: "Blog", icon: FileText },
  { id: "2", text: "Create an email to a client about project updates", category: "Email", icon: Mail },
  { id: "3", text: "Generate a product description for a smart watch", category: "Product", icon: Sparkles },
  { id: "4", text: "Write a social media post about a new feature launch", category: "Social", icon: MessageSquare },
  { id: "5", text: "Create a cover letter for a software developer position", category: "Career", icon: Briefcase },
  { id: "6", text: "Write a product review for a new laptop", category: "Review", icon: FileText },
  { id: "7", text: "Generate marketing copy for a mobile app", category: "Marketing", icon: Sparkles },
  { id: "8", text: "Create a thank you email after a job interview", category: "Email", icon: Mail },
];

interface QuickPromptsProps {
  onPromptSelect: (prompt: string) => void;
}

export const QuickPrompts = ({ onPromptSelect }: QuickPromptsProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customPromptText, setCustomPromptText] = useState("");

  const [customPrompts, setCustomPrompts] = useSecureStorage<QuickPrompt[]>('ai_custom_prompts', []);
  const [favorites, setFavorites] = useSecureStorage<string[]>('ai_prompt_favorites', []);

  const allPrompts = useMemo(() => [...defaultPrompts, ...customPrompts], [customPrompts]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(allPrompts.map(p => p.category)));
    return cats.sort();
  }, [allPrompts]);

  const filteredPrompts = useMemo(() => {
    let prompts = allPrompts.filter(prompt => {
      const matchesSearch = prompt.text.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || prompt.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    // Sort favorites first
    return prompts.sort((a, b) => {
      const aFav = favorites.includes(a.id) ? 1 : 0;
      const bFav = favorites.includes(b.id) ? 1 : 0;
      return bFav - aFav;
    });
  }, [searchTerm, selectedCategory, allPrompts, favorites]);

  const toggleFavorite = (id: string) => {
    setFavorites(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const addCustomPrompt = () => {
    if (!customPromptText.trim()) return;
    const newPrompt: QuickPrompt = {
      id: `custom-${Date.now()}`,
      text: customPromptText.trim(),
      category: "Custom",
      icon: Sparkles,
      isCustom: true
    };
    setCustomPrompts(prev => [...prev, newPrompt]);
    setCustomPromptText("");
    setShowAddCustom(false);
    showSuccess("Custom prompt added!");
  };

  const removeCustomPrompt = (id: string) => {
    setCustomPrompts(prev => prev.filter(p => p.id !== id));
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          Quick Prompts
        </CardTitle>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search prompts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-sm"
          />
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-1">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
            className="text-xs h-7"
          >
            All
          </Button>
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="text-xs h-7"
            >
              {category}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-2 max-h-[250px] sm:max-h-[300px] overflow-y-auto custom-scrollbar">
        {filteredPrompts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No prompts found</p>
        ) : (
          filteredPrompts.map((prompt) => {
            const Icon = prompt.icon;
            const isFav = favorites.includes(prompt.id);
            return (
              <div
                key={prompt.id}
                className="group p-2.5 sm:p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-primary/5 hover:border-primary/20 border border-transparent transition-all duration-200"
                onClick={() => onPromptSelect(prompt.text)}
              >
                <div className="flex items-start gap-2">
                  <Icon className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground group-hover:text-primary transition-colors">
                      {prompt.text}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {prompt.category}
                      </Badge>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(prompt.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Star className={`h-3.5 w-3.5 ${isFav ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} />
                      </button>
                      {prompt.isCustom && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeCustomPrompt(prompt.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-destructive hover:text-destructive/80"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Add custom prompt */}
        {showAddCustom ? (
          <div className="space-y-2 pt-2">
            <Input
              placeholder="Enter your custom prompt..."
              value={customPromptText}
              onChange={(e) => setCustomPromptText(e.target.value)}
              className="text-sm"
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={addCustomPrompt} className="flex-1">Add</Button>
              <Button size="sm" variant="outline" onClick={() => setShowAddCustom(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAddCustom(true)}
            className="w-full gap-2 text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-4 w-4" />
            Add Custom Prompt
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
