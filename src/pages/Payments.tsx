import MainLayout from "@/components/layout/MainLayout";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { downloadPaymentPdf } from "./generatePaymentPDF";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DatePicker from "react-datepicker";
import * as React from "react";
import { format } from "date-fns";
import { CalendarDays, Calendar as CalendarIcon, X } from "lucide-react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import "react-datepicker/dist/react-datepicker.css";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import axios from "axios";
import {
  Download,
  Filter,
  MoreHorizontal,
  Search,
  CreditCard,
  Eye,
  FileText,
  Receipt,
  Calendar,
  ArrowUpDown,
  Printer,
  Badge,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@radix-ui/react-dropdown-menu";
import { forwardRef } from "react";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Switch } from "@radix-ui/react-switch";

interface CustomInputProps {
  value?: string;
  onClick?: () => void;
}

const CustomDateInput = forwardRef<HTMLButtonElement, CustomInputProps>(
  ({ value, onClick }, ref) => (
    <button
      type="button"
      onClick={onClick}
      ref={ref}
      className="text-left w-full bg-transparent outline-none text-sm truncate"
    >
      {value || "Select date range"}
    </button>
  )
);

CustomDateInput.displayName = "CustomDateInput"; // important for forwardRef

// Sample payment data
// const payments = [
//   {
//     id: "PMT-2023-001",
//     reference: "INV-2023-001",
//     property: "Skyline Towers",
//     client: "John Cooper",
//     amount: 5200,
//     method: "Credit Card",
//     date: "2023-10-15",
//   },
//   {
//     id: "PMT-2023-002",
//     reference: "INV-2023-004",
//     property: "Riverside Apartments",
//     client: "Sarah Johnson",
//     amount: 4200,
//     method: "Bank Transfer",
//     date: "2023-10-05",
//   },
//   {
//     id: "PMT-2023-003",
//     reference: "INV-2023-006",
//     property: "Parkview Residences",
//     client: "David Thompson",
//     amount: 6800,
//     method: "Check",
//     date: "2023-09-28",
//   },
//   {
//     id: "PMT-2023-004",
//     reference: "INV-2023-007",
//     property: "Golden Heights Phase 1",
//     client: "Emily Davis",
//     amount: 3500,
//     method: "Credit Card",
//     date: "2023-10-20",
//   },
//   {
//     id: "PMT-2023-005",
//     reference: "INV-2023-009",
//     property: "Evergreen Villas",
//     client: "Robert Wilson",
//     amount: 7200,
//     method: "Bank Transfer",
//     date: "2023-10-12",
//   },
// ];

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [viewInvoiceDialogOpen, setViewInvoiceDialogOpen] = useState(false);
  const [showMethodDropdown, setShowMethodDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [error, setError] = useState("");
  const [showReconciliationDialog, setShowReconciliationDialog] =
    useState(false);
  const [reconciliationAmount, setReconciliationAmount] = useState("");
  const [isPaid, setIsPaid] = useState(false);

  const [open, setOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState("");

  const [dateFilters, setDateFilters] = useState({
    startDate: null as Date | null,
    endDate: null as Date | null,
  });

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateFilters({
      startDate: range?.from || null,
      endDate: range?.to || null,
    });
  };

  const handleMarkAsPaid = async (invoiceId: any, paymentMethod: any) => {
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_URL}/api/invoices/${invoiceId}/mark-paid`,
        { paymentMethod }, // no body, just params
        { withCredentials: true } // if you're using cookies/auth
      );

      toast(`Invoice has been marked as paid.`);
      // Optionally refresh list
      //fetchInvoices();
    } catch (error) {
      toast("Could not make payment status.");
    } finally {
      setPaymentMethod("");
      setSelectedInvoiceId("");
      setShowPaymentDialog(false);
    }
  };

  

  const currentRange: DateRange | undefined = dateFilters.startDate
    ? {
        from: dateFilters.startDate,
        to: dateFilters.endDate || undefined,
      }
    : undefined;

  const [filters, setFilters] = useState({
    paymentMethod: "",
    startDate: null,
    endDate: null,
  });

  const handleViewReceipt = (payment) => {
    setSelectedPayment(payment);
    setOpen(true);
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_URL}/api/invoices`,
        {
          withCredentials: true,
        }
      );
      setInvoices(response.data.filter((invoice) => invoice.status !== "paid"));
      setError("");
    } catch (err) {
      console.error("Failed to fetch invoices", err);
      setError("Failed to fetch invoices");
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_URL}/api/payments/accountant`,
        {
          withCredentials: true,
        }
      );
      setPayments(res.data);
    } catch (error) {
      console.error("Error fetching payments:", error);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);
  useEffect(() => {
    fetchInvoices();
  }, []);

  const filteredPayments = payments.filter((payment) => {
    const matchesMethod = filters.paymentMethod
      ? payment.invoice.paymentMethod === filters.paymentMethod
      : true;

    const paymentDate = new Date(payment.invoice.paymentDate);
    const matchesDateRange =
      filters.startDate && filters.endDate
        ? paymentDate >= filters.startDate && paymentDate <= filters.endDate
        : true;

    return matchesMethod && matchesDateRange;
  });

  const exportPaymentsToExcel = () => {
    const dataToExport = filteredPayments.map((payment) => ({
      "Payment ID": payment.paymentNumber,
      Reference: payment.invoice.invoiceNumber,
      Property:
        payment.invoice.project.projectId.basicInfo.projectName +
        " / " +
        payment.invoice.unit,
      Amount: payment.invoice.total,
      Method: payment.invoice.paymentMethod,
      Date: new Date(payment.invoice.paymentDate).toLocaleDateString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Payments");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const fileData = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(fileData, "Payments.xlsx");
  };

  const markInvoiceAsPaid = async (
    invoiceId: string,
    paymentMethod: string
  ) => {
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_URL}/api/payments`,
        {
          invoiceId,
          paymentMethod,
        },
        { withCredentials: true }
      );
      fetchPayments();
      return res.data;
    } catch (error: any) {
      console.error("❌ Error marking invoice as paid:", error);
      throw new Error(
        error.response?.data?.message || "Error marking invoice as paid"
      );
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Payment Management</h1>
            <p className="text-muted-foreground">
              Track and manage all payments for CSK - Real Manager
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={exportPaymentsToExcel}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button
              variant="default"
              onClick={() => {
                setShowPaymentDialog(true);
              }}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Record Payment
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Recent Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search payments..."
                  className="pl-8 w-full sm:w-[260px]"
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <DropdownMenu
                  open={showMethodDropdown}
                  onOpenChange={setShowMethodDropdown}
                >
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Filter className="mr-2 h-4 w-4" />
                      Filter
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent>
                    <DropdownMenuItem
                      onClick={() =>
                        setFilters({ ...filters, paymentMethod: "Cash" })
                      }
                    >
                      Cash
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        setFilters({ ...filters, paymentMethod: "Bank" })
                      }
                    >
                      Bank
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        setFilters({ ...filters, paymentMethod: "cheque" })
                      }
                    >
                      Cheque
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        setFilters({ ...filters, paymentMethod: "UPI" })
                      }
                    >
                      UPI
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        setFilters({ ...filters, paymentMethod: "" })
                      }
                    >
                      Clear
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="relative w-full sm:w-auto">
                  <div className="border rounded-md px-4 py-2 flex items-center gap-2 bg-white shadow-sm pr-10">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <DatePicker
                      selectsRange
                      startDate={filters.startDate}
                      endDate={filters.endDate}
                      onChange={(dates) => {
                        const [start, end] = dates;
                        setFilters({
                          ...filters,
                          startDate: start,
                          endDate: end,
                        });
                      }}
                      customInput={<CustomDateInput />}
                      calendarClassName="!z-50"
                    />
                  </div>

                  {(filters.startDate || filters.endDate) && (
                    <button
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                      onClick={() =>
                        setFilters({
                          ...filters,
                          startDate: null,
                          endDate: null,
                        })
                      }
                    >
                      &times;
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-md border">
              {/* Table view for desktop */}
              <div className="hidden md:block overflow-x-auto">
                <Table className="min-w-[800px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <div className="flex items-center">
                          Payment ID
                          <ArrowUpDown className="ml-1 h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Property</TableHead>
                      {/* <TableHead>Client</TableHead> */}
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map((payment) => (
                      <TableRow key={payment._id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Receipt className="h-4 w-4 text-muted-foreground" />
                            {payment.paymentNumber}
                          </div>
                        </TableCell>
                        <TableCell>{payment.invoice.invoiceNumber}</TableCell>
                        <TableCell>
                          {payment.invoice.project.projectId.basicInfo
                            .projectName +
                            " / " +
                            payment.invoice.unit}
                        </TableCell>
                        {/* <TableCell>{payment.client}</TableCell> */}
                        <TableCell>
                          ₹{payment.invoice.total.toLocaleString()}
                        </TableCell>
                        <TableCell className="space-x-1">
                          {Array.isArray(payment.invoice.paymentMethod) ? (
                            [...new Set(payment.invoice.paymentMethod)].map(
                              (method: string, index: number) => (
                                <span
                                  key={index}
                                  className="inline-block bg-muted px-2 py-1 text-xs rounded-md text-muted-foreground"
                                >
                                  {method.toUpperCase()}
                                </span>
                              )
                            )
                          ) : (
                            <span>{payment.invoice.paymentMethod}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(
                            payment.invoice.paymentDate
                          ).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => handleViewReceipt(payment)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedPayment(payment);
                                  setViewInvoiceDialogOpen(true);
                                }}
                              >
                                <FileText className="mr-2 h-4 w-4" />
                                View Invoice
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedPayment(payment);
                                  downloadPaymentPdf(payment);
                                }}
                              >
                                <Printer className="mr-2 h-4 w-4" />
                                Print Receipt
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedPayment(payment);
                                  setShowReconciliationDialog(true);
                                }}
                              >
                                <CreditCard className="mr-2 h-4 w-4" />
                                Reconcile
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Card view for mobile */}
              <div className="block md:hidden space-y-4 p-2">
                {filteredPayments.map((payment) => (
                  <div
                    key={payment._id}
                    className="rounded-lg border p-4 shadow-sm bg-white"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-medium">
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                        {payment.paymentNumber}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(
                          payment.invoice.paymentDate
                        ).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="mt-2 space-y-1 text-sm">
                      <div>
                        <span className="font-semibold">Reference: </span>
                        {payment.invoice.invoiceNumber}
                      </div>
                      <div>
                        <span className="font-semibold">Property: </span>
                        {payment.invoice.project.projectId.basicInfo
                          .projectName +
                          " / " +
                          payment.invoice.unit}
                      </div>
                      <div>
                        <span className="font-semibold">Amount: </span>₹
                        {payment.invoice.total.toLocaleString()}
                      </div>
                      <div>
                        <span className="font-semibold">Method: </span>
                        {Array.isArray(payment.invoice.paymentMethod) ? (
                          [...new Set(payment.invoice.paymentMethod)].map(
                            (method: string, index: number) => (
                              <span
                                key={index}
                                className="inline-block bg-muted px-2 py-1 text-xs rounded-md text-muted-foreground mr-1"
                              >
                                {method.toUpperCase()}
                              </span>
                            )
                          )
                        ) : (
                          <span>{payment.invoice.paymentMethod}</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-3 flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            Actions
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => handleViewReceipt(payment)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedPayment(payment);
                              setViewInvoiceDialogOpen(true);
                            }}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            View Invoice
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedPayment(payment);
                              downloadPaymentPdf(payment);
                            }}
                          >
                            <Printer className="mr-2 h-4 w-4" />
                            Print Receipt
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedPayment(payment);
                              setShowReconciliationDialog(true);
                            }}
                          >
                            <CreditCard className="mr-2 h-4 w-4" />
                            Reconcile
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogContent className="md:w-[600px] w-[90vw] max-h-[80vh] overflow-scroll rounded-xl shadow-xl border p-8 bg-white">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-semibold">
                    <Receipt className="h-6 w-6 text-green-600 mb-2" />
                    Payment Receipt
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Payment ID: {selectedPayment?.paymentNumber}
                  </DialogDescription>
                </DialogHeader>

                {selectedPayment && (
                  <div className="mt-4 space-y-4 text-sm text-gray-800">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-semibold">Invoice Number</p>
                        <p>{selectedPayment.invoice.invoiceNumber}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Project / Unit</p>
                        <p>
                          {
                            selectedPayment.invoice.project.projectId.basicInfo
                              .projectName
                          }{" "}
                          / {selectedPayment.invoice.unit}
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold">Paid By</p>
                        <p>
                          {selectedPayment.accountant?.name || "Accountant"}
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold">Payment Method</p>
                        <p>{selectedPayment.invoice.paymentMethod}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Amount</p>
                        <p>₹{selectedPayment.invoice.total.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Payment Date</p>
                        <p>
                          {new Date(
                            selectedPayment.invoice.paymentDate
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <hr className="my-4" />

                    <div className="text-xs text-muted-foreground">
                      Issued on:{" "}
                      {new Date(
                        selectedPayment.invoice.issueDate
                      ).toLocaleDateString()}{" "}
                      <br />
                      Due Date:{" "}
                      {new Date(
                        selectedPayment.invoice.dueDate
                      ).toLocaleDateString()}
                    </div>

                    {selectedPayment.invoice.notes && (
                      <div className="mt-2">
                        <p className="font-semibold">Notes</p>
                        <p>{selectedPayment.invoice.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* View Invoice Dialog */}
            {selectedPayment && (
              <Dialog
                open={viewInvoiceDialogOpen}
                onOpenChange={setViewInvoiceDialogOpen}
              >
                <DialogContent className="md:w-[600px] w-[90vw] max-h-[80vh] overflow-scroll rounded-xl">
                  <DialogHeader>
                    <DialogTitle>Invoice</DialogTitle>
                  </DialogHeader>

                  <div className="space-y-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-xl">INVOICE</h3>
                        <p className="text-muted-foreground">
                          {selectedPayment.invoice.invoiceNumber}
                        </p>
                      </div>
                      <Badge
                        className={`${
                          selectedPayment.invoice.status === "Paid"
                            ? "bg-green-100 text-green-800"
                            : selectedPayment.invoice.status === "Pending"
                            ? "bg-blue-100 text-blue-800"
                            : selectedPayment.invoice.status === "Overdue"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        } text-sm py-1 px-3`}
                      >
                        {selectedPayment.invoice.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      {/* <div>
                              <p className="text-sm text-muted-foreground">Invoice To:</p>
                              <p className="font-medium">{selectedInvoice.to}</p>
                            </div> */}

                      <div className="space-y-1">
                        <div className="grid grid-cols-2">
                          <p className="text-sm text-muted-foreground">
                            Issue Date:
                          </p>
                          <p>
                            {new Date(
                              selectedPayment.invoice.issueDate
                            ).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "2-digit",
                            })}
                          </p>
                        </div>
                        <div className="grid grid-cols-2">
                          <p className="text-sm text-muted-foreground">
                            Due Date:
                          </p>
                          <p>
                            {new Date(
                              selectedPayment.invoice.issueDate
                            ).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "2-digit",
                            })}
                          </p>
                        </div>
                        <div className="grid grid-cols-2">
                          <p className="text-sm text-muted-foreground">
                            Project:
                          </p>
                          <p>
                            {selectedPayment.invoice.project.projectId.basicInfo
                              .projectName || "-"}
                          </p>
                        </div>
                        {selectedPayment.invoice.paymentDate && (
                          <div className="grid grid-cols-2">
                            <p className="text-sm text-muted-foreground">
                              Payment Date:
                            </p>
                            <p>
                              {new Date(
                                selectedPayment.invoice.paymentDate
                              ).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "2-digit",
                              })}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="border rounded-md overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[50%]">
                              Description
                            </TableHead>
                            <TableHead>Qty</TableHead>
                            <TableHead>Rate (₹)</TableHead>
                            <TableHead>Amount (₹)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {/* Use sample items when viewing an invoice */}
                          {selectedPayment.invoice.items.map((item) => (
                            <TableRow key={item._id}>
                              <TableCell>{item.description}</TableCell>
                              <TableCell>
                                {item.quantity} {item.unit}
                              </TableCell>
                              <TableCell>
                                ₹{item.rate.toLocaleString()}
                              </TableCell>
                              <TableCell>
                                ₹{item.amount.toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="flex justify-end">
                      <div className="w-1/2 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Subtotal:
                          </span>
                          <span>
                            ₹{selectedPayment.invoice.subtotal.toLocaleString()}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            SGST ({selectedPayment.invoice.sgst}%):
                          </span>
                          <span>
                            ₹
                            {(
                              selectedPayment.invoice.subtotal *
                              (selectedPayment.invoice.sgst / 100)
                            ).toLocaleString()}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            CGST ({selectedPayment.invoice.cgst}%):
                          </span>
                          <span>
                            ₹
                            {(
                              selectedPayment.invoice.subtotal *
                              (selectedPayment.invoice.cgst / 100)
                            ).toLocaleString()}
                          </span>
                        </div>

                        <Separator className="my-2" />

                        <div className="flex justify-between font-bold">
                          <span>Total Amount:</span>
                          <span>
                            ₹{selectedPayment.invoice.total.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {selectedPayment.invoice.notes && (
                      <div>
                        <h4 className="text-sm font-medium">Notes:</h4>
                        <p className="text-muted-foreground">
                          {selectedPayment.invoice.notes}
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
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            <Dialog
              open={showPaymentDialog}
              onOpenChange={setShowPaymentDialog}
            >
              <DialogContent className="md:w-[600px] w-[90vw] max-h-[80vh] overflow-scroll rounded-xl">
                <DialogHeader>
                  <DialogTitle>Mark Invoice as Paid</DialogTitle>
                  <DialogDescription>
                    Select payment method before marking this invoice as paid.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <Label htmlFor="invoiceId">Invoice Number</Label>
                  <Select
                    value={selectedInvoiceId}
                    onValueChange={setSelectedInvoiceId}
                  >
                    <SelectTrigger id="invoiceId">
                      <SelectValue placeholder="Select Invoice Number" />
                    </SelectTrigger>
                    <SelectContent>
                      {invoices.map((invoice) => (
                        <SelectItem key={invoice._id} value={invoice._id}>
                          {invoice.invoiceNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                  >
                    <SelectTrigger id="paymentMethod">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="bank_transfer">
                        Bank Transfer
                      </SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPaymentDialog(false);
                      setSelectedInvoiceId("");
                      setPaymentMethod("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={async () => {
                      try {
                        const data = await markInvoiceAsPaid(
                          selectedInvoiceId,
                          paymentMethod
                        );
                        console.log("✅ Payment Success:", data);

                      
                        setSelectedInvoiceId("");
                        setPaymentMethod("");
                        setShowPaymentDialog(false);
                      } catch (err: any) {
                        alert(err.message);
                      }
                    }}
                    disabled={!paymentMethod || !selectedInvoiceId}
                  >
                    Mark as Paid
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog
              open={showReconciliationDialog}
              onOpenChange={setShowReconciliationDialog}
            >
              <DialogContent className="md:w-[600px] w-[90vw] max-h-[80vh] overflow-scroll rounded-xl">
                <DialogHeader>
                  <DialogTitle>Reconcile & Mark as Paid</DialogTitle>
                  <DialogDescription>
                    Enter reconciliation amount and mark this invoice as paid
                    (optional).
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Invoice Selector */}
                  <div>
                    <Label htmlFor="invoiceId">Invoice Number</Label>
                    <p>
                      {selectedPayment && selectedPayment.invoice.invoiceNumber}
                    </p>
                  </div>

                  {/* Select Item for Reconciliation */}
                  <div>
                    <Label htmlFor="reconcileItem">Reconcile Item</Label>
                    <Select
                      value={selectedItemId}
                      onValueChange={(value) => setSelectedItemId(value)}
                    >
                      <SelectTrigger id="reconcileItem">
                        <SelectValue placeholder="Select invoice item" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedPayment?.invoice.items.map((item, index) => (
                          <SelectItem
                            key={index}
                            value={item._id || index.toString()}
                          >
                            {item.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Reconciliation Amount */}
                  <div>
                    <Label htmlFor="amount">Reconciliation Amount</Label>
                    <Input
                      type="number"
                      id="amount"
                      placeholder="Enter reconciled amount"
                      value={reconciliationAmount}
                      disabled={!selectedItemId}
                      onChange={(e) => setReconciliationAmount(e.target.value)}
                    />
                  </div>

                  {/* Is Paid Toggle */}
                  <div className="space-y-1">
                    <Label className="block mb-1">Is Paid?</Label>
                    <div className="flex gap-2">
                      <Button
                        variant={isPaid === true ? "default" : "outline"}
                        onClick={() => setIsPaid(true)}
                      >
                        Yes
                      </Button>
                      <Button
                        variant={isPaid === false ? "default" : "outline"}
                        onClick={() => setIsPaid(false)}
                      >
                        No
                      </Button>
                    </div>
                  </div>

                  {/* Payment Method - only if isPaid */}
                  {isPaid && (
                    <div>
                      <Label htmlFor="paymentMethod">Payment Method</Label>
                      <Select
                        value={paymentMethod}
                        onValueChange={setPaymentMethod}
                      >
                        <SelectTrigger id="paymentMethod">
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="upi">UPI</SelectItem>
                          <SelectItem value="bank_transfer">
                            Bank Transfer
                          </SelectItem>
                          <SelectItem value="cheque">Cheque</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowReconciliationDialog(false);
                      setSelectedInvoiceId("");
                      setPaymentMethod("");
                      setIsPaid(false);
                      setReconciliationAmount("");
                      setSelectedItemId("");
                    }}
                  >
                    Cancel
                  </Button>

                  <Button
                    disabled={isPaid && !paymentMethod}
                    onClick={async () => {
                      try {
                        await axios.put(
                          `${import.meta.env.VITE_URL}/api/invoices/${
                            selectedPayment.invoice._id
                          }/mark-paid?reconcile=true`,
                          {
                            paymentMethod: isPaid ? paymentMethod : null,
                            reconciliationAmount:
                              parseFloat(reconciliationAmount),
                            isPaid,
                            reconciledItemId: selectedItemId,
                          },
                          { withCredentials: true }
                        );

                        toast.success("Invoice updated successfully");
                        fetchPayments();
                      } catch (error) {
                        toast.error("Error updating invoice");
                      } finally {
                        setShowReconciliationDialog(false);
                        setSelectedInvoiceId("");
                        setPaymentMethod("");
                        setIsPaid(false);
                        setSelectedItemId("");
                        setReconciliationAmount("");
                      }
                    }}
                  >
                    {isPaid ? "Mark as paid" : "update amount"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Payments;
