import { Field, Select } from "@/components/crm/ui";
import { NichePicker } from "@/components/crm/niche-picker";
import { CREATOR_TIER } from "@/lib/crm/catalog";

const PLATFORMS: [string, string][] = [["INSTAGRAM", "Instagram"], ["YOUTUBE", "YouTube"], ["LINKEDIN", "LinkedIn"], ["X", "X"], ["FACEBOOK", "Facebook"], ["MOJ", "Moj"], ["JOSH", "Josh"], ["SNAPCHAT", "Snapchat"], ["OTHER", "Other"]];
export { PLATFORMS };

type Creator = {
  name: string; handle: string; platform: string; profileUrl: string | null; followers: number; avgViews: number | null; engagementRate: number | null;
  tier: string; niches: string[]; languages: string[]; city: string | null; gender: string | null; reelRatePaise: number | null; storyRatePaise: number | null;
  postRatePaise: number | null; dlRatePaise?: number | null; youtubeUrl?: string | null; email: string | null; phone: string | null; managedBy: string | null; notes: string | null; tags: string[]; blacklisted: boolean;
};

const r = (p: number | null | undefined) => (p ? p / 100 : "");

export function CreatorFields({ creator }: { creator?: Creator }) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Name *"><input name="name" required defaultValue={creator?.name} className="crm-input" /></Field>
        <Field label="Handle *"><input name="handle" required defaultValue={creator?.handle} className="crm-input" placeholder="@handle" /></Field>
        <Field label="Platform"><Select name="platform" required defaultValue={creator?.platform ?? "INSTAGRAM"} options={PLATFORMS} /></Field>
        <Field label="Profile link"><input name="profileUrl" type="url" defaultValue={creator?.profileUrl ?? ""} className="crm-input" /></Field>
        <Field label="Followers"><input name="followers" defaultValue={creator?.followers ?? ""} className="crm-input" /></Field>
        <Field label="Average views"><input name="avgViews" defaultValue={creator?.avgViews ?? ""} className="crm-input" /></Field>
        <Field label="Engagement rate %"><input name="engagementRate" type="number" step="0.01" defaultValue={creator?.engagementRate ?? ""} className="crm-input" /></Field>
        <Field label="Tier" hint="Blank = from followers."><Select name="tier" defaultValue={creator?.tier} options={CREATOR_TIER} /></Field>
        <Field label="Niches" hint="Pick any number, or add your own."><NichePicker defaultValue={creator?.niches} /></Field>
        <Field label="Languages"><input name="languages" defaultValue={creator?.languages.join(", ")} className="crm-input" placeholder="Hindi, English" /></Field>
        <Field label="City"><input name="city" defaultValue={creator?.city ?? ""} className="crm-input" /></Field>
        <Field label="Gender"><input name="gender" defaultValue={creator?.gender ?? ""} className="crm-input" /></Field>
        <Field label="1 IG Reel (₹)"><input name="reelRate" defaultValue={r(creator?.reelRatePaise)} className="crm-input" /></Field>
        <Field label="Story + LIB (₹)"><input name="storyRate" defaultValue={r(creator?.storyRatePaise)} className="crm-input" /></Field>
        <Field label="DL, 1 month (₹)" hint="Digital licensing: the brand's paid use for a month."><input name="dlRate" defaultValue={r(creator?.dlRatePaise)} className="crm-input" /></Field>
        <Field label="Post / video rate (₹)"><input name="postRate" defaultValue={r(creator?.postRatePaise)} className="crm-input" /></Field>
        <Field label="YouTube link"><input name="youtubeUrl" type="url" defaultValue={creator?.youtubeUrl ?? ""} className="crm-input" /></Field>
        <Field label="Managed by"><input name="managedBy" defaultValue={creator?.managedBy ?? ""} className="crm-input" placeholder="Agency or manager" /></Field>
        <Field label="Email"><input name="email" type="email" defaultValue={creator?.email ?? ""} className="crm-input" /></Field>
        <Field label="Phone"><input name="phone" defaultValue={creator?.phone ?? ""} className="crm-input" /></Field>
        <Field label="Tags"><input name="tags" defaultValue={creator?.tags.join(", ")} className="crm-input" /></Field>
      </div>
      <Field label="Notes"><textarea name="notes" defaultValue={creator?.notes ?? ""} className="crm-input" /></Field>
      <label className="flex items-center gap-2 text-[0.875rem] text-ash"><input type="checkbox" name="blacklisted" defaultChecked={creator?.blacklisted} /> Do not work with (hidden from shortlists)</label>
    </>
  );
}
