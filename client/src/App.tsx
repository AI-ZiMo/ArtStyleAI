import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/components/landing/HomePage";
import BatchGenerate from "@/components/batch/BatchGenerate";
import RedeemPoints from "@/components/redeem/RedeemPoints";
import History from "@/components/history/History";
import NavBar from "@/components/layout/NavBar";
import Footer from "@/components/layout/Footer";
import { UserProvider } from "@/contexts/UserContext";

function Router() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <NavBar />
      <main className="flex-grow">
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/batch-generate" component={BatchGenerate} />
          <Route path="/redeem-points" component={RedeemPoints} />
          <Route path="/history" component={History} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <Router />
        <Toaster />
      </UserProvider>
    </QueryClientProvider>
  );
}

export default App;
