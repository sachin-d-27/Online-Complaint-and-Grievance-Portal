import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import GrievyAssistant from "@/components/GrievyAssistant";
import { AlertTriangle, FilePlus2, List, Send, Upload } from "lucide-react";

type ComplaintStatus = "Submitted" | "Under Review" | "In Progress" | "Resolved" | "Closed" | "Escalated";
type ComplaintPriority = "Low" | "Medium" | "High";

interface ComplaintItem {
  id: string;
  title: string;
  category: string;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  dateSubmitted: string;
  daysPending: number;
}

const UserDashboard = () => {
  const { toast } = useToast();
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    category: "",
    description: "",
    priority: "Medium" as ComplaintPriority,
    anonymous: false,
  });
  const [files, setFiles] = useState<File[]>([]);

  const stats = useMemo(() => ({
    total: complaints.length,
    pending: complaints.filter(c => c.status === "Under Review").length,
    inProgress: complaints.filter(c => c.status === "In Progress").length,
    resolved: complaints.filter(c => c.status === "Resolved").length,
    escalated: complaints.filter(c => c.status === "Escalated").length
  }), [complaints]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/user-login";
      return;
    }
    const fetchComplaints = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("http://localhost:5000/api/complaints", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.message || "Failed to load complaints");
        }
        const mapped: ComplaintItem[] = (data.complaints || []).map((c: any) => ({
          id: c._id || c.complaintId || "",
          title: c.title,
          category: c.category,
          status: c.status as ComplaintStatus,
          priority: (c.priority || "Medium") as ComplaintPriority,
          dateSubmitted: c.createdAt ? new Date(c.createdAt).toISOString().slice(0, 10) : "",
          daysPending: c.createdAt ? Math.max(0, Math.floor((Date.now() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24))) : 0,
        }));
        setComplaints(mapped);
      } catch (error: any) {
        console.error("Load complaints error:", error);
        toast({ title: "Error", description: error.message || "Could not load complaints" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchComplaints();
  }, [toast]);

  const getStatusColor = (status: ComplaintStatus) => {
    switch (status) {
      case "Under Review": return "bg-warning text-warning-foreground";
      case "In Progress": return "bg-info text-info-foreground";
      case "Resolved": return "bg-success text-success-foreground";
      case "Escalated": return "bg-destructive text-destructive-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getPriorityColor = (priority: ComplaintPriority) => {
    switch (priority) {
      case "High": return "bg-destructive text-destructive-foreground";
      case "Medium": return "bg-warning text-warning-foreground";
      case "Low": return "bg-success text-success-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const submitNewComplaint = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/user-login";
      return;
    }
    if (!form.title.trim() || !form.category || !form.description.trim()) {
      toast({ title: "Validation", description: "Please fill in title, category and description." });
      return;
    }
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("category", form.category);
      formData.append("description", form.description);
      formData.append("priority", form.priority);
      formData.append("anonymous", String(form.anonymous));
      files.forEach((file) => formData.append("attachments", file));

      const response = await fetch("http://localhost:5000/api/complaints", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to submit complaint");
      }
      const c = data.complaint;
      const newItem: ComplaintItem = {
        id: c._id || c.complaintId || Math.random().toString(36).slice(2),
        title: c.title,
        category: c.category,
        status: c.status as ComplaintStatus,
        priority: (c.priority || "Medium") as ComplaintPriority,
        dateSubmitted: c.createdAt ? new Date(c.createdAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
        daysPending: 0,
      };
      setComplaints(prev => [newItem, ...prev]);
      setForm({ title: "", category: "", description: "", priority: "Medium", anonymous: false });
      setFiles([]);
      toast({ title: "Submitted", description: "Complaint submitted successfully." });
    } catch (error: any) {
      console.error("Submit complaint error:", error);
      toast({ title: "Error", description: error.message || "Submission failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">User Dashboard</h1>
          <p className="text-blue-100">Track and manage your submitted complaints</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full md:w-auto">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-foreground">{stats.total}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-warning">{stats.pending}</div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-info">{stats.inProgress}</div>
                <div className="text-xs text-muted-foreground">In Progress</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-success">{stats.resolved}</div>
                <div className="text-xs text-muted-foreground">Resolved</div>
              </CardContent>
            </Card>
          </div>

          <Button onClick={submitNewComplaint} className="ml-4 whitespace-nowrap" disabled={isSubmitting}>
            <FilePlus2 className="h-4 w-4 mr-2" /> New Complaint
          </Button>
        </div>

        <Tabs defaultValue="my-complaints" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="my-complaints" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              My Complaints
            </TabsTrigger>
            <TabsTrigger value="submit" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Submit
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-complaints">
            <div className="space-y-4">
              {complaints.map((complaint) => (
                <Card key={complaint.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-1">{complaint.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          ID: {complaint.id}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Badge className={getStatusColor(complaint.status)}>{complaint.status}</Badge>
                        <Badge className={getPriorityColor(complaint.priority)}>{complaint.priority}</Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      <div>
                        <label className="text-sm font-medium">Submitted</label>
                        <p className="text-sm text-muted-foreground">{complaint.dateSubmitted}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Category</label>
                        <p className="text-sm text-muted-foreground">{complaint.category}</p>
                      </div>
                      <div className="flex justify-end">
                        <Button variant="outline" size="sm">
                          <Send className="h-4 w-4 mr-2" /> Follow Up
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {complaints.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No complaints submitted yet.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="submit">
            <Card>
              <CardHeader>
                <CardTitle>Submit a Complaint</CardTitle>
                <CardDescription>Fill the form to create a new complaint</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Title</label>
                    <input name="title" value={form.title} onChange={handleFormChange} className="w-full p-2 border rounded-md" placeholder="Brief title" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <Select value={form.category} onValueChange={(val) => setForm(prev => ({ ...prev, category: val }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          "Infrastructure",
                          "Utilities",
                          "Healthcare",
                          "Education",
                          "Transportation",
                          "Environment",
                          "Other",
                        ].map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Priority</label>
                    <Select value={form.priority} onValueChange={(val) => setForm(prev => ({ ...prev, priority: val as ComplaintPriority }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        {["Low", "Medium", "High"].map((p) => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium">Description</label>
                    <textarea name="description" value={form.description} onChange={handleFormChange} className="w-full p-2 border rounded-md min-h-32" placeholder="Describe the issue in detail" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium">Attachments</label>
                    <input
                      type="file"
                      multiple
                      onChange={(e) => {
                        const selected = Array.from(e.target.files || []);
                        setFiles(selected);
                      }}
                      className="w-full p-2 border rounded-md"
                    />
                    {files.length > 0 && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center justify-between mb-1">
                          <span>{files.length} file(s) selected</span>
                          <button type="button" className="text-blue-600" onClick={() => setFiles([])}>Clear</button>
                        </div>
                        <ul className="list-disc list-inside">
                          {files.map((f) => (
                            <li key={f.name}>{f.name}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <input type="checkbox" name="anonymous" checked={form.anonymous} onChange={handleFormChange} />
                      Submit anonymously
                    </label>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button onClick={submitNewComplaint} disabled={isSubmitting}>{isSubmitting ? "Submitting..." : "Submit"}</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <GrievyAssistant />
    </div>
  );
};

export default UserDashboard;
