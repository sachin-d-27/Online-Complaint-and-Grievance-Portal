import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserCog, ShieldCheck, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const RoleSelector = () => {
  const navigate = useNavigate();

  const roles = [
    {
      id: "user",
      title: "Citizen/User",
      description: "Raise complaints, track status, and manage your profile",
      icon: Users,
      color: "bg-gradient-to-br from-blue-500 to-blue-600",
      route: "/user-dashboard"
    },
    {
      id: "staff",
      title: "Staff Member",
      description: "View assigned complaints and update their status anytime",
      icon: UserCog,
      color: "bg-gradient-to-br from-green-500 to-green-600",
      route: "/staff-dashboard"
    },
    {
      id: "admin",
      title: "Administrator",
      description: "Manage complaint allocation, escalations, and generate reports",
      icon: ShieldCheck,
      color: "bg-gradient-to-br from-purple-500 to-purple-600",
      route: "/admin-dashboard"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Online Complaint & Grievance Portal
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A comprehensive platform to raise, track, and resolve complaints efficiently with AI-powered assistance
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {roles.map((role) => {
            const IconComponent = role.icon;
            return (
              <Card key={role.id} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
                <CardHeader className="text-center pb-4">
                  <div className={`w-16 h-16 ${role.color} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">{role.title}</CardTitle>
                  <CardDescription className="text-sm">{role.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button 
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                    onClick={() => {
                      if (role.id === "user") {
                        navigate("/user-login");
                      } else if (role.id === "staff") {
                        navigate("/staff-login");
                      } else if (role.id === "admin") {
                        navigate("/admin-login");
                      }
                    }}
                  >
                    Access Portal
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Features Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 border-0">
          <h2 className="text-2xl font-semibold text-center mb-8">Platform Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              "AI-Powered Assistance",
              "Real-time Status Tracking",
              "Anonymous Complaints",
              "Automated Escalation",
              "Multi-category Support",
              "Document Upload",
              "Report Generation",
              "Mobile Responsive"
            ].map((feature, index) => (
              <div key={index} className="text-center p-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-info rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-semibold">{index + 1}</span>
                </div>
                <p className="text-sm font-medium text-foreground">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleSelector;