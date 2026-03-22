import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { verifyAuth } from "@/lib/auth/verify";

export async function POST(req: NextRequest) {
  if (!(await verifyAuth(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient();
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const dropId = formData.get("dropId") as string;
  const type = formData.get("type") as string; // "hero" or "flavor"

  if (!file || !dropId || !type) {
    return NextResponse.json({ error: "Missing file, dropId, or type" }, { status: 400 });
  }

  // File validation
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Only JPEG, PNG, WebP, and HEIC images allowed" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
  }
  if (!["hero", "flavor"].includes(type)) {
    return NextResponse.json({ error: "Type must be 'hero' or 'flavor'" }, { status: 400 });
  }

  // Use fixed path (no extension) so upsert always replaces the same file
  const path = `${dropId}/${type}`;

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from("drop-images")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from("drop-images")
    .getPublicUrl(path);

  // Append cache-buster so browsers and CDNs fetch the new version
  const imageUrl = `${urlData.publicUrl}?v=${Date.now()}`;

  // Update drop with cache-busted URL so storefront pages also show the new image
  const column = type === "hero" ? "hero_image_url" : "flavor_image_url";
  await supabase
    .from("drops")
    .update({ [column]: imageUrl })
    .eq("id", dropId);

  return NextResponse.json({ url: imageUrl });
}
