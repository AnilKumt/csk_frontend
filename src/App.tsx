import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Unauthorized from "./pages/Unauthorized";
import MessagingPage from "./pages/MessagingPage";
import Properties from "./pages/Properties";
import PropertyDetails from "./pages/Properties/PropertyDetails";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./contexts/AuthContext";
import Invoices from "./pages/Invoices";
import Payments from "./pages/Payments";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

// Owner specific pages
import BusinessAnalytics from "./pages/BusinessAnalytics";
import UserManagement from "./pages/UserManagement";
import SalesOverview from "./pages/SalesOverview";
import OperationsWorkflow from "./pages/OperationsWorkflow";
import Finances from "./pages/Finances";
import ExpenseManagementPage from "./pages/expenseManagement";

// Sales Manager specific pages
import TeamManagement from "./pages/TeamManagement";

// Team Lead specific pages
import CarAllocation from "./pages/CarAllocation";
import Approvals from "./pages/Approvals";

// Agent specific pages
import LeadManagement from "./pages/agent/LeadManagement";
import MySchedule from "./pages/agent/MySchedule";
import SiteVisits from "./pages/agent/SiteVisits";
import AgentDocuments from "./pages/agent/AgentDocuments";
import MyCommissions from "./pages/agent/MyCommissions";

// Contractor specific pages
import ContractorProjects from "./pages/contractor/ContractorProjects";
import ContractorTasks from "./pages/contractor/ContractorTasks";
import ContractorTimeline from "./pages/contractor/ContractorTimeline";
import ContractorMaterials from "./pages/contractor/ContractorMaterials";
import ContractorLabor from "./pages/contractor/ContractorLabor";
import ContractorInvoices from "./pages/contractor/ContractorInvoices";
import ContractorPhotoEvidence from "./pages/contractor/ContractorPhotoEvidence";

// Accountant specific pages
import InvoiceAccountant from "./pages/InvoiceAccountant";

// Site Incharge specific pages
import TaskVerifications from "./pages/siteincharge/TaskVerifications";
import QualityControl from "./pages/siteincharge/QualityControl";
import SiteInspections from "./pages/siteincharge/SiteInspections";
import ContractorsList from "./pages/siteincharge/ContractorsList";
import ConstructionProgress from "./pages/siteincharge/ConstructionProgress";
import SiteInchargeProjects from "./pages/siteincharge/SiteInchargeProjects";

// Public pages
import HomePage from "./pages/public/HomePage";
import PublicAboutPage from "./pages/public/AboutPage";
import PublicPropertiesPage from "./pages/public/PropertiesPage";
import CompletedProjectsPage from "./pages/public/CompletedProjectsPage";
import OngoingProjectsPage from "./pages/public/OngoingProjectsPage";
import UpcomingProjectsPage from "./pages/public/UpcomingProjectsPage";
import OpenPlotsPage from "./pages/public/OpenPlotsPage";
import ContactPage from "./pages/public/ContactPage";
import ContentManagement from "./pages/ContentManagement";
import RoleManagement from "./pages/RoleManagement";
import Profile from "./pages/Profile";
import BudgetTracking from "./pages/BudgetTracking";
import TaxDocuments from "./pages/TaxDocuments";
import ProjectDetailsPage from "./pages/public/ProjectDetailsPage";
import OpenPlotsDetails from "./pages/public/OpenPlotsDetails";
import Enquiry from "./pages/Enquiry";
import ProtectedRoute from "./config/ProtectedRoute";
import TeamLeadManagement from "./pages/TeamLeadManagement";
import MainLayout from "./components/layout/MainLayout";

const queryClient = new QueryClient();

const ALL_ROLES = [
  "admin",
  "owner",
  "agent",
  "sales_manager",
  "site_incharge",
  "contractor",
  "accountant",
  "team_lead",
  "customer_purchased",
];

