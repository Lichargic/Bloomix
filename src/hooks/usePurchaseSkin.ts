import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useAuth } from "../providers/AuthProvider";
import type { SkinId } from "../lib/store";

export function usePurchaseSkin() {
	const { user } = useAuth();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (skinId: SkinId) => {
			const { data, error } = await supabase.rpc("purchase_skin", {
				p_skin_id: skinId,
			});
			if (error) throw error;
			return data as { success: boolean; new_balance: number };
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
			queryClient.invalidateQueries({ queryKey: ["owned_skins", user?.id] });
			queryClient.invalidateQueries({ queryKey: ["petal_transactions", user?.id] });
		},
	});
}
