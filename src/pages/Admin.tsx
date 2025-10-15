import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { Loader2 } from "lucide-react";
import { pollStorage, Poll } from "@/lib/pollStorage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Trash2, Plus, X } from "lucide-react";

const Admin = () => {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [pollImage, setPollImage] = useState<string>("");

  useEffect(() => {
    loadPollData();

    // Auto-refresh every 2 seconds
    const interval = setInterval(() => {
      loadPollData();
    }, 2000);

    // Listen for storage changes
    const handleStorageChange = () => {
      loadPollData();
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const loadPollData = () => {
    const activePoll = pollStorage.getActivePoll();
    
    if (!activePoll) {
      setLoading(false);
      setShowCreateForm(true);
      return;
    }

    setPoll(activePoll);
    const votes = pollStorage.getVotesByPoll(activePoll.id);

    const voteCounts = activePoll.options.map((option: string, index: number) => {
      const count = votes.filter((vote) => vote.optionIndex === index).length;
      return {
        name: option,
        votes: count,
      };
    });

    setChartData(voteCounts);
    setLoading(false);
  };

  const handleCreatePoll = () => {
    const validOptions = options.filter(opt => opt.trim() !== "");
    
    if (!question.trim() || validOptions.length < 2) {
      toast.error("Please provide a question and at least 2 options");
      return;
    }

    const newPoll: Poll = {
      id: crypto.randomUUID(),
      question: question.trim(),
      options: validOptions,
      image: pollImage || undefined,
      createdAt: new Date().toISOString()
    };

    pollStorage.savePoll(newPoll);
    setShowCreateForm(false);
    setQuestion("");
    setOptions(["", ""]);
    setPollImage("");
    toast.success("Poll created successfully!");
    loadPollData();
  };

  const handleClearAll = () => {
    if (confirm("Are you sure you want to clear all polls and votes?")) {
      pollStorage.clearAll();
      setPoll(null);
      setChartData([]);
      setShowCreateForm(true);
      toast.success("All data cleared");
    }
  };

  const handleClearVotes = () => {
    if (confirm("Are you sure you want to clear all votes?")) {
      pollStorage.clearVotes();
      toast.success("All votes cleared");
      loadPollData();
    }
  };

  const addOption = () => {
    setOptions([...options, ""]);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPollImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalVotes = chartData.reduce((sum, item) => sum + item.votes, 0);

  const chartConfig = {
    votes: {
      label: "Votes",
      color: "hsl(var(--primary))",
    },
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        {showCreateForm || !poll ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">Create New Poll</CardTitle>
              <CardDescription>Set up your live polling question and options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="question">Poll Question</Label>
                <Input
                  id="question"
                  placeholder="What is your question?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Poll Image (Optional)</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
                {pollImage && (
                  <img src={pollImage} alt="Preview" className="w-32 h-32 object-cover rounded-md" />
                )}
              </div>

              <div className="space-y-4">
                <Label>Options</Label>
                {options.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={`Option ${index + 1}`}
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                    />
                    {options.length > 2 && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => removeOption(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" onClick={addOption} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Option
                </Button>
              </div>

              <Button onClick={handleCreatePoll} className="w-full" size="lg">
                Create Poll
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex justify-end mb-4 gap-2">
              <Button variant="outline" onClick={() => setShowCreateForm(true)}>
                Create New Poll
              </Button>
              <Button variant="outline" onClick={handleClearVotes}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All Votes
              </Button>
              <Button variant="destructive" onClick={handleClearAll}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All Data
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-3xl">{poll.question}</CardTitle>
                <CardDescription>Live Results • Total Votes: {totalVotes}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {poll.image && (
                  <div className="flex justify-center">
                    <img 
                      src={poll.image} 
                      alt="Poll image" 
                      className="max-w-md w-full rounded-lg object-cover"
                    />
                  </div>
                )}
                <ChartContainer config={chartConfig} className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fill: "hsl(var(--foreground))" }}
                      />
                      <YAxis 
                        tick={{ fill: "hsl(var(--foreground))" }}
                        allowDecimals={false}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar 
                        dataKey="votes" 
                        fill="hsl(var(--primary))" 
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default Admin;
