import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useAuth } from "../providers/AuthProvider";
import type { SkinId } from "../lib/store";

export interface OwnedSkin {
	skin_id: SkinId;
	purchased_at: string;
}

export function useOwnedSkins() {
	const { user } = useAuth();
	return useQuery<OwnedSkin[]>({
		queryKey: ["owned_skins", user?.id],
		queryFn: async () => {
			if (!user) return [];
			const { data, error } = await supabase
				.from("user_skins")
				.select("skin_id, purchased_at")
				.eq("user_id", user.id)
				.order("purchased_at", { ascending: true });
			if (error) throw error;
			return (data ?? []) as OwnedSkin[];
		},
		enabled: !!user,
		staleTime: 30_000,
	});
}
