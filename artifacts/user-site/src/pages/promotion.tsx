import { useGetPromotions } from "@workspace/api-client-react";
import { Gift } from "lucide-react";

export default function Promotion() {
  const { data: promotions, isLoading } = useGetPromotions();

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
          <Gift className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-2xl font-black text-foreground">PROMOTIONS</h1>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-muted-foreground">Loading promotions...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {promotions?.map((promo) => (
            <div key={promo.id} className="bg-secondary border border-border rounded-xl overflow-hidden flex flex-col">
              {promo.imageUrl && (
                <div className="w-full aspect-[2/1]">
                  <img src={promo.imageUrl} alt={promo.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-4">
                <h3 className="font-bold text-primary mb-2 text-lg">{promo.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{promo.description}</p>
                <button className="mt-4 w-full py-2 rounded-lg border border-primary text-primary font-bold hover:bg-primary/10 transition-colors">
                  CLAIM BONUS
                </button>
              </div>
            </div>
          ))}
          {(!promotions || promotions.length === 0) && (
            <div className="text-center py-10 bg-secondary rounded-xl border border-border">
              <p className="text-muted-foreground">No active promotions right now.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
