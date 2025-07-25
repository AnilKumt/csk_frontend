import { useState,useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Save, RotateCcw, Badge } from "lucide-react";
import { UserRole } from "@/contexts/AuthContext";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import axios from "axios";
import { toast } from "sonner";

const roles: UserRole[] = [
  "owner",
  "admin",
  "sales_manager",
  "team_lead",
  "agent",
  "site_incharge",
  "contractor",
  "accountant",
  "customer_purchased",
  "customer_prospect",
  "public_user",
];

const moduleConfig: Record<string, string[]> = {
  "Core Modules": ["Dashboard", "Properties"],
  "Admin Modules": ["User Management", "Content Management", "System Settings"],
  "Sales Modules": [
    "Sales Pipeline",
    "Team Management",
    "Lead Management",
    "Commissions",
  ],
  "Operations Modules": [
    "Projects",
    "Task Management",
    "Quality Control",
    "Site Inspections",
    "Contractors",
    "Materials",
    "Labor Management",
  ],
  "Finance Modules": [
    "Invoices",
    "Payments",
    "Budget Tracking",
    "Tax Documents",
    "Reports",
  ],
  "Communication Modules": ["Communications"],
};

const permissions = ["read", "write", "edit", "delete", "view_only"];

export default function Permission() {
  const [selectedRole, setSelectedRole] = useState<UserRole>("admin");
  const [accessMatrix, setAccessMatrix] = useState<Record<string, boolean>>({});

  const togglePermission = (
    module: string,
    submodule: string,
    permission: string
  ) => {
    const key = `${selectedRole}-${module}-${submodule}-${permission}`;
    setAccessMatrix((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    const permissionsPayload = Object.entries(moduleConfig).flatMap(
      ([module, subs]) =>
        subs.map((sub) => {
          const actions: Record<string, boolean> = {};
          permissions.forEach((perm) => {
            const key = `${selectedRole}-${module}-${sub}-${perm}`;
            actions[perm] = !!accessMatrix[key];
          });
          return {
            module,
            submodule: sub,
            actions,
          };
        })
    );

    const payload = {
      name: selectedRole,
      permissions: permissionsPayload,
    };

    try {
      await axios.post("http://localhost:3000/api/role/addRole", payload);
      toast.success("Role saved successfully", {
        description: `${selectedRole.replace(/_/g, " ")} permissions updated.`,
      });
    } catch (error) {
      console.error("Error saving role:", error);
      toast.error("Failed to save role");
    }
  };

  const handleReset = () => {
    setAccessMatrix({});
  };

  const fetchRolePermissions = async (role: UserRole) => {
  try {
    const res = await axios.get(
      `http://localhost:3000/api/role/getRole/${role}`
    );

    const roleData = res.data;
    const matrix: Record<string, boolean> = {};

    roleData.permissions.forEach((perm: any) => {
      const { module, submodule, actions } = perm;
      for (const [action, isEnabled] of Object.entries(actions)) {
        const key = `${role}-${module}-${submodule}-${action}`;
        matrix[key] = isEnabled;
      }
    });

    setAccessMatrix(matrix);
  } catch (error) {
    console.error("Failed to fetch role permissions", error);
    toast.error("Failed to load permissions for this role");
  }
};

// Call when component loads or role changes
useEffect(() => {
  fetchRolePermissions(selectedRole);
}, [selectedRole]);

  return (
    <div className="p-2 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Permission Matrix</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-between items-end">
            <div className="flex flex-col gap-2 w-[50%]">
              <Label>Select Role</Label>
              <Select
                onValueChange={(val: UserRole) => setSelectedRole(val)}
                value={selectedRole}
              >
                <SelectTrigger className="w-[60%]">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex items-center gap-1"
                onClick={handleReset}
              >
                <RotateCcw className="w-4 h-4" /> Reset
              </Button>
              <Button className="flex items-center gap-1" onClick={handleSave}>
                <Save className="w-4 h-4" /> Save Changes
              </Button>
            </div>
          </div>

          {Object.entries(moduleConfig).map(([module, submodules]) => (
            <div key={module} className="border p-4 rounded-md  mb-6 space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <h5 className="text-[10px] font-medium  text-black-600 border rounded-full px-3 py-1 shadow-sm font-sans">
                  {module.split(" ")[0]}
                </h5>
                <h3 className="font-medium text-lg">{module}</h3>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px] text-left font-semibold">
                      Module
                    </TableHead>
                    {permissions.map((perm) => (
                      <TableHead
                        key={perm}
                        className="capitalize text-center w-[100px]"
                      >
                        {perm.replace("_", " ")}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submodules.map((sub) => (
                    <TableRow key={sub}>
                      <TableCell className="text-left font-medium">
                        {sub}
                      </TableCell>
                      {permissions.map((perm) => {
                        const key = `${selectedRole}-${module}-${sub}-${perm}`;
                        const isActive = !!accessMatrix[key];
                        return (
                          <TableCell key={perm} className="text-center">
                            <Switch
                              checked={isActive}
                              onCheckedChange={() =>
                                togglePermission(module, sub, perm)
                              }
                            />
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
