import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useAuth } from "../providers/AuthProvider";

export interface PetalTransaction {
	id: string;
	type: "earn_tended_day" | "earn_cycle" | "purchase_petals" | "spend_skin";
	amount: number;
	label: string;
	created_at: string;
}

export function usePetalTransactions() {
	const { user } = useAuth();
	return useQuery<PetalTransaction[]>({
		queryKey: ["petal_transactions", user?.id],
		queryFn: async () => {
			if (!user) return [];
			const { data, error } = await supabase
				.from("petal_transactions")
				.select("id, type, amount, label, created_at")
				.eq("user_id", user.id)
				.order("created_at", { ascending: false })
				.limit(100);
			if (error) throw error;
			return (data ?? []) as PetalTransaction[];
		},
		enabled: !!user,
		staleTime: 15_000,
	});
}
