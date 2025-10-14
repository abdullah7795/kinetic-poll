import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const Vote = () => {
  const [poll, setPoll] = useState<any>(null);
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    fetchActivePoll();
  }, []);

  const getVoterSession = () => {
    let session = localStorage.getItem("voter_session");
    if (!session) {
      session = crypto.randomUUID();
      localStorage.setItem("voter_session", session);
    }
    return session;
  };

  const fetchActivePoll = async () => {
    try {
      const { data, error } = await supabase
        .from("polls")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      
      setPoll(data);
      
      // Check if user already voted
      const voterSession = getVoterSession();
      const { data: voteData } = await supabase
        .from("votes")
        .select("*")
        .eq("poll_id", data.id)
        .eq("voter_session", voterSession)
        .single();
      
      if (voteData) {
        setHasVoted(true);
      }
    } catch (error: any) {
      console.error("Error fetching poll:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedOption || !poll) return;

    setSubmitting(true);
    try {
      const voterSession = getVoterSession();
      
      const { error } = await supabase.from("votes").insert({
        poll_id: poll.id,
        option_index: parseInt(selectedOption),
        voter_session: voterSession,
      });

      if (error) throw error;

      toast.success("Vote submitted successfully!");
      setHasVoted(true);
    } catch (error: any) {
      toast.error(error.message || "Failed to submit vote");
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
          <CardDescription>Select one option and submit your vote</CardDescription>
        </CardHeader>
        <CardContent>
          {hasVoted ? (
            <div className="text-center py-8">
              <p className="text-lg text-muted-foreground">Thank you for voting!</p>
              <p className="text-sm text-muted-foreground mt-2">You have already submitted your vote for this poll.</p>
            </div>
          ) : (
            <>
              <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
                {(poll.options as string[]).map((option: string, index: number) => (
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
                className="w-full mt-6"
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