const PROPERTIES = ["admin", "owner", "agent", "sales_manager", "team_lead"];
const OWNER_ADMIN = ["admin", "owner"];
const ADMIN_SALES = ["admin", "sales_manager"];
const ADMIN = ["admin"];
const OWNER = ["owner"];
const AGENT = ["agent"];
const LEAD = ["team_lead"];
const SALES = ["sales_manager"];
const SITE = ["site_incharge"];
const CONTRACTOR = ["contractor"];
const ACCOUNTANT = ["accountant"];
const CUSTOMER_PUR = ["customer_purchased"];

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/public" element={<HomePage />} />
            <Route path="/public/about" element={<PublicAboutPage />} />
            <Route
              path="/public/properties"
              element={<PublicPropertiesPage />}
            />
            <Route
              path="/public/completed-projects"
              element={<CompletedProjectsPage />}
            />
            <Route
              path="/public/ongoing-projects"
              element={<OngoingProjectsPage />}
            />
            <Route
              path="/public/upcoming-projects"
              element={<UpcomingProjectsPage />}
            />
            <Route path="/public/open-plots" element={<OpenPlotsPage />} />
            <Route path="/public/contact" element={<ContactPage />} />

            {/* Admin Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route element={<MainLayout />}>
              <Route path="/" element={<Dashboard />} />
            </Route>

            <Route
              path="/public/project/:id"
              element={<ProjectDetailsPage />}
            />
            <Route path="/public/openPlot/:id" element={<OpenPlotsDetails />} />

            {/* Public User Route - Redirects to public homepage */}
            <Route
              path="/public-user"
              element={<Navigate to="/public" replace />}
            />

            {/* Property Routes */}
            <Route element={<MainLayout />}>
              <Route path="/messaging" element={<MessagingPage />} />
              <Route
                path="/enquiry"
                element={
                  <ProtectedRoute allowedRoles={ADMIN_SALES}>
                    <Enquiry />
                  </ProtectedRoute>
                }
              />
              <Route path="/properties" element={<Properties />} />
              <Route
                path="/properties/:propertyId"
                element={<PropertyDetails />}
              />

              {/* CMS Route */}
              <Route
                path="/content"
                element={
                  <ProtectedRoute allowedRoles={ADMIN}>
                    <ContentManagement />
                  </ProtectedRoute>
                }
              />

              {/* Owner & Admin Routes */}

              <Route
                path="/analytics"
                element={
                  <ProtectedRoute allowedRoles={OWNER}>
                    <BusinessAnalytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute allowedRoles={OWNER_ADMIN}>
                    <UserManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/roles"
                element={
                  <ProtectedRoute allowedRoles={OWNER_ADMIN}>
                    <RoleManagement />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/sales"
                element={
                  <ProtectedRoute allowedRoles={OWNER}>
                    <SalesOverview />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/operations"
                element={
                  <ProtectedRoute allowedRoles={OWNER}>
                    <OperationsWorkflow />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finances"
                element={
                  <ProtectedRoute allowedRoles={OWNER}>
                    <Finances />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute allowedRoles={ALL_ROLES}>
                    <Settings />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/profile"
                element={
                  <ProtectedRoute allowedRoles={ALL_ROLES}>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/expenditure"
                element={
                  <ProtectedRoute allowedRoles={ALL_ROLES}>
                    <ExpenseManagementPage />
                  </ProtectedRoute>
                }
              />

              {/* site incharge project */}
              <Route
                path="/site-incharge/projects"
                element={
                  <ProtectedRoute allowedRoles={[...SITE]}>
                    <SiteInchargeProjects />
                  </ProtectedRoute>
                }
              />
              {/* Sales Manager Routes */}
              <Route
                path="/team"
                element={
                  <ProtectedRoute allowedRoles={[...SALES, ...LEAD]}>
                    <TeamManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teamLead"
                element={
                  <ProtectedRoute allowedRoles={SALES}>
                    <TeamLeadManagement />
                  </ProtectedRoute>
                }
              />

              {/* Team Lead Routes */}
              <Route
                path="/vehicles"
                element={
                  <ProtectedRoute allowedRoles={LEAD}>
                    <CarAllocation />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/approvals"
                element={
                  <ProtectedRoute allowedRoles={LEAD}>
                    <Approvals />
                  </ProtectedRoute>
                }
              />

              {/* Agent Routes */}
              <Route
                path="/leads"
                element={
                  <ProtectedRoute allowedRoles={[...AGENT, ...SALES]}>
                    {<LeadManagement />}
                  </ProtectedRoute>
                }
              />
              <Route
                path="/schedule"
                element={
                  <ProtectedRoute allowedRoles={[...AGENT, ...SITE]}>
                    <MySchedule />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/visits"
                element={
                  <ProtectedRoute allowedRoles={[...LEAD, ...AGENT]}>
                    <SiteVisits />
                  </ProtectedRoute>
                }
              />
              <Route path="/documents" element={<AgentDocuments />} />
              <Route
                path="/commissions"
                element={
                  <ProtectedRoute allowedRoles={[...SALES, ...AGENT]}>
                    <MyCommissions />
                  </ProtectedRoute>
                }
              />

              {/* Contractor Routes */}
              <Route
                path="/projects"
                element={
                  <ProtectedRoute allowedRoles={[...SITE, ...CONTRACTOR]}>
                    <ContractorProjects />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tasks"
                element={
                  <ProtectedRoute allowedRoles={CONTRACTOR}>
                    <ContractorTasks />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/timeline"
                element={
                  <ProtectedRoute allowedRoles={CONTRACTOR}>
                    <ContractorTimeline />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/materials"
                element={
                  <ProtectedRoute allowedRoles={CONTRACTOR}>
                    <ContractorMaterials />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/labor"
                element={
                  <ProtectedRoute allowedRoles={CONTRACTOR}>
                    <ContractorLabor />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/invoices"
                element={
                  <ProtectedRoute allowedRoles={[...CONTRACTOR, ...ACCOUNTANT]}>
                    <ContractorInvoices />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/evidence"
                element={
                  <ProtectedRoute allowedRoles={CONTRACTOR}>
                    <ContractorPhotoEvidence />
                  </ProtectedRoute>
                }
              />

              {/* Site Incharge Routes */}
              <Route
                path="/verifications"
                element={
                  <ProtectedRoute allowedRoles={SITE}>
                    <TaskVerifications />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/quality"
                element={
                  <ProtectedRoute allowedRoles={SITE}>
                    <QualityControl />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/inspections"
                element={
                  <ProtectedRoute allowedRoles={SITE}>
                    <SiteInspections />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/contractors"
                element={
                  <ProtectedRoute allowedRoles={SITE}>
                    <ContractorsList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/progress"
                element={
                  <ProtectedRoute allowedRoles={[...SITE, ...CUSTOMER_PUR]}>
                    <ConstructionProgress />
                  </ProtectedRoute>
                }
              />

              {/* Accountant Routes */}
              <Route path="/payments" element={<Payments />} />
              <Route
                path="/invoices/accountant"
                element={<InvoiceAccountant />}
              />
              <Route path="/reports" element={<Reports />} />
              <Route path="/budgets" element={<BudgetTracking />} />
              <Route path="/taxes" element={<TaxDocuments />} />
            </Route>
            {/* Redirect index to dashboard */}
            <Route path="/index" element={<Navigate to="/" replace />} />

            {/* Catch-all route for 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
