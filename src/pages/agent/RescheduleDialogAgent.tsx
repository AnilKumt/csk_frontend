import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useForm, Controller } from "react-hook-form";
import axios from "axios";
import { toast } from "@/components/ui/use-toast";

export function RescheduleDialogAgent({
  open,
  setOpen,
  schedule,
  fetchAppointments,
  clients,
}) {
  const { control, register, handleSubmit, reset } = useForm({
    defaultValues: {
      ...schedule,
      clientId: schedule.lead?._id || schedule.clientId,
      date:
        typeof schedule.date === "string"
          ? schedule.date
          : schedule.date?.toISOString().split("T")[0],
      startTime: schedule.startTime
        ? new Date(schedule.startTime).toISOString().split("T")[1]?.slice(0, 5)
        : "",
      endTime: schedule.endTime
        ? new Date(schedule.endTime).toISOString().split("T")[1]?.slice(0, 5)
        : "",
      location: schedule.location || "",
      notes: schedule.notes || "",
    },
  });

  const onSubmit = async (formData) => {
    try {
      const payload = {
        ...formData,
        lead: formData.clientId, // backend expects `lead`
        startTime: `${formData.date}T${formData.startTime}`,
        endTime: `${formData.date}T${formData.endTime}`,
      };

      await axios.put(
        `${import.meta.env.VITE_URL}/api/agent-schedule/updateSchedules/${
          schedule._id
        }`,
        payload,
        { withCredentials: true }
      );

      toast({ title: "Success", description: "Appointment rescheduled." });
      setOpen(false);
      fetchAppointments();
    } catch (error) {
      toast({
        title: "Error",
        description: error?.response?.data?.error || "Failed to reschedule.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Reschedule Appointment</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input {...register("title")} placeholder="Title" required />

          {/* Lead / Client Selection */}
          <Controller
            name="clientId"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client._id} value={client._id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />

          <div className="grid grid-cols-2 gap-2">
            <Input type="date" {...register("date")} />
            <Input type="time" {...register("startTime")} />
            <Input type="time" {...register("endTime")} />
          </div>

          <Input {...register("location")} placeholder="Location" />
          <Textarea {...register("notes")} placeholder="Notes" />

          <DialogFooter className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Update</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
