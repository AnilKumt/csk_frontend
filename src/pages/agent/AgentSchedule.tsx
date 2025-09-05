import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  UserCircle,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format, addDays, isSameDay, subDays } from "date-fns";
import axios from "axios";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { RescheduleDialog } from "./RescheduleDialog";
import { DetailsDialog } from "./DetailsDialog";

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Lead } from "./LeadManagement";
import { RescheduleDialogAgent } from "./RescheduleDialogAgent";
import { useAuth } from "@/contexts/AuthContext";
import AgentDetailsDialog from "./AgentDetailsDialog";

const AgentSchedule = () => {
  const { user } = useAuth();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [appointments, setAppointments] = useState([]);
  const [leads, setLeads] = useState<Lead[]>([]);

  const [open, setOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [isRescheduleOpen, setRescheduleOpen] = useState(false);
  const [isDetailsOpen, setDetailsOpen] = useState(false);

  const { register, handleSubmit, setValue, reset } = useForm();

  // 📌 Submit new appointment
  const onSubmit = async (formData: any) => {
    try {
      const payload = {
        title: formData.title,
        lead: formData.leadId,
        agent: user._id,
        type: formData.type,
        startTime: `${formData.date}T${formData.startTime}`,
        endTime: `${formData.date}T${formData.endTime}`,
        location: formData.location,
        notes: formData.notes,
        date: formData.date,
        status: formData.status || "pending",
      };
      console.log(payload);
      await axios.post(
        `${import.meta.env.VITE_URL}/api/agent-schedule/addSchedules`,
        payload,
        { withCredentials: true }
      );

      toast({
        title: "Success",
        description: "Appointment created successfully.",
      });

      reset();
      setOpen(false);
      fetchAppointments();
    } catch (error: any) {
      console.error("API Error:", error);
      toast({
        title: "Error",
        description:
          error?.response?.data?.error || "Failed to save appointment",
        variant: "destructive",
      });
    }
  };

  // 📌 Fetch agent appointments
  const fetchAppointments = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_URL}/api/agent-schedule/getSchedules`,
        { withCredentials: true }
      );
      const schedules = res.data.schedules || [];

      setAppointments(
        schedules.map((appt: any) => ({
          ...appt,
          date: new Date(appt.date),
          startTime: new Date(appt.startTime),
          endTime: new Date(appt.endTime),
        }))
      );
    } catch (err) {
      console.error("Error fetching appointments:", err);
    }
  };

  // 📌 Fetch dropdown data (leads + projects)
  const fetchDropdownData = async () => {
    try {
      const leadsRes = await axios.get(
        `${import.meta.env.VITE_URL}/api/leads/getLeadsById`,
        { withCredentials: true }
      );
      setLeads(leadsRes.data);
    } catch (err) {
      console.error("Error fetching dropdown data:", err);
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchDropdownData();
  }, []);

  // 📌 Filter appointments by selected day
  const todaysAppointments = appointments.filter((appointment: any) =>
    date ? isSameDay(appointment.date, date) : false
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Agent Schedule</h1>
            <p className="text-muted-foreground">
              Manage your lead appointments
            </p>
          </div>

          {/* New Appointment Dialog */}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Appointment
              </Button>
            </DialogTrigger>
            <DialogContent className="md:w-[600px] w-[95vw] max-h-[85vh] overflow-y-auto rounded-xl">
              <DialogHeader>
                <DialogTitle>New Appointment</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-4 mt-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input {...register("title")} placeholder="Title" required />

                  {/* Lead Dropdown */}
                  <Select onValueChange={(value) => setValue("leadId", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Lead" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(leads) &&
                        leads.map((lead) => (
                          <SelectItem key={lead._id} value={lead._id}>
                            {lead.name}-{lead?.property?.basicInfo?.projectName}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  <Input type="date" {...register("date")} required />
                  <Input type="time" {...register("startTime")} required />
                  <Input type="time" {...register("endTime")} required />
                  <Input {...register("location")} placeholder="Location" />
                </div>

                {/* Type of Appointment */}
                <Select
                  onValueChange={(value) => setValue("type", value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="site_visit">Site Visit</SelectItem>
                    <SelectItem value="consultation">Consultation</SelectItem>
                    <SelectItem value="follow_up">Follow-up</SelectItem>
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="others">Others</SelectItem>
                  </SelectContent>
                </Select>

                <Textarea
                  {...register("notes")}
                  placeholder="Notes or Description"
                  className="min-h-[100px]"
                />

                {/* Status */}
                <Select
                  onValueChange={(value) => setValue("status", value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="rescheduled">Rescheduled</SelectItem>
                    <SelectItem value="no_show">No Show</SelectItem>
                  </SelectContent>
                </Select>

                <DialogFooter className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Save</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Calendar + Appointments */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Calendar</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center p-4">
              <Calendar mode="single" selected={date} onSelect={setDate} />
            </CardContent>
          </Card>

          {/* Appointment List */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>
                  {date ? format(date, "EEEE, MMMM do, yyyy") : "Schedule"}
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setDate(subDays(date!, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setDate(addDays(date!, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {todaysAppointments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No appointments scheduled
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {todaysAppointments.map((appointment: any) => (
                    <div
                      key={appointment._id}
                      className="flex gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center w-16 text-center">
                        <span className="text-sm font-medium">
                          {format(appointment.startTime, "h:mm")}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(appointment.startTime, "a")}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <h3 className="font-medium">{appointment.title}</h3>
                          <Badge
                            className={
                              appointment.status === "confirmed"
                                ? "bg-green-100 text-green-800"
                                : appointment.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }
                          >
                            {appointment.status}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <Clock className="mr-1 h-3 w-3" />
                            {format(appointment.startTime, "h:mm a")} -{" "}
                            {format(appointment.endTime, "h:mm a")}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="mr-1 h-3 w-3" />
                            {appointment.location}
                          </div>
                        </div>
                        {appointment.lead && (
                          <div className="flex items-center mt-2 gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={appointment.lead.avatar} />
                              <AvatarFallback>
                                {appointment.lead?.name?.[0] ?? "?"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">
                              {appointment.lead.name}
                            </span>
                            {appointment.property?.basicInfo?.projectName && (
                              <>
                                <span className="text-muted-foreground mx-1">
                                  •
                                </span>
                                <span className="text-sm">
                                  {appointment.property.basicInfo.projectName}
                                </span>
                              </>
                            )}
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="capitalize">
                            {appointment.type.replace("_", " ")}
                          </Badge>
                          <div className="flex-1"></div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedSchedule(appointment);
                                setRescheduleOpen(true);
                              }}
                            >
                              Reschedule
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedSchedule(appointment);
                                setDetailsOpen(true);
                              }}
                            >
                              Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {selectedSchedule && (
                    <RescheduleDialogAgent
                      open={isRescheduleOpen}
                      setOpen={setRescheduleOpen}
                      schedule={selectedSchedule}
                      fetchAppointments={fetchAppointments}
                      clients={leads}
                    />
                  )}
                  {selectedSchedule && (
                    <AgentDetailsDialog
                      open={isDetailsOpen}
                      setOpen={setDetailsOpen}
                      schedule={selectedSchedule}
                    />
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default AgentSchedule;
