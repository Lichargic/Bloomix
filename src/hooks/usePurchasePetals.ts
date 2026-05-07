import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useAuth } from "../providers/AuthProvider";

export type PetalBundle = 100 | 350 | 750;

export function usePurchasePetals() {
	const { user } = useAuth();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (amount: PetalBundle) => {
			const { data, error } = await supabase.rpc("purchase_petals", { p_amount: amount });
			if (error) throw error;
			return data as { success: boolean; new_balance: number };
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
			queryClient.invalidateQueries({ queryKey: ["petal_transactions", user?.id] });
		},
	});
}
