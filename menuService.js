import { supabase } from "./src/lib/supabase.js";

export async function getRestaurants() {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function getRestaurantMenu(restaurantId) {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("menu_items")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .eq("is_available", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}
