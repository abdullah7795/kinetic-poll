import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { Loader2 } from "lucide-react";

const Admin = () => {
  const [poll, setPoll] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPollData();
    
    // Subscribe to real-time vote updates
    const channel = supabase
      .channel("votes-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "votes",
        },
        () => {
          fetchPollData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPollData = async () => {
    try {
      const { data: pollData, error: pollError } = await supabase
        .from("polls")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (pollError) throw pollError;

      setPoll(pollData);

      const { data: votesData, error: votesError } = await supabase
        .from("votes")
        .select("*")
        .eq("poll_id", pollData.id);

      if (votesError) throw votesError;

      // Count votes for each option
      const options = pollData.options as string[];
      const voteCounts = options.map((option: string, index: number) => {
        const count = votesData.filter((vote) => vote.option_index === index).length;
        return {
          name: option,
          votes: count,
        };
      });

      setChartData(voteCounts);
    } catch (error: any) {
      console.error("Error fetching poll data:", error);
    } finally {
      setLoading(false);
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
        <Card className="w-full max-w-4xl">
          <CardHeader>
            <CardTitle>No Active Poll</CardTitle>
            <CardDescription>There are no active polls at the moment.</CardDescription>
          </CardHeader>
        </Card>
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
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">{poll.question}</CardTitle>
            <CardDescription>Live Results • Total Votes: {totalVotes}</CardDescription>
          </CardHeader>
          <CardContent>
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
      </div>
    </div>
  );
};

export default Admin;
