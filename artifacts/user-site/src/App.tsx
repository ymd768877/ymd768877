import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";

import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Promotion from "@/pages/promotion";
import Deposit from "@/pages/deposit";
import Transactions from "@/pages/transactions";
import Member from "@/pages/member";
import Invite from "@/pages/invite";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/promotion" component={Promotion} />
        <Route path="/deposit" component={Deposit} />
        <Route path="/transactions" component={Transactions} />
        <Route path="/member" component={Member} />
        <Route path="/invite" component={Invite} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
