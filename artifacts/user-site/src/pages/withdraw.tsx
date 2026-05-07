import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link } from "wouter";
import { useRequestWithdraw, useGetMe } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, AlertCircle, Wallet } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const schema = z.object({
  amount: z.coerce.number().min(100, "Minimum withdrawal is Tk 100"),
  receiverPhone: z.string().min(5, "Phone number required"),
  note: z.string().optional(),
});

const QUICK_AMOUNTS = [200, 500, 1000, 5000];

export default function Withdraw() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: user } = useGetMe({ query: { retry: false } });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: 0,
      receiverPhone: user?.phone ?? "",
      note: "",
    },
  });

  const withdrawMutation = useRequestWithdraw({
    mutation: {
      onSuccess: () => {
        toast({
          title: "Withdrawal requested!",
          description: "Your request is under review. Balance has been deducted.",
        });
        qc.invalidateQueries();
        form.reset({ amount: 0, receiverPhone: user?.phone ?? "", note: "" });
      },
      onError: (error: any) => {
        toast({
          title: "Request failed",
          description: error?.response?.data?.error || "An error occurred",
          variant: "destructive",
        });
      },
    },
  });

  function onSubmit(values: z.infer<typeof schema>) {
    withdrawMutation.mutate({ data: values });
  }

  return (
    <div className="min-h-[calc(100vh-140px)] pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <Link href="/member">
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
        <h1 className="text-lg font-black text-foreground">Withdraw Funds</h1>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Balance card */}
        <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center shrink-0">
            <Wallet className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Available Balance</div>
            <div className="text-2xl font-black text-foreground">Tk {user?.balance?.toFixed(0) ?? "0"}</div>
          </div>
        </div>

        {/* Warning */}
        <div className="flex gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
          <AlertCircle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-500 leading-relaxed">
            Your balance will be deducted immediately. If your request is rejected, it will be refunded automatically.
          </p>
        </div>

        {/* Form */}
        <div className="bg-secondary border border-border rounded-2xl p-5 space-y-5">
          {/* Quick amounts */}
          <div>
            <div className="text-xs text-muted-foreground mb-2 font-medium">Quick Amount</div>
            <div className="grid grid-cols-4 gap-2">
              {QUICK_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => form.setValue("amount", amt)}
                  className="py-2 rounded-xl text-xs font-bold border border-border bg-background hover:border-primary hover:text-primary transition-all"
                >
                  Tk {amt}
                </button>
              ))}
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Withdraw Amount (Tk)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter amount"
                        className="bg-background border-border text-lg font-bold"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="receiverPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your bKash / Nagad Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="01XXXXXXXXX"
                        className="bg-background border-border"
                        {...field}
                      />
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
                    <FormLabel>Note (optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Any note for admin"
                        className="bg-background border-border"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full font-bold text-base py-6 bg-orange-500 hover:bg-orange-600 text-white shadow-lg"
                disabled={withdrawMutation.isPending}
              >
                {withdrawMutation.isPending ? "Submitting..." : "Request Withdrawal"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
