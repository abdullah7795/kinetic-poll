import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { pollStorage, Poll, Vote as VoteType } from "@/lib/pollStorage";

const Vote = () => {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [votes, setVotes] = useState<VoteType[]>([]);
  const [initialRandomIndices] = useState<number[]>([]);

  useEffect(() => {
    loadPoll();

    // Auto-refresh every 2 seconds for live updates
    const interval = setInterval(() => {
      loadPoll();
    }, 2000);

    // Listen for storage changes (cross-tab updates)
    const handleStorageChange = () => {
      loadPoll();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const loadPoll = () => {
    const activePoll = pollStorage.getActivePoll();
    setPoll(activePoll);
    
    if (activePoll) {
      const voterSession = pollStorage.getVoterSession();
      const voted = pollStorage.hasVoted(activePoll.id, voterSession);
      setHasVoted(voted);
      
      const pollVotes = pollStorage.getVotesByPoll(activePoll.id);
      setVotes(pollVotes);
      
      // Set random indices only once on first load before voting
      if (initialRandomIndices.length === 0 && !voted) {
        const indices = Array.from({ length: activePoll.options.length }, (_, i) => i);
        const shuffled = indices.sort(() => Math.random() - 0.5).slice(0, 10);
        initialRandomIndices.push(...shuffled);
      }
    }
    
    setLoading(false);
  };

  const displayOptions = useMemo(() => {
    if (!poll) return [];
    
    // If user hasn't voted, show random 10
    if (!hasVoted && initialRandomIndices.length > 0) {
      return initialRandomIndices.map(i => ({ 
        index: i, 
        option: poll.options[i],
        count: votes.filter(v => v.optionIndex === i).length
      }));
    }
    
    // After voting, show top 10 by vote count
    const voteCounts = poll.options.map((option, index) => ({
      index,
      option,
      count: votes.filter(v => v.optionIndex === index).length
    }));
    
    return voteCounts
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [poll, hasVoted, votes, initialRandomIndices]);

  const handleSubmit = async () => {
    if (!selectedOption || !poll) return;

    setSubmitting(true);
    try {
      const voterSession = pollStorage.getVoterSession();
      
      pollStorage.addVote({
        pollId: poll.id,
        optionIndex: parseInt(selectedOption),
        voterSession,
        timestamp: new Date().toISOString()
      });

      toast.success("Vote submitted successfully!");
      setHasVoted(true);
      loadPoll();
    } catch (error: any) {
      toast.error("Failed to submit vote");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>No Active Poll</CardTitle>
            <CardDescription>There are no active polls at the moment.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">{poll.question}</CardTitle>
          <CardDescription>
            {hasVoted ? "Top 10 options by votes (live updating)" : "Random 10 options - Select your choice"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {poll.image && (
            <img 
              src={poll.image} 
              alt="Poll" 
              className="w-full max-h-64 object-cover rounded-lg" 
            />
          )}
          
          {hasVoted ? (
            <div className="space-y-3">
              {displayOptions.map(({ index, option, count }) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-4 rounded-lg border bg-accent/50"
                >
                  <span className="text-base font-medium">{option}</span>
                  <span className="text-sm text-muted-foreground font-semibold">
                    {count} votes
                  </span>
                </div>
              ))}
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">Thank you for voting! Results update live.</p>
              </div>
            </div>
          ) : (
            <>
              <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
                {displayOptions.map(({ index, option }) => (
                  <div key={index} className="flex items-center space-x-2 p-4 rounded-lg border hover:bg-accent transition-colors">
                    <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer text-base">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              <Button
                onClick={handleSubmit}
                disabled={!selectedOption || submitting}
                className="w-full"
                size="lg"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Vote"
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Vote;
