import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRequestDeposit, useGetMe } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Copy, ArrowDownCircle, Phone } from "lucide-react";
import { Link } from "wouter";

const depositSchema = z.object({
  amount: z.string().min(1, "Amount required").refine((v) => !isNaN(Number(v)) && Number(v) > 0, "Enter a valid amount"),
  senderPhone: z.string().min(5, "Your phone number is required"),
  note: z.string().optional(),
});

const DEPOSIT_PHONE = "01614920280";

export default function Deposit() {
  const { data: user } = useGetMe({ query: { retry: false } });
  const { toast } = useToast();

  const form = useForm<z.infer<typeof depositSchema>>({
    resolver: zodResolver(depositSchema),
    defaultValues: { amount: "", senderPhone: "", note: "" },
  });

  const depositMutation = useRequestDeposit({
    mutation: {
      onSuccess: () => {
        toast({ title: "Deposit request submitted!", description: "Your request is pending admin approval." });
        form.reset();
      },
      onError: (error: any) => {
        toast({
          title: "Failed to submit",
          description: error?.response?.data?.error || "Please try again.",
          variant: "destructive",
        });
      },
    },
  });

  function onSubmit(values: z.infer<typeof depositSchema>) {
    depositMutation.mutate({
      data: {
        amount: Number(values.amount),
        senderPhone: values.senderPhone,
        note: values.note || undefined,
      },
    });
  }

  function copyPhone() {
    navigator.clipboard.writeText(DEPOSIT_PHONE);
    toast({ title: "Copied!", description: "Deposit number copied to clipboard." });
  }

  if (!user) {
    return (
      <div className="p-6 text-center space-y-4">
        <ArrowDownCircle className="w-12 h-12 text-primary mx-auto" />
        <p className="text-muted-foreground">You must be logged in to make a deposit.</p>
        <Button asChild className="w-full font-bold">
          <Link href="/login">Login</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
          <ArrowDownCircle className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-2xl font-black text-foreground">DEPOSIT</h1>
      </div>

      {/* Current Balance */}
      <div className="bg-secondary border border-border rounded-xl p-4 flex items-center justify-between">
        <span className="text-muted-foreground text-sm">Current Balance</span>
        <span className="text-xl font-black text-primary">Tk {user.balance.toFixed(2)}</span>
      </div>

      {/* Step 1: Send money */}
      <div className="bg-secondary border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-black flex items-center justify-center">1</span>
          <h2 className="font-bold text-foreground">Send Money To</h2>
        </div>
        <div className="bg-background rounded-lg p-3 flex items-center justify-between border border-border">
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-primary" />
            <div>
              <div className="text-[11px] text-muted-foreground">bKash / Nagad / Rocket</div>
              <div className="text-lg font-black text-primary tracking-wider">{DEPOSIT_PHONE}</div>
            </div>
          </div>
          <button
            onClick={copyPhone}
            className="p-2 rounded-lg border border-border hover:border-primary hover:text-primary transition-colors"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground">Send your deposit to the number above, then fill in the form below.</p>
      </div>

      {/* Step 2: Submit form */}
      <div className="bg-secondary border border-border rounded-xl p-4 space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-black flex items-center justify-center">2</span>
          <h2 className="font-bold text-foreground">Submit Your Deposit</h2>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (Tk)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g. 500" className="bg-background border-border" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="senderPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Sending Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Number you sent from" className="bg-background border-border" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transaction ID / Note (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. TrxID: 1A2B3C4D" className="bg-background border-border" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full font-bold text-lg shadow-[0_0_15px_rgba(255,215,0,0.3)]"
              disabled={depositMutation.isPending}
            >
              {depositMutation.isPending ? "Submitting..." : "SUBMIT DEPOSIT"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
