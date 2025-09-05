import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const AgentDetailsDialog = ({ open, setOpen, schedule }) => {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Appointment Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <p>
            <strong>Title:</strong> {schedule?.title}
          </p>
          <p>
            <strong>Client:</strong> {schedule?.lead?.name}
          </p>
          <p>
            <strong>Date:</strong>{" "}
            {typeof schedule.date === "string"
              ? schedule.date
              : schedule.date?.toISOString().split("T")[0]}
          </p>
          <p>
            <strong>Start Time:</strong>{" "}
            {schedule.startTime?.toISOString().split("T")[1]?.slice(0, 5)}
          </p>
          <p>
            <strong>End Time:</strong>{" "}
            {schedule.endTime?.toISOString().split("T")[1]?.slice(0, 5)}
          </p>
          <p>
            <strong>Location:</strong> {schedule?.location}
          </p>
          <p>
            <strong>Status:</strong> {schedule?.status}
          </p>
          <p>
            <strong>Notes:</strong> {schedule?.notes}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AgentDetailsDialog;
