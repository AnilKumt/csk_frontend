import React, { useState, useEffect,useMemo } from "react";
import MainLayout from "@/components/layout/MainLayout";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogClose,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  Search,
  Filter,
  ArrowUpDown,
  MoreHorizontal,
  Camera,
  CheckCircle,
  Building,
  FileText,
  AlertOctagon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Upload, XCircle } from "lucide-react";
import axios from "axios";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { X } from "lucide-react";
import { CONSTRUCTION_PHASES } from "@/types/construction";
import { DatePicker } from "@/components/ui/date-picker";
import { Image as ImageIcon, AlertCircle } from "lucide-react";

interface QualityIssue {
  id: string;
  title: string;
  project: string;
  unit: string;
  contractor: string;
  severity: "critical" | "major" | "minor";
  status: "open" | "under_review" | "resolved";
  reportedDate: string;
  taskId?: string;
  description: string;
}

const qualityIssues: QualityIssue[] = [
  {
    id: "q1",
    title: "Cracked foundation concrete",
    project: "Riverside Tower",
    unit: "Block A",
    contractor: "ABC Construction Ltd.",
    severity: "critical",
    status: "open",
    reportedDate: "2025-04-10",
    taskId: "t101",
    description:
      "Multiple cracks detected in the foundation concrete. Requires immediate attention.",
  },
  {
    id: "q2",
    title: "Improper electrical wiring",
    project: "Valley Heights",
    unit: "Unit 3",
    contractor: "PowerTech Systems",
    severity: "major",
    status: "under_review",
    reportedDate: "2025-04-12",
    taskId: "t205",
    description:
      "Electrical wiring does not follow building code standards. Safety hazard.",
  },
  {
    id: "q3",
    title: "Poor quality wall finishing",
    project: "Green Villa",
    unit: "Villa 2",
    contractor: "XYZ Builders",
    severity: "minor",
    status: "open",
    reportedDate: "2025-04-14",
    description: "Wall finishing is uneven and shows visible imperfections.",
  },
  {
    id: "q4",
    title: "Incorrect bathroom tile installation",
    project: "Riverside Tower",
    unit: "Block B",
    contractor: "Elite Ceramics",
    severity: "minor",
    status: "resolved",
    reportedDate: "2025-04-05",
    taskId: "t156",
    description:
      "Tiles were installed with improper spacing and alignment. Contractor has corrected the issue.",
  },
  {
    id: "q5",
    title: "Structural column misalignment",
    project: "Valley Heights",
    unit: "Unit 7",
    contractor: "ABC Construction Ltd.",
    severity: "critical",
    status: "under_review",
    reportedDate: "2025-04-08",
    taskId: "t198",
    description:
      "Column position deviates from structural drawings by 5cm. Structural engineer review required.",
  },
];

const severityColors: Record<string, string> = {
  critical: "bg-red-100 text-red-800",
  major: "bg-amber-100 text-amber-800",
  minor: "bg-blue-100 text-blue-800",
};

const statusColors: Record<string, string> = {
  open: "bg-red-100 text-red-800",
  under_review: "bg-amber-100 text-amber-800",
  resolved: "bg-green-100 text-green-800",
};

