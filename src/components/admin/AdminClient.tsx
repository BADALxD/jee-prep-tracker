"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { cn, formatDate, getInitials } from "@/lib/utils";
import {
  Users, Upload, FileText, Trash2, Plus, X,
  ShieldCheck, BookOpen, Link2
} from "lucide-react";
import toast from "react-hot-toast";
import type { UserProfile, Material, SubjectName } from "@/types";

interface AdminClientProps {
  adminUser: UserProfile;
  users: UserProfile[];
  materials: Material[];
  totalUsers: number;
}

type AdminTab = "users" | "materials";

export function AdminClient({ users, materials: initMaterials, totalUsers }: AdminClientProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("users");
  const [materials, setMaterials] = useState<Material[]>(initMaterials);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    subject: "" as SubjectName | "",
    material_type: "pdf_notes" as Material["material_type"],
    external_url: "",
    file_url: "",
  });

  const supabase = createClient();

  async function handleAddMaterial(e: React.FormEvent) {
  e.preventDefault();
  setIsLoading(true);

  const { data, error } = await supabase
    .from("materials")
    .insert({
      title: form.title,
      description: form.description || null,
      subject: form.subject,
      material_type: form.material_type,
      file_url:
        form.material_type === "important_link"
          ? form.external_url
          : form.file_url,
    })
    .select()
    .single();

  if (error) {
    console.error(error);
    toast.error(error.message || "Failed to add material");
  } else {
    toast.success("Material added!");
    setMaterials([data as Material, ...materials]);
    setShowUploadForm(false);
    setForm({
      title: "",
      description: "",
      subject: "",
      material_type: "pdf_notes",
      external_url: "",
      file_url: "",
    });
  }

  setIsLoading(false);
}

  async function handleDeleteMaterial(id: string) {
    const { error } = await supabase.from("materials").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete");
    } else {
      setMaterials(materials.filter((m) => m.id !== id));
      toast.success("Material deleted");
    }
  }

  const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: "users", label: "Users", icon: <Users className="h-4 w-4" /> },
    { id: "materials", label: "Materials", icon: <BookOpen className="h-4 w-4" /> },
  ];

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-6 w-6 text-indigo-400" />
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Admin Panel</h1>
          <p className="text-sm text-zinc-400 mt-0.5">Manage users and content</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={totalUsers}
          icon={<Users className="h-5 w-5 text-indigo-400" />}
          iconBg="bg-indigo-500/10"
        />
        <StatsCard
          title="Materials"
          value={materials.length}
          icon={<FileText className="h-5 w-5 text-emerald-400" />}
          iconBg="bg-emerald-500/10"
        />
        <StatsCard
          title="Active Materials"
          value={materials.filter((m) => m.is_active).length}
          icon={<BookOpen className="h-5 w-5 text-amber-400" />}
          iconBg="bg-amber-500/10"
        />
        <StatsCard
          title="Links"
          value={materials.filter((m) => m.material_type === "important_link").length}
          icon={<Link2 className="h-5 w-5 text-blue-400" />}
          iconBg="bg-blue-500/10"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-zinc-800 bg-zinc-900/40 p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
              activeTab === tab.id
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Users Tab */}
      {activeTab === "users" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Registered Users ({users.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 rounded-xl border border-zinc-800/50 bg-zinc-900/30 px-4 py-3"
                >
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white">
                    {getInitials(user.full_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-zinc-200">{user.full_name}</p>
                      {user.is_admin && (
                        <Badge variant="default">Admin</Badge>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500">{user.email}</p>
                  </div>
                  <div className="text-right flex-shrink-0 hidden sm:block">
                    <p className="text-xs text-zinc-400">JEE {user.target_year}</p>
                    <p className="text-xs text-zinc-500">{user.class} · {user.category}</p>
                  </div>
                  <div className="flex-shrink-0 hidden md:block">
                    <p className="text-xs text-zinc-500">{formatDate(user.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Materials Tab */}
      {activeTab === "materials" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowUploadForm((v) => !v)} size="sm">
              {showUploadForm ? <X className="h-4 w-4 mr-1.5" /> : <Plus className="h-4 w-4 mr-1.5" />}
              {showUploadForm ? "Cancel" : "Add Material"}
            </Button>
          </div>

          {showUploadForm && (
            <Card className="border-indigo-500/20 bg-indigo-500/5">
              <CardHeader className="pb-3">
                <CardTitle>Add New Material</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddMaterial} className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Input
                      label="Title"
                      placeholder="e.g. Rotational Motion Complete Notes"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Input
                      label="Description (optional)"
                      placeholder="Brief description of the material"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />
                  </div>
                  <Select
                    label="Subject"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value as SubjectName | "" })}
                    options={[
                      { value: "", label: "All Subjects" },
                      { value: "Physics", label: "Physics" },
                      { value: "Chemistry", label: "Chemistry" },
                      { value: "Mathematics", label: "Mathematics" },
                    ]}
                  />
                  <Select
                    label="Type"
                    value={form.material_type}
                    onChange={(e) => setForm({ ...form, material_type: e.target.value as Material["material_type"] })}
                    options={[
                      { value: "pdf_notes", label: "PDF Notes" },
                      { value: "pyq_pdf", label: "PYQ PDF" },
                      { value: "mock_paper", label: "Mock Paper" },
                      { value: "important_link", label: "Important Link" },
                      { value: "video", label: "Video" },
                      { value: "other", label: "Other" },
                    ]}
                  />
                  <div className="sm:col-span-2">
                    <Input
                      label={form.material_type === "important_link" ? "URL" : "File URL / Google Drive Link"}
                      placeholder="https://..."
                      value={form.material_type === "important_link" ? form.external_url : form.file_url}
                      onChange={(e) =>
                        form.material_type === "important_link"
                          ? setForm({ ...form, external_url: e.target.value })
                          : setForm({ ...form, file_url: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex gap-2 sm:col-span-2">
                    <Button type="submit" isLoading={isLoading}>
                      <Upload className="h-4 w-4 mr-1.5" />
                      Add Material
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-0">
              {materials.length === 0 ? (
                <div className="py-12 text-center">
                  <FileText className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
                  <p className="text-sm text-zinc-500">No materials yet</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-800/50">
                  {materials.map((mat) => (
                    <div
                      key={mat.id}
                      className="flex items-center gap-3 px-4 py-3 group hover:bg-zinc-900/30 transition-colors"
                    >
                      <FileText className="h-4 w-4 text-zinc-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-300 truncate">{mat.title}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {mat.subject && (
                            <span className="text-xs text-zinc-500">{mat.subject}</span>
                          )}
                          <Badge variant="secondary" className="text-[10px]">
                            {mat.material_type.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>
                      <span className="text-xs text-zinc-600 hidden sm:block flex-shrink-0">
                        {formatDate(mat.created_at)}
                      </span>
                      <button
                        onClick={() => handleDeleteMaterial(mat.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
