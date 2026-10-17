/**
 * Shared portal category/status catalog for admin + profile portals.
 * Custom entries persist per property in the tenant `lookup_values` table
 * (category `portal_category` / `portal_tag`); code defaults are always
 * served when the table is empty (seeded content, never deleted).
 */
import { withTenant, lookupValuesTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";

export type PortalCategory = {
  id: number;
  key: string;
  name: string;
  nameAr: string;
  color: string;
  icon: string;
  contentTypes: ("activities" | "evaluations" | "documents")[];
};

export type PortalActivityStatus = {
  key: string;
  name: string;
  nameAr: string;
};

const DEFAULT_ACTIVITY_CATEGORIES: PortalCategory[] = [
  {
    id: 1,
    key: "social",
    name: "Social",
    nameAr: "اجتماعي",
    color: "#3B82F6",
    icon: "users",
    contentTypes: ["activities"],
  },
  {
    id: 2,
    key: "sports",
    name: "Sports",
    nameAr: "رياضي",
    color: "#EF4444",
    icon: "trophy",
    contentTypes: ["activities"],
  },
  {
    id: 3,
    key: "training",
    name: "Training",
    nameAr: "تدريبي",
    color: "#8B5CF6",
    icon: "book",
    contentTypes: ["activities", "documents"],
  },
  {
    id: 4,
    key: "welfare",
    name: "Wellness",
    nameAr: "رفاهية",
    color: "#10B981",
    icon: "heart",
    contentTypes: ["activities"],
  },
];

const DEFAULT_EVALUATION_CATEGORIES: PortalCategory[] = [
  {
    id: 10,
    key: "general",
    name: "General",
    nameAr: "عام",
    color: "#6B7280",
    icon: "inbox",
    contentTypes: ["evaluations"],
  },
  {
    id: 11,
    key: "performance",
    name: "Performance",
    nameAr: "الأداء",
    color: "#F59E0B",
    icon: "target",
    contentTypes: ["evaluations"],
  },
  {
    id: 12,
    key: "behavior",
    name: "Behavior",
    nameAr: "السلوك",
    color: "#10B981",
    icon: "user-check",
    contentTypes: ["evaluations"],
  },
  {
    id: 13,
    key: "attendance",
    name: "Attendance",
    nameAr: "الحضور",
    color: "#3B82F6",
    icon: "calendar",
    contentTypes: ["evaluations"],
  },
];

export const DEFAULT_ACTIVITY_STATUSES: PortalActivityStatus[] = [
  { key: "planned", name: "Planned", nameAr: "مخطط" },
  { key: "ongoing", name: "Ongoing", nameAr: "جاري" },
  { key: "completed", name: "Completed", nameAr: "مكتمل" },
  { key: "cancelled", name: "Cancelled", nameAr: "ملغي" },
];

const CATEGORY_LOOKUP = "portal_category";
const TAG_LOOKUP = "portal_tag";

type LookupRow = {
  id: number;
  value: string;
  valueAr?: string | null;
  extraValue?: string | null;
};

function parseExtra(row: LookupRow): Record<string, any> {
  try {
    const parsed = JSON.parse(row.extraValue || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function rowToCategory(row: LookupRow): PortalCategory {
  const extra = parseExtra(row);
  const contentTypes = Array.isArray(extra.contentTypes)
    ? extra.contentTypes
    : ["activities"];
  return {
    id: row.id,
    key: row.value,
    name: extra.name || row.value,
    nameAr: row.valueAr || extra.name || row.value,
    color: extra.color || "#0F2A44",
    icon: extra.icon || "folder",
    contentTypes,
  };
}

async function readCustomCategories(
  propertyId: number,
): Promise<PortalCategory[]> {
  try {
    const rows = (await withTenant(propertyId, async (tenantDb) =>
      tenantDb
        .select()
        .from(lookupValuesTable)
        .where(
          and(
            eq(lookupValuesTable.category, CATEGORY_LOOKUP),
            eq(lookupValuesTable.disabled, false),
          ),
        ),
    )) as unknown as LookupRow[];
    return (rows || []).map(rowToCategory);
  } catch {
    // Table missing on old tenants → defaults only (never break reads).
    return [];
  }
}

function mergeCategories(
  propertyId: number,
  custom: PortalCategory[],
): PortalCategory[] {
  void propertyId;
  const keys = new Set<string>();
  const merged: PortalCategory[] = [];
  for (const c of [
    ...DEFAULT_ACTIVITY_CATEGORIES,
    ...DEFAULT_EVALUATION_CATEGORIES,
    ...custom,
  ]) {
    if (keys.has(c.key)) continue;
    keys.add(c.key);
    merged.push(c);
  }
  return merged;
}

export async function getPortalCategories(
  propertyId: number,
  contentType?: string,
): Promise<PortalCategory[]> {
  const all = mergeCategories(propertyId, await readCustomCategories(propertyId));
  if (!contentType) return all;
  return all.filter((c) => c.contentTypes.includes(contentType as any));
}

export function getActivityStatuses(): PortalActivityStatus[] {
  return DEFAULT_ACTIVITY_STATUSES;
}

export async function addPortalCategory(
  propertyId: number,
  data: {
    key?: string;
    name: string;
    nameAr: string;
    color: string;
    icon?: string;
    contentTypes?: PortalCategory["contentTypes"];
  },
): Promise<PortalCategory> {
  const key =
    data.key || data.name.toLowerCase().replace(/\s+/g, "_").slice(0, 40);
  // Idempotent: return the existing row when the key already exists.
  const existing = (await getPortalCategories(propertyId)).find(
    (c) => c.key === key,
  );
  if (existing) return existing;
  const extra = JSON.stringify({
    name: data.name,
    color: data.color,
    icon: data.icon ?? "folder",
    contentTypes: data.contentTypes ?? ["activities"],
  });
  const [row] = (await withTenant(propertyId, async (tenantDb) =>
    tenantDb
      .insert(lookupValuesTable)
      .values({
        category: CATEGORY_LOOKUP,
        value: key,
        valueAr: data.nameAr,
        extraValue: extra,
      })
      .returning(),
  )) as unknown as LookupRow[];
  return rowToCategory(row);
}

export type PortalTag = {
  id: number;
  name: string;
  nameAr: string;
  color: string;
  description?: string;
};

export async function getPortalTags(propertyId: number): Promise<PortalTag[]> {
  try {
    const rows = (await withTenant(propertyId, async (tenantDb) =>
      tenantDb
        .select()
        .from(lookupValuesTable)
        .where(
          and(
            eq(lookupValuesTable.category, TAG_LOOKUP),
            eq(lookupValuesTable.disabled, false),
          ),
        ),
    )) as unknown as LookupRow[];
    return (rows || []).map((r) => {
      const extra = parseExtra(r);
      return {
        id: r.id,
        name: extra.name || r.value,
        nameAr: r.valueAr || extra.name || r.value,
        color: extra.color || "#C9A24D",
        description: extra.description,
      };
    });
  } catch {
    return [];
  }
}

export async function addPortalTag(
  propertyId: number,
  data: { name: string; nameAr: string; color: string; description?: string },
): Promise<PortalTag> {
  const existing = (await getPortalTags(propertyId)).find(
    (t) => t.name.toLowerCase() === data.name.toLowerCase(),
  );
  if (existing) return existing;
  const [row] = (await withTenant(propertyId, async (tenantDb) =>
    tenantDb
      .insert(lookupValuesTable)
      .values({
        category: TAG_LOOKUP,
        value: data.name,
        valueAr: data.nameAr,
        extraValue: JSON.stringify({
          name: data.name,
          color: data.color,
          description: data.description ?? "",
        }),
      })
      .returning(),
  )) as unknown as LookupRow[];
  const extra = parseExtra(row);
  return {
    id: row.id,
    name: extra.name || row.value,
    nameAr: row.valueAr || extra.name || row.value,
    color: extra.color || "#C9A24D",
    description: extra.description,
  };
}

export function getCategoryLabel(key: string, ar = false): string {
  const all = [
    ...DEFAULT_ACTIVITY_CATEGORIES,
    ...DEFAULT_EVALUATION_CATEGORIES,
  ];
  const found = all.find((c) => c.key === key);
  if (!found) return key;
  return ar ? found.nameAr : found.name;
}
