import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import {
  Search,
  Plus,
  BadgeIndianRupee,
  FileText,
  ArrowDown,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Define interface for invoice type
interface Invoice {
  id: string;
  to: string;
  project: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  sgst: number;
  cgst: number;
  totalAmount: number;
  status: string;
  paymentDate: string | null;
  notes?: string;
  task?: string;
  unit: string;
}

// Define interface for invoice item type
interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
  taxRate: number;
}

// Form schema
export const invoiceSchema = z.object({
  project: z.string().min(2, "Project is required"),
  issueDate: z.string().min(1, "Issue date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  sgst: z.coerce
    .number()
    .min(0, "SGST rate must be positive")
    .max(14, "SGST rate cannot exceed 14%"),
  cgst: z.coerce
    .number()
    .min(0, "CGST rate must be positive")
    .max(14, "CGST rate cannot exceed 14%"),
  notes: z.string().optional(),
  task: z.string().optional(),
  unit: z.string(),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

// Invoice item schema
const invoiceItemSchema = z.object({
  description: z.string().min(2, "Description is required"),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  unit: z.string().min(1, "Unit is required"),
  rate: z.coerce.number().positive("Rate must be positive"),
  taxRate: z.coerce
    .number()
    .min(0, "Tax rate must be positive")
    .max(28, "Tax rate cannot exceed 28%"),
  task: z.string().optional(),
});

type InvoiceItemFormValues = z.infer<typeof invoiceItemSchema>;

const ContractorInvoices = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewInvoiceDialogOpen, setViewInvoiceDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [showAddItem, setShowAddItem] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [relatedToTask, setRelatedToTask] = useState(false);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_URL}/api/invoices`,
        {
          withCredentials: true,
        }
      );
      setInvoices(response.data);
      setError("");
    } catch (err) {
      console.error("Failed to fetch invoices", err);
      setError("Failed to fetch invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      project: "",
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      sgst: 9,
      cgst: 9,
    },
  });

  const watchProject = form.watch("project"); // watches selected projectId

  const itemForm = useForm<InvoiceItemFormValues>({
    resolver: zodResolver(invoiceItemSchema),
    defaultValues: {
      description: "",
      quantity: 1,
      unit: "",
      rate: 0,
      taxRate: 0,
    },
    mode: "onChange",
  });

  const handleSubmit = async (data: InvoiceFormValues) => {
    try {
      console.log("Submitting..........");
      if (invoiceItems.length === 0) {
        toast.error("Please add at least one item to the invoice");
        return;
      }

      // Calculate subtotal
      const subtotal = invoiceItems.reduce(
        (sum, item) => sum + item.quantity * item.rate,
        0
      );

      const sgstAmount = (data.sgst / 100) * subtotal;
      const cgstAmount = (data.cgst / 100) * subtotal;
      const totalAmount = subtotal + sgstAmount + cgstAmount;

      // Prepare payload for backend
      const payload = {
        project: data.project,
        task: relatedToTask ? data.task : null,
        issueDate: data.issueDate,
        dueDate: data.dueDate,
        items: invoiceItems,
        sgst: data.sgst,
        cgst: data.cgst,
        notes: data.notes || "",
        subtotal,
        total: totalAmount,
        unit: data.unit,
      };

      // API call using axios
      const response = await axios.post(
        `${import.meta.env.VITE_URL}/api/invoices`,
        payload,
        { withCredentials: true }
      );

      const createdInvoice = response.data;

      toast.success(
        `Invoice ${createdInvoice.invoiceNumber || "created"} successfully`
      );

      fetchInvoices();
      // Reset form
      form.reset({
        project: "",
        issueDate: new Date().toISOString().split("T")[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        sgst: 9,
        cgst: 9,
      });

      setInvoiceItems([]);
      setCreateDialogOpen(false);
    } catch (error: any) {
      console.error("Invoice creation error:", error);
      toast.error(
        error?.response?.data?.error || "Failed to create invoice. Try again."
      );
    }
  };

  const addInvoiceItem = (
    data: InvoiceItemFormValues,
    event?: React.FormEvent
  ) => {
    event?.preventDefault();
    const amount = data.quantity * data.rate;

    const newItem: InvoiceItem = {
      id: (invoiceItems.length + 1).toString(),
      description: data.description,
      quantity: data.quantity,
      unit: data.unit,
      rate: data.rate,
      amount: amount,
      taxRate: data.taxRate,
    };

    setInvoiceItems((prev) => [...prev, newItem]);
    itemForm.reset({
      description: "",
      quantity: 1,
      unit: "Job",
      rate: 0,
      taxRate: 18,
    });
    setShowAddItem(false);
    toast.success("Item added to invoice");
  };

  const removeInvoiceItem = (id: string) => {
    setInvoiceItems(invoiceItems.filter((item) => item.id !== id));
  };

  const viewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setViewInvoiceDialogOpen(true);
  };

  // Filter invoices based on search and active tab
  let filteredInvoices = [];
  if (Array.isArray(filteredInvoices)) {
    filteredInvoices = invoices.filter((invoice) => {
      const matchesSearch =
        invoice._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.project.toLowerCase().includes(searchQuery.toLowerCase());

      if (activeTab === "all") return matchesSearch;
      if (activeTab === "paid")
        return matchesSearch && invoice.status === "paid";
      if (activeTab === "pending")
        return matchesSearch && invoice.status === "pending";
      if (activeTab === "overdue")
        return matchesSearch && invoice.status === "overdue";
      if (activeTab === "draft")
        return matchesSearch && invoice.status === "draft";

      return matchesSearch;
    });
  }

  // Calculate statistics
  const totalInvoiceAmount = invoices.reduce(
    (total, invoice) => total + invoice.total,
    0
  );
  const paidInvoicesAmount = invoices
    .filter((invoice) => invoice.status === "paid")
    .reduce((total, invoice) => total + invoice.totalAmount, 0);
  const pendingInvoicesAmount = invoices
    .filter(
      (invoice) => invoice.status === "pending" || invoice.status === "overdue"
    )
    .reduce((total, invoice) => total + invoice.total, 0);

  const fetchDropdownData = async () => {
    try {
      const projectsRes = await axios.get(
        `${import.meta.env.VITE_URL}/api/project/projects`,
        { withCredentials: true }
      );

      setProjects(projectsRes.data);
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
    }
  };
  useEffect(() => {
    fetchDropdownData();
  }, []);

  useEffect(() => {
    const fetchCompletedTasks = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_URL}/api/invoices/completed/tasks`,
          { withCredentials: true }
        );
        setCompletedTasks(res.data.tasks);
      } catch (err) {
        console.error("Error fetching completed tasks:", err);
      }
    };

    fetchCompletedTasks();
  }, []);

  useEffect(() => {
    const found = projects.find((proj) => proj._id === watchProject);
    setSelectedProject(found || null);
  }, [watchProject, projects]);

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <FileText className="h-4 w-4 text-muted-foreground mr-2" />
              <div className="text-2xl font-bold">{invoices.length}</div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {invoices.filter((i) => i.status === "Paid").length} paid,{" "}
              {invoices.filter((i) => i.status !== "Paid").length} unpaid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <BadgeIndianRupee className="h-4 w-4 text-muted-foreground mr-2" />
              <div className="text-2xl font-bold">
                ₹{totalInvoiceAmount.toLocaleString()}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {invoices.length} invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Outstanding Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <BadgeIndianRupee className="h-4 w-4 text-muted-foreground mr-2" />
              <div className="text-2xl font-bold">
                ₹{pendingInvoicesAmount.toLocaleString()}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round((pendingInvoicesAmount / totalInvoiceAmount) * 100) ||
                0}
              % of total amount
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search invoices by number, project..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Create Invoice
        </Button>
      </div>

      {/* Tabs for filtering */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="draft" className="flex items-center">
            <Clock className="mr-2 h-4 w-4" /> Draft
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center">
            <ArrowDown className="mr-2 h-4 w-4" /> Pending
          </TabsTrigger>
          <TabsTrigger value="paid" className="flex items-center">
            <CheckCircle className="mr-2 h-4 w-4" /> Paid
          </TabsTrigger>
          <TabsTrigger value="overdue" className="flex items-center">
            <AlertCircle className="mr-2 h-4 w-4" /> Overdue
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Invoices Table */}
      <div className="border rounded-md">
        {/* Table for desktop */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice No.</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Amount (₹)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No invoices found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.invoiceNumber}
                    </TableCell>
                    <TableCell>
                      {invoice.project.projectId.basicInfo.projectName +
                        " / " +
                        (invoice.unit || "-")}
                    </TableCell>
                    <TableCell>
                      {new Date(invoice.issueDate).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "2-digit",
                      })}
                    </TableCell>
                    <TableCell>
                      {new Date(invoice.dueDate).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "2-digit",
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <BadgeIndianRupee className="h-3.5 w-3.5 mr-1" />
                        {invoice.total.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${
                          invoice.status === "Paid"
                            ? "bg-green-100 text-green-800"
                            : invoice.status === "Pending"
                            ? "bg-blue-100 text-blue-800"
                            : invoice.status === "Overdue"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewInvoice(invoice)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Card layout for mobile */}
        <div className="md:hidden space-y-4 p-2">
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-4 text-sm text-gray-500">
              No invoices found.
            </div>
          ) : (
            filteredInvoices.map((invoice) => (
              <div
                key={invoice.id}
                className="border rounded-lg p-4 shadow-sm space-y-2 bg-white"
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">#{invoice.invoiceNumber}</h3>
                  <Badge
                    className={`${
                      invoice.status === "Paid"
                        ? "bg-green-100 text-green-800"
                        : invoice.status === "Pending"
                        ? "bg-blue-100 text-blue-800"
                        : invoice.status === "Overdue"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {invoice.status}
                  </Badge>
                </div>

                <p className="text-sm text-gray-600">
                  <span className="font-medium">Project:</span>{" "}
                  {invoice.project.projectId.basicInfo.projectName +
                    " / " +
                    (invoice.unit || "-")}
                </p>

                <p className="text-sm text-gray-600">
                  <span className="font-medium">Date:</span>{" "}
                  {new Date(invoice.issueDate).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "2-digit",
                  })}
                </p>

                <p className="text-sm text-gray-600">
                  <span className="font-medium">Due Date:</span>{" "}
                  {new Date(invoice.dueDate).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "2-digit",
                  })}
                </p>

                <p className="text-sm text-gray-600 flex items-center">
                  <span className="font-medium mr-1">Amount:</span>
                  <BadgeIndianRupee className="h-3.5 w-3.5 mr-1" />
                  {invoice.total.toLocaleString()}
                </p>

                <div className="pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => viewInvoice(invoice)}
                  >
                    View
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Invoice Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="md:w-[600px] w-[90vw] max-h-[80vh] overflow-scroll rounded-xl">
          <DialogHeader>
            <DialogTitle>Create New Invoice</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="project"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select project" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {projects.map((project) => (
                            <SelectItem key={project._id} value={project._id}>
                              {project.projectTitle || "-"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value ?? ""}
                        disabled={!selectedProject}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(selectedProject?.unitNames || []).map(
                            (unitName) => (
                              <SelectItem key={unitName} value={unitName}>
                                {unitName}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="issueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issue Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sgst"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SGST (%)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select SGST rate" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">0%</SelectItem>
                          <SelectItem value="2.5">2.5%</SelectItem>
                          <SelectItem value="6">6%</SelectItem>
                          <SelectItem value="9">9%</SelectItem>
                          <SelectItem value="14">14%</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cgst"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CGST (%)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select CGST rate" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">0%</SelectItem>
                          <SelectItem value="2.5">2.5%</SelectItem>
                          <SelectItem value="6">6%</SelectItem>
                          <SelectItem value="9">9%</SelectItem>
                          <SelectItem value="14">14%</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Related to a Task */}
              <div className="col-span-1 md:col-span-2">
                <FormItem>
                  <FormLabel>Related to a Task?</FormLabel>
                  <div className="flex space-x-4 mt-1">
                    <Button
                      type="button"
                      variant={relatedToTask ? "default" : "outline"}
                      onClick={() => setRelatedToTask(true)}
                    >
                      Yes
                    </Button>
                    <Button
                      type="button"
                      variant={!relatedToTask ? "default" : "outline"}
                      onClick={() => setRelatedToTask(false)}
                    >
                      No
                    </Button>
                  </div>
                </FormItem>
              </div>

              {relatedToTask && (
                <FormField
                  control={form.control}
                  name="task"
                  render={({ field }) => (
                    <FormItem className="col-span-1 md:col-span-2">
                      <FormLabel>Select Task</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value ?? ""}
                        defaultValue={field.value ?? ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a completed task" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {completedTasks.length === 0 ? (
                            <SelectItem value="__none__" disabled>
                              No completed tasks
                            </SelectItem>
                          ) : (
                            completedTasks.map((task) => (
                              <SelectItem key={task.taskId} value={task.taskId}>
                                {`${task.title} - ${task.projectName} / ${task.unit}`}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Invoice Items */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Invoice Items</h3>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddItem(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add Item
                  </Button>
                </div>

                {invoiceItems.length === 0 ? (
                  <div className="border rounded-md p-4 text-center text-muted-foreground">
                    No items added to this invoice. Click "Add Item" to get
                    started.
                  </div>
                ) : (
                  <div className="border rounded-md overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Unit</TableHead>
                          <TableHead>Rate (₹)</TableHead>
                          <TableHead>Tax %</TableHead>
                          <TableHead>Amount (₹)</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoiceItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.description}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>{item.unit}</TableCell>
                            <TableCell>₹{item.rate.toLocaleString()}</TableCell>
                            <TableCell>{item.taxRate}%</TableCell>
                            <TableCell>
                              ₹{item.amount.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeInvoiceItem(item.id)}
                              >
                                Remove
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Add Item Form */}
                {showAddItem && (
                  <Form {...itemForm}>
                    <div className="border rounded-md p-4 mt-4">
                      <h4 className="text-sm font-medium mb-4">Add New Item</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={itemForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Item description"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={itemForm.control}
                            name="quantity"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Quantity</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="1"
                                    step="1"
                                    {...field}
                                    onChange={(e) => {
                                      const numericValue = parseInt(
                                        e.target.value,
                                        10
                                      );
                                      itemForm.setValue(
                                        "quantity",
                                        isNaN(numericValue) ? 0 : numericValue
                                      );
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={itemForm.control}
                            name="unit"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Unit</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Unit" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="Job">Job</SelectItem>
                                    <SelectItem value="Hours">Hours</SelectItem>
                                    <SelectItem value="Days">Days</SelectItem>
                                    <SelectItem value="Sq.ft">Sq.ft</SelectItem>
                                    <SelectItem value="Units">Units</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={itemForm.control}
                          name="rate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Rate (₹)</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <BadgeIndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    className="pl-10"
                                    type="number"
                                    min="0"
                                    {...field}
                                    onChange={(e) =>
                                      field.onChange(Number(e.target.value))
                                    }
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={itemForm.control}
                          name="taxRate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tax Rate (%)</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value.toString()}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select tax rate" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="0">0%</SelectItem>
                                  <SelectItem value="5">5%</SelectItem>
                                  <SelectItem value="12">12%</SelectItem>
                                  <SelectItem value="18">18%</SelectItem>
                                  <SelectItem value="28">28%</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex justify-end space-x-2 mt-5">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowAddItem(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          onClick={async () => {
                            const isValid = await itemForm.trigger();
                            console.log("Form Valid?", isValid);
                            console.log("Form Values", itemForm.getValues());
                            console.log(
                              "Quantity typeof:",
                              typeof itemForm.getValues("quantity")
                            );

                            if (isValid) {
                              addInvoiceItem(itemForm.getValues());
                              itemForm.reset();
                              setShowAddItem(false);
                            }
                          }}
                        >
                          Add Item
                        </Button>
                      </div>
                    </div>
                  </Form>
                )}
              </div>

              {/* Invoice Summary */}
              {(() => {
                const subtotal = invoiceItems.reduce(
                  (sum, item) => sum + item.amount,
                  0
                );
                const sgst = parseFloat(form.watch("sgst")?.toString() || "0");
                const cgst = parseFloat(form.watch("cgst")?.toString() || "0");
                const sgstAmount = subtotal * (sgst / 100);
                const cgstAmount = subtotal * (cgst / 100);
                const total = subtotal + sgstAmount + cgstAmount;

                return (
                  <div className="border rounded-md p-4">
                    <div className="flex justify-between mb-2">
                      <span>Subtotal:</span>
                      <span>₹{subtotal.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between mb-2">
                      <span>SGST ({sgst}%):</span>
                      <span>₹{sgstAmount.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between mb-2">
                      <span>CGST ({cgst}%):</span>
                      <span>₹{cgstAmount.toLocaleString()}</span>
                    </div>

                    <Separator className="my-2" />

                    <div className="flex justify-between font-bold">
                      <span>Total:</span>
                      <span>₹{total.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })()}

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional notes for the invoice"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setRelatedToTask(false);
                    setCreateDialogOpen(false);
                    setInvoiceItems([]);
                    setShowAddItem(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  onClick={() => {
                    console.log("Errors", form.formState.errors);
                    console.log("Values", form.getValues());
                  }}
                >
                  Create Invoice
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View Invoice Dialog */}
      {selectedInvoice && (
        <Dialog
          open={viewInvoiceDialogOpen}
          onOpenChange={setViewInvoiceDialogOpen}
        >
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>Invoice {selectedInvoice.id}</DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-xl">INVOICE</h3>
                  <p className="text-muted-foreground">
                    {selectedInvoice.invoiceNumber}
                  </p>
                </div>
                <Badge
                  className={`${
                    selectedInvoice.status === "Paid"
                      ? "bg-green-100 text-green-800"
                      : selectedInvoice.status === "Pending"
                      ? "bg-blue-100 text-blue-800"
                      : selectedInvoice.status === "Overdue"
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-800"
                  } text-sm py-1 px-3`}
                >
                  {selectedInvoice.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* <div>
                  <p className="text-sm text-muted-foreground">Invoice To:</p>
                  <p className="font-medium">{selectedInvoice.to}</p>
                </div> */}

                <div className="space-y-1">
                  <div className="grid grid-cols-2">
                    <p className="text-sm text-muted-foreground">Issue Date:</p>
                    <p>
                      {new Date(selectedInvoice.issueDate).toLocaleDateString(
                        "en-GB",
                        {
                          day: "2-digit",
                          month: "2-digit",
                          year: "2-digit",
                        }
                      )}
                    </p>
                  </div>
                  <div className="grid grid-cols-2">
                    <p className="text-sm text-muted-foreground">Due Date:</p>
                    <p>
                      {new Date(selectedInvoice.issueDate).toLocaleDateString(
                        "en-GB",
                        {
                          day: "2-digit",
                          month: "2-digit",
                          year: "2-digit",
                        }
                      )}
                    </p>
                  </div>
                  <div className="grid grid-cols-2">
                    <p className="text-sm text-muted-foreground">Project:</p>
                    <p>
                      {selectedInvoice.project.projectId.basicInfo
                        .projectName || "-"}
                    </p>
                  </div>
                  {selectedInvoice.paymentDate && (
                    <div className="grid grid-cols-2">
                      <p className="text-sm text-muted-foreground">
                        Payment Date:
                      </p>
                      <p>{selectedInvoice.paymentDate}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="border rounded-md overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50%]">Description</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Rate (₹)</TableHead>
                      <TableHead>Amount (₹)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Use sample items when viewing an invoice */}
                    {selectedInvoice.items.map((item) => (
                      <TableRow key={item._id}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>
                          {item.quantity} {item.unit}
                        </TableCell>
                        <TableCell>₹{item.rate.toLocaleString()}</TableCell>
                        <TableCell>₹{item.amount.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end">
                <div className="w-1/2 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span>₹{selectedInvoice.subtotal.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      SGST ({selectedInvoice.sgst}%):
                    </span>
                    <span>
                      ₹
                      {(
                        selectedInvoice.subtotal *
                        (selectedInvoice.sgst / 100)
                      ).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      CGST ({selectedInvoice.cgst}%):
                    </span>
                    <span>
                      ₹
                      {(
                        selectedInvoice.subtotal *
                        (selectedInvoice.cgst / 100)
                      ).toLocaleString()}
                    </span>
                  </div>

                  <Separator className="my-2" />

                  <div className="flex justify-between font-bold">
                    <span>Total Amount:</span>
                    <span>₹{selectedInvoice.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {selectedInvoice.notes && (
                <div>
                  <h4 className="text-sm font-medium">Notes:</h4>
                  <p className="text-muted-foreground">
                    {selectedInvoice.notes}
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setViewInvoiceDialogOpen(false)}
                >
                  Close
                </Button>
                {/* {selectedInvoice.status !== "Paid" && (
                  <Button
                    onClick={() => {
                      // Mark invoice as paid
                      const updatedInvoices = invoices.map((invoice) =>
                        invoice.id === selectedInvoice.id
                          ? {
                              ...invoice,
                              status: "Paid",
                              paymentDate: new Date()
                                .toISOString()
                                .split("T")[0],
                            }
                          : invoice
                      );
                      setInvoices(updatedInvoices);
                      setSelectedInvoice({
                        ...selectedInvoice,
                        status: "Paid",
                        paymentDate: new Date().toISOString().split("T")[0],
                      });
                      toast.success("Invoice marked as paid");
                    }}
                  >
                    Mark as Paid
                  </Button>
                )} */}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ContractorInvoices;
