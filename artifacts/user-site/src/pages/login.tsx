import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useLocation } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  phone: z.string().min(5, "Phone number required"),
  password: z.string().min(4, "Password required"),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: "", password: "" },
  });

  const loginMutation = useLogin({
    mutation: {
      onSuccess: (data) => {
        localStorage.setItem("auth_token", data.token);
        toast({ title: "Login successful", description: "Welcome back to yasin666!" });
        setLocation("/");
      },
      onError: (error: any) => {
        toast({ 
          title: "Login failed", 
          description: error?.response?.data?.error || "Invalid credentials",
          variant: "destructive"
        });
      }
    }
  });

  function onSubmit(values: z.infer<typeof loginSchema>) {
    loginMutation.mutate({ data: values });
  }

  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col items-center justify-center px-6">
      <div className="w-full bg-secondary border border-border p-6 rounded-2xl shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black italic text-primary drop-shadow-[0_0_10px_rgba(255,215,0,0.3)] mb-2">yasin666</h1>
          <p className="text-muted-foreground text-sm">Login to continue winning</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your phone" className="bg-background border-border" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Enter password" className="bg-background border-border" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              className="w-full font-bold text-lg mt-6 shadow-[0_0_15px_rgba(255,215,0,0.3)]" 
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Logging in..." : "LOG IN"}
            </Button>
          </form>
        </Form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link href="/register" className="text-primary font-bold hover:underline">
            Register now
          </Link>
        </div>
      </div>
    </div>
  );
}