const QualityControl = () => {
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [qualityIssues, setQualityIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contractors, setContractors] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedProjectAssign, setSelectedProjectAssign] = useState(null);
  const [assignDialog, setAssignDiaog] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [phase, setPhase] = useState("");
  const [priority, setPriority] = useState("medium");
  const [deadline, setDeadline] = useState<Date | undefined>(new Date());
  const [selectedContractorId, setSelectedContractorId] = useState(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [evidenceDialogOpen, setEvidenceDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    project: "",
    projectName: "",
    unit: "",
    contractor: "",
    severity: "",
    description: "",
    status: "",
  });
  const [units, setUnits] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setPhotos((prevPhotos) => [...prevPhotos, ...newFiles]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prevPhotos) => prevPhotos.filter((_, i) => i !== index));
  };

  const handleAssignContractor = async (e) => {
    e.preventDefault();
    try {
      if (!selectedContractorId || !selectedIssue?._id) {
        toast.error("Missing contractor or issue");
        return;
      }

      const payload = {
        title: selectedIssue.title,
        contractorId: selectedContractorId,
        projectId: selectedIssue.project._id,
        unit: selectedIssue.unit,
        priority,
        deadline,
        phase,
        qualityIssueId: selectedIssue._id,
        description,
      };

      const res = await axios.post(
        `${
          import.meta.env.VITE_URL
        }/api/project/site-incharge/assign-task-to-contractor`,
        payload,
        { withCredentials: true }
      );

      if (res.status === 200) {
        toast.success("Task assigned and contractor updated successfully");
        setAssignDiaog(false);
        fetchQualityIssues();
        setSelectedContractorId("");
        setDeadline(null);
        setDescription("");
        setPhase("");
        setPriority("");
        // Refresh quality issue or task list if needed
      } else {
        toast.error("Failed to assign task");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error assigning task");
    }
  };

  const handleViewDetails = (issue) => {
    setSelectedIssue(issue);
    setOpenDialog(true);
  };

  const handleUpdateStatus = (issue) => {
    setSelectedIssue(issue);
    setNewStatus(issue.status);
    setStatusDialogOpen(true);
  };

  const fetchQualityIssues = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_URL}/api/quality-issue/issues`,
        { withCredentials: true }
      );
      setQualityIssues(res.data.issues); // Ensure backend sends an array
    } catch (err) {
      setError("Failed to load issues");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // 1. Upload photos one-by-one
      const uploadedImageUrls: string[] = [];
      for (const photo of photos) {
        const formData = new FormData();
        formData.append("file", photo);

        try {
          const res = await axios.post(
            `${import.meta.env.VITE_URL}/api/uploads/upload`,
            formData,
            {
              headers: { "Content-Type": "multipart/form-data" },
            }
          );
          if (res.data.url) uploadedImageUrls.push(res.data.url);
        } catch (err) {
          console.error("Upload failed", err);
        }
      }

      const payload = {
        ...formData,
        evidenceImages: uploadedImageUrls,
      };
      const res = await axios.post(
        `${import.meta.env.VITE_URL}/api/quality-issue/create-quality-issue`,
        payload,
        { withCredentials: true }
      );

      if (res) {
        toast.success("Issue reported successfully");
        setIsDialogOpen(false);
        setPhotos([]);
        setFormData({
          title: "",
          project: "",
          projectName:"",
          unit: "",
          contractor: "",
          severity: "",
          description: "",
          status: "",
        });
        fetchQualityIssues();
      } else {
        toast.error("Failed to report issue");
      }
    } catch (err) {
      toast.error("Something went wrong");
      console.error(err);
    }
  };

  useEffect(() => {
    fetchQualityIssues();
  }, []);

  const fetchDropdownData = async () => {
    try {
      const clientsRes = await axios.get(
        `${import.meta.env.VITE_URL}/api/user/contractors`,
        { withCredentials: true }
      ); // Replace with your actual route
      const projectsRes = await axios.get(
        `${import.meta.env.VITE_URL}/api/project/projects`,
        { withCredentials: true }
      );

      setContractors(clientsRes.data.data);
      setProjects(projectsRes.data);
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
    }
  };

  useEffect(() => {
    fetchDropdownData();
  }, []);

  const filteredIssues = useMemo(() => {
    if (!Array.isArray(qualityIssues)) return [];

    return qualityIssues.filter((issue) => {
      // Handle cases where issue.project is null
      if (!issue.project) return projectFilter === "all-projects";

      const issueProjectId = issue.project.projectId?._id;
      console.log("Filtering issue with project ID:", issueProjectId);
      return projectFilter === "all-projects" || issueProjectId === projectFilter;
  
    });
  }, [qualityIssues, projectFilter]);

  return (
    <MainLayout>
      <div className="space-y-6 md:p-8 p-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quality Control</h1>
          <p className="text-muted-foreground">
            Manage and track quality issues across all construction projects
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Issues</CardTitle>
              <AlertOctagon className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Array.isArray(qualityIssues) &&
                  qualityIssues.filter((issue) => issue.status === "open")
                    .length}
              </div>
              <p className="text-xs text-muted-foreground">Require attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Under Review
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Array.isArray(qualityIssues) &&
                  qualityIssues.filter(
                    (issue) => issue.status === "under_review"
                  ).length}
              </div>
              <p className="text-xs text-muted-foreground">In progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Array.isArray(qualityIssues) &&
                  qualityIssues.filter((issue) => issue.status === "resolved")
                    .length}
              </div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="open">Open</TabsTrigger>
            <TabsTrigger value="under_review">Under Review</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
          </TabsList>

          <div className="flex flex-col md:flex-row justify-between my-4 gap-4">
            <div className="flex flex-1 items-center space-x-2 md:flex-row flex-col md:gap-0 gap-5">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search issues..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* FILTER DROPDOWN */}
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="w-fit">
                  <div className="flex items-center">
                    <Building className="h-4 w-4 mr-2" />
                    {/* Using SelectValue is the recommended way */}
                    <SelectValue placeholder="Select a project" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-projects">All Projects</SelectItem>
                  {projects.map((property) => (
                    <SelectItem key={property._id} value={property._id}>
                      {property.projectTitle || "Invalid title"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-fit">
                  <div className="flex items-center">
                    <Filter className="h-4 w-4 mr-2" />
                    <span>
                      {severityFilter === "all-severities" || !severityFilter
                        ? "All Severities"
                        : severityFilter.charAt(0).toUpperCase() +
                          severityFilter.slice(1)}
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-severities">All Severities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="major">Major</SelectItem>
                  <SelectItem value="minor">Minor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <AlertOctagon className="h-4 w-4 mr-2" />
                  Report New Issue
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] sm:max-w-[600px] w-full overflow-y-auto p-6 rounded-xl">
                <DialogHeader>
                  <h2 className="text-xl font-semibold">
                    Report New Quality Issue
                  </h2>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Title</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                    />
                  </div>

                  <select
                    className="w-full border p-2 rounded"
                    value={formData.project || ""}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const project = projects.find(
                        (p) => p._id === selectedId
                      );

                      console.log("Selected Project Object:", project);
                      console.log(
                        "Selected Project Name:",
                        project.projectTitle
                      );

                      setFormData({
                        ...formData,
                        project: selectedId, // keep ID for backend
                        projectName:
                          project?.projectTitle ||
                          project?.name ||
                          "Unnamed Project", // store name for UI
                        unit: "",
                      });
                      setSelectedProject(project);
                    }}
                  >
                    <option value="">Select Project</option>
                    {projects.map((proj) => (
                      <option key={proj._id} value={proj._id}>
                        {proj.projectTitle || proj.name || "Unnamed Project"}
                      </option>
                    ))}
                  </select>

                  <div className="grid gap-2">
                    <Label>Unit</Label>
                    <select
                      className="w-full border p-2 rounded"
                      value={formData.unit}
                      onChange={(e) =>
                        setFormData({ ...formData, unit: e.target.value })
                      }
                      disabled={!selectedProject}
                    >
                      <option value="">Select Unit</option>
                      {selectedProject?.unitNames?.map((unitName) => (
                        <option key={unitName} value={unitName}>
                          {unitName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-2">
                    <Label>Contractor</Label>
                    <Select
                      value={formData.contractor}
                      onValueChange={(value) =>
                        setFormData({ ...formData, contractor: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Contractor" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(contractors) &&
                          contractors.map((c) => (
                            <SelectItem key={c._id} value={c._id}>
                              {c.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label>Severity</Label>
                    <Select
                      value={formData.severity}
                      onValueChange={(value) =>
                        setFormData({ ...formData, severity: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Severity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minor">Minor</SelectItem>
                        <SelectItem value="major">Major</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label>Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="under_review">
                          Under Review
                        </SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label>Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Upload Photos</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-2">
                      {photos.map((photo, index) => (
                        <div
                          key={index}
                          className="relative rounded-md overflow-hidden border border-border h-32"
                        >
                          <img
                            src={URL.createObjectURL(photo)}
                            alt={`Inspection ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute top-1 right-1 bg-black bg-opacity-60 hover:bg-opacity-80 rounded-full"
                            onClick={() => removePhoto(index)}
                          >
                            <XCircle className="h-4 w-4 text-white" />
                          </Button>
                        </div>
                      ))}

                      {photos.length < 9 && (
                        <Button
                          type="button"
                          variant="outline"
                          className="h-32 border-dashed flex flex-col"
                          onClick={() =>
                            document
                              .getElementById("inspection-photo-upload")
                              ?.click()
                          }
                        >
                          <Upload className="mb-2 h-6 w-6" />
                          <span>Add Photos</span>
                        </Button>
                      )}
                    </div>
                    <Input
                      id="inspection-photo-upload"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={handleFileChange}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button onClick={handleSubmit} className="w-full">
                    Submit
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              {/* Desktop / Tablet Table View */}
              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <div className="flex items-center">
                          Issue
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead>Project / Unit</TableHead>
                      <TableHead>Contractor</TableHead>
                      <TableHead>Reported Date</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredIssues.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-6 text-muted-foreground"
                        >
                          No quality issues found matching your filters
                        </TableCell>
                      </TableRow>
                    ) : (
                      Array.isArray(filteredIssues) &&
                      filteredIssues.map((issue) => (
                        <TableRow key={issue.taskId || issue.title}>
                          {/* Ensure unique key */}
                          <TableCell className="font-medium">
                            <div>
                              {issue.title}
                              {issue.taskId && (
                                <div className="text-xs text-muted-foreground">
                                  Task ID: {issue.taskId}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {issue?.project?.projectId?.basicInfo.projectName ||
                              "Untitled Project"}{" "}
                            / {issue?.unit || "N/A"}
                          </TableCell>
                          <TableCell>
                            {typeof issue.contractor === "object"
                              ? issue.contractor?.name || "N/A"
                              : issue.contractor || "Contractor"}
                          </TableCell>
                          <TableCell>
                            {issue?.reported_date
                              ? new Date(
                                  issue.reported_date
                                ).toLocaleDateString()
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={severityColors[issue.severity]}
                            >
                              {issue?.severity.charAt(0).toUpperCase() +
                                issue?.severity.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={statusColors[issue.status]}
                            >
                              {issue.status === "under_review"
                                ? "Under Review"
                                : issue?.status.charAt(0).toUpperCase() +
                                  issue?.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={() => handleViewDetails(issue)}
                                >
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleUpdateStatus(issue)}
                                >
                                  Update Status
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedIssue(issue);
                                    setAssignDiaog(true);
                                  }}
                                >
                                  Assign Contractor
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedIssue(issue);
                                    setEvidenceDialogOpen(true);
                                  }}
                                >
                                  View Evidence
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="block sm:hidden space-y-4 p-4">
                {filteredIssues.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    No quality issues found matching your filters
                  </div>
                ) : (
                  filteredIssues.map((issue) => (
                    <div
                      key={issue.taskId || issue.title}
                      className="border rounded-xl p-4 shadow-sm bg-white"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-base">
                            {issue.title}
                          </h3>
                          {issue.taskId && (
                            <p className="text-xs text-muted-foreground">
                              Task ID: {issue.taskId}
                            </p>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => handleViewDetails(issue)}
                            >
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleUpdateStatus(issue)}
                            >
                              Update Status
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedIssue(issue);
                                setAssignDiaog(true);
                              }}
                            >
                              Assign Contractor
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedIssue(issue);
                                setEvidenceDialogOpen(true);
                              }}
                            >
                              View Evidence
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="mt-3 grid gap-2 text-sm">
                        <p>
                          <strong>Project:</strong>{" "}
                          {issue?.project?.projectId?.basicInfo.projectName ||
                            "Untitled Project"}{" "}
                          / {issue?.unit || "N/A"}
                        </p>
                        <p>
                          <strong>Contractor:</strong>{" "}
                          {typeof issue.contractor === "object"
                            ? issue.contractor?.name
                            : issue.contractor}
                        </p>
                        <p>
                          <strong>Date:</strong>{" "}
                          {issue?.reported_date
                            ? new Date(issue.reported_date).toLocaleDateString()
                            : "N/A"}
                        </p>
                        <p>
                          <strong>Severity:</strong>{" "}
                          <Badge
                            variant="outline"
                            className={severityColors[issue.severity]}
                          >
                            {issue?.severity.charAt(0).toUpperCase() +
                              issue?.severity.slice(1)}
                          </Badge>
                        </p>
                        <p>
                          <strong>Status:</strong>{" "}
                          <Badge
                            variant="outline"
                            className={statusColors[issue.status]}
                          >
                            {issue.status === "under_review"
                              ? "Under Review"
                              : issue?.status.charAt(0).toUpperCase() +
                                issue?.status.slice(1)}
                          </Badge>
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Dialog to display issue details */}
              <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogContent className="md:w-[600px] w-[95vw] max-h-[85vh] overflow-y-auto rounded-xl">
                  <div className="flex justify-between items-start">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-semibold">
                        Issue Details
                      </DialogTitle>
                    </DialogHeader>
                  </div>
                  {selectedIssue && (
                    <div className="grid gap-4 mt-2 text-sm">
                      <div>
                        <strong>Title:</strong> {selectedIssue.title}
                      </div>
                      <div>
                        <strong>Task ID:</strong>{" "}
                        {selectedIssue.taskId || "N/A"}
                      </div>
                      <div>
                        <strong>Project:</strong>{" "}
                        {selectedIssue?.project?.projectId?.basicInfo
                          .projectName || "N/A"}
                      </div>
                      <div>
                        <strong>Unit:</strong> {selectedIssue.unit || "N/A"}
                      </div>
                      <div>
                        <strong>Contractor:</strong>{" "}
                        {typeof selectedIssue.contractor === "object"
                          ? selectedIssue.contractor?.name
                          : selectedIssue.contractor}
                      </div>
                      <div>
                        <strong>Reported Date:</strong>{" "}
                        {new Date(
                          selectedIssue.reported_date
                        ).toLocaleDateString()}
                      </div>
                      <div>
                        <strong>Severity:</strong> {selectedIssue.severity}
                      </div>
                      <div>
                        <strong>Status:</strong> {selectedIssue.status}
                      </div>
                      <div>
                        <strong>Description:</strong>{" "}
                        {selectedIssue.description ||
                          "No description provided."}
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              <Dialog
                open={statusDialogOpen}
                onOpenChange={setStatusDialogOpen}
              >
                <DialogContent className="max-w-sm">
                  <div className="flex justify-between items-start">
                    <DialogHeader>
                      <DialogTitle>Update Status</DialogTitle>
                    </DialogHeader>
                  </div>

                  <div className="grid gap-4 mt-4">
                    <div className="flex gap-2 justify-between">
                      {["open", "under_review", "resolved"].map((status) => (
                        <Button
                          key={status}
                          variant={newStatus === status ? "default" : "outline"}
                          onClick={() => setNewStatus(status)}
                          className="flex-1 capitalize"
                        >
                          {status.replace("_", " ")}
                        </Button>
                      ))}
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                      <Button
                        variant="outline"
                        onClick={() => setStatusDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={async () => {
                          try {
                            await axios.patch(
                              `${
                                import.meta.env.VITE_URL
                              }/api/quality-issue/issues/${
                                selectedIssue._id
                              }/status`,
                              {
                                status: newStatus,
                              }
                            );

                            setStatusDialogOpen(false);
                            fetchQualityIssues();
                          } catch (err) {
                            console.error("Failed to update status", err);
                          }
                        }}
                      >
                        Save Status
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog
                open={evidenceDialogOpen}
                onOpenChange={setEvidenceDialogOpen}
              >
                <DialogContent className="md:w-[600px] w-[95vw] max-h-[85vh] overflow-y-auto rounded-2xl shadow-xl transition-all duration-300">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-blue-500" />
                      Evidence Photos
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                      These are the photos submitted as evidence for the
                      selected issue.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="mt-4">
                    {selectedIssue &&
                    selectedIssue.evidenceImages.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {selectedIssue.evidenceImages.map((src, idx) => (
                          <div
                            key={idx}
                            className="rounded-xl overflow-hidden shadow-md hover:scale-105 transition-transform duration-300 bg-white"
                          >
                            <img
                              src={src}
                              alt={`evidence-${idx}`}
                              className="w-full h-48 object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground gap-2">
                        <AlertCircle className="w-8 h-8 text-gray-400" />
                        <p className="text-lg font-medium">
                          No evidence uploaded
                        </p>
                        <p className="text-sm">
                          This issue has no images attached yet.
                        </p>
                      </div>
                    )}
                  </div>

                  <DialogFooter className="pt-6">
                    <Button
                      onClick={() => setEvidenceDialogOpen(false)}
                      variant="outline"
                    >
                      Close
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </Tabs>

        <Dialog open={assignDialog} onOpenChange={setAssignDiaog}>
          <DialogContent className="md:w-[600px] w-[95vw] max-h-[85vh] overflow-y-auto rounded-xl">
            <DialogHeader>
              <DialogTitle>Assign the task to Contractor</DialogTitle>
              <DialogDescription>
                To assign the task fill in all the details below.
              </DialogDescription>
            </DialogHeader>

            <form className="space-y-4 pt-4" onSubmit={handleAssignContractor}>
              <div className="space-y-2">
                <Label htmlFor="title">Task Title</Label>
                <p className="border p-2 rounded bg-gray-100 text-sm">
                  {selectedIssue?.title || "No title to this issue"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the task details"
                  rows={3}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label>Project</Label>
                <p className="border p-2 rounded bg-gray-100 text-sm">
                  {selectedIssue?.project?.projectId?.basicInfo?.projectName ||
                    "Untitled Project"}
                </p>
              </div>

              <div className="grid gap-2">
                <Label>Unit</Label>
                <p className="border p-2 rounded bg-gray-100 text-sm">
                  {selectedIssue?.unit || "N/A"}
                </p>
              </div>

              <div className="grid gap-2">
                <Label>Contractor</Label>
                <Select
                  onValueChange={(value) => setSelectedContractorId(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Contractor" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(contractors) &&
                      contractors.map((c) => (
                        <SelectItem key={c._id} value={c._id}>
                          {c.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phase">Construction Phase</Label>
                  <Select value={phase} onValueChange={setPhase} required>
                    <SelectTrigger id="phase">
                      <SelectValue placeholder="Select phase" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CONSTRUCTION_PHASES).map(
                        ([key, value]) => (
                          <SelectItem key={key} value={key}>
                            {value.title}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger id="priority">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Deadline</Label>
                <div className="border rounded-md p-2">
                  <DatePicker
                    date={deadline}
                    setDate={setDeadline}
                    showMonthYearDropdowns
                  />
                </div>
              </div>

              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAssignDiaog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Confirm Assignment</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default QualityControl;
