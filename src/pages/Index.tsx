import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { BarChart3, Users } from "lucide-react";

const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="text-center max-w-4xl">
        <h1 className="mb-4 text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Interactive Live Polling
        </h1>
        <p className="text-xl text-muted-foreground mb-12">
          Create engaging live polls and watch results appear instantly as people vote
        </p>
        
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Users className="h-12 w-12 mb-4 text-primary" />
              <CardTitle>Vote on Poll</CardTitle>
              <CardDescription>
                Join the active poll and submit your vote in real-time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/vote">
                <Button size="lg" className="w-full">
                  Go to Voting
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <BarChart3 className="h-12 w-12 mb-4 text-primary" />
              <CardTitle>Admin Dashboard</CardTitle>
              <CardDescription>
                View live results with automatically updating charts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/admin">
                <Button size="lg" variant="secondary" className="w-full">
                  View Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
