"use client";

import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { patientApi } from "@/lib/api-client";
import { FOCUS_OPTIONS, SEX_OPTIONS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const schema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name:  z.string().min(1, "Last name is required"),
  dob:        z.string().min(1, "Date of birth is required"),
  sex:        z.enum(["male", "female", "other"]),
  email:      z.string().email("Invalid email").optional().or(z.literal("")),
  phone:      z.string().optional(),
  primary_focus: z.enum(["hormones", "metabolic", "thyroid", "fertility", "genomics", "general"]),
  symptoms_goals:   z.string().optional(),
  relevant_history: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function NewPatientPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { sex: "male", primary_focus: "general" },
  });

  const onSubmit = async (values: FormData) => {
    try {
      const patient = await patientApi.create({
        ...values,
        email: values.email || undefined,
      });
      toast.success(`${patient.first_name} ${patient.last_name} created`);
      router.push(`/patients/${patient.id}`);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })
          ?.response?.data?.detail ?? "Failed to create patient";
      toast.error(msg);
    }
  };

  return (
    <div className="p-8 max-w-2xl">
      <Link
        href="/patients"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to patients
      </Link>

      <h1 className="text-2xl font-bold text-slate-900 mb-1">New Patient</h1>
      <p className="text-slate-500 text-sm mb-8">
        Create a new patient profile to begin documentation.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white rounded-xl border border-slate-200 p-6">
        {/* Name */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>First Name *</Label>
            <Input {...register("first_name")} placeholder="Andrew" />
            {errors.first_name && <p className="text-xs text-red-500">{errors.first_name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Last Name *</Label>
            <Input {...register("last_name")} placeholder="Ebberwein" />
            {errors.last_name && <p className="text-xs text-red-500">{errors.last_name.message}</p>}
          </div>
        </div>

        {/* DOB / Sex */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Date of Birth *</Label>
            <Input type="date" {...register("dob")} />
            {errors.dob && <p className="text-xs text-red-500">{errors.dob.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Sex *</Label>
            <Controller
              control={control}
              name="sex"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SEX_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        {/* Email / Phone */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" {...register("email")} placeholder="patient@example.com" />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input {...register("phone")} placeholder="555-0101" />
          </div>
        </div>

        {/* Primary focus */}
        <div className="space-y-1.5">
          <Label>Primary Focus *</Label>
          <Controller
            control={control}
            name="primary_focus"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FOCUS_OPTIONS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {/* Symptoms/goals */}
        <div className="space-y-1.5">
          <Label>Symptoms / Goals</Label>
          <Textarea
            {...register("symptoms_goals")}
            placeholder="e.g. Optimize testosterone, improve energy and focus."
            rows={3}
          />
        </div>

        {/* Relevant history */}
        <div className="space-y-1.5">
          <Label>Relevant History / Diagnoses</Label>
          <Textarea
            {...register("relevant_history")}
            placeholder="e.g. Previously on testosterone enanthate IM."
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => router.push("/patients")}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-purple-700 hover:bg-purple-800 text-white"
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating…</>
            ) : (
              "Create Patient"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}