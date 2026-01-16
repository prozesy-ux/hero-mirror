import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, ShieldOff, Search, RefreshCw, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface SecurityLog {
  id: string;
  ip_address: string;
  user_agent: string | null;
  user_id: string | null;
  event_type: string;
  attempt_count: number;
  is_blocked: boolean;
  block_reason: string | null;
  blocked_until: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

const SecurityLogsManagement = () => {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [blockedFilter, setBlockedFilter] = useState<string>("all");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("security_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (eventFilter !== "all") {
        query = query.eq("event_type", eventFilter);
      }

      if (blockedFilter === "blocked") {
        query = query.eq("is_blocked", true);
      } else if (blockedFilter === "active") {
        query = query.eq("is_blocked", false);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs((data as SecurityLog[]) || []);
    } catch (error) {
      console.error("Error fetching security logs:", error);
      toast.error("Failed to fetch security logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [eventFilter, blockedFilter]);

  const handleUnblock = async (logId: string) => {
    try {
      const { error } = await supabase
        .from("security_logs")
        .update({ 
          is_blocked: false, 
          blocked_until: null,
          block_reason: null 
        })
        .eq("id", logId);

      if (error) throw error;
      toast.success("IP unblocked successfully");
      fetchLogs();
    } catch (error) {
      console.error("Error unblocking IP:", error);
      toast.error("Failed to unblock IP");
    }
  };

  const handleDelete = async (logId: string) => {
    try {
      const { error } = await supabase
        .from("security_logs")
        .delete()
        .eq("id", logId);

      if (error) throw error;
      toast.success("Log deleted successfully");
      fetchLogs();
    } catch (error) {
      console.error("Error deleting log:", error);
      toast.error("Failed to delete log");
    }
  };

  const handleClearOldLogs = async () => {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { error } = await supabase
        .from("security_logs")
        .delete()
        .lt("created_at", sevenDaysAgo)
        .eq("is_blocked", false);

      if (error) throw error;
      toast.success("Old logs cleared successfully");
      fetchLogs();
    } catch (error) {
      console.error("Error clearing old logs:", error);
      toast.error("Failed to clear old logs");
    }
  };

  const filteredLogs = logs.filter(log => 
    log.ip_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.event_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.user_agent && log.user_agent.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const blockedCount = logs.filter(l => l.is_blocked).length;
  const devtoolsCount = logs.filter(l => l.event_type === "devtools_detected").length;

  const getEventBadgeColor = (eventType: string) => {
    switch (eventType) {
      case "devtools_detected":
        return "bg-orange-500";
      case "repeated_inspection":
        return "bg-red-500";
      case "rate_limit_exceeded":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Shield className="h-6 w-6" />
          Security Logs
        </h2>
        <div className="flex gap-2">
          <Button onClick={handleClearOldLogs} variant="outline" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Old Logs
          </Button>
          <Button onClick={fetchLogs} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#111113] border border-[#27272a] rounded-xl p-6 hover:border-[#3f3f46] transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <Shield className="h-4 w-4 text-blue-400" />
            </div>
            <span className="text-sm font-medium text-zinc-400">Total Events</span>
          </div>
          <div className="text-2xl font-bold text-white">{logs.length}</div>
        </div>
        <div className="bg-[#111113] border border-[#27272a] rounded-xl p-6 hover:border-[#3f3f46] transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20">
              <AlertTriangle className="h-4 w-4 text-red-400" />
            </div>
            <span className="text-sm font-medium text-zinc-400">Blocked IPs</span>
          </div>
          <div className="text-2xl font-bold text-red-400">{blockedCount}</div>
        </div>
        <div className="bg-[#111113] border border-[#27272a] rounded-xl p-6 hover:border-[#3f3f46] transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-500/10 rounded-lg border border-orange-500/20">
              <Shield className="h-4 w-4 text-orange-400" />
            </div>
            <span className="text-sm font-medium text-zinc-400">DevTools Detections</span>
          </div>
          <div className="text-2xl font-bold text-orange-400">{devtoolsCount}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search by IP, event type, or user agent..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-[#0c0c0e] border-[#27272a] text-white placeholder-zinc-500 focus:border-[#3f3f46]"
          />
        </div>
        <Select value={eventFilter} onValueChange={setEventFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Event Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="devtools_detected">DevTools Detected</SelectItem>
            <SelectItem value="repeated_inspection">Repeated Inspection</SelectItem>
            <SelectItem value="rate_limit_exceeded">Rate Limit Exceeded</SelectItem>
          </SelectContent>
        </Select>
        <Select value={blockedFilter} onValueChange={setBlockedFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
            <SelectItem value="active">Active</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Logs Table */}
      <div className="bg-[#111113] border border-[#27272a] rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#18181b] border-b border-[#27272a] hover:bg-[#18181b]">
              <TableHead className="text-zinc-400">IP Address</TableHead>
              <TableHead className="text-zinc-400">Event Type</TableHead>
              <TableHead className="text-zinc-400">Attempts</TableHead>
              <TableHead className="text-zinc-400">Status</TableHead>
              <TableHead className="text-zinc-400">Blocked Until</TableHead>
              <TableHead className="text-zinc-400">Time</TableHead>
              <TableHead className="text-zinc-400">Actions</TableHead>
            </TableRow>
          </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No security logs found
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id} className="border-t border-[#27272a] hover:bg-[#1a1a1e] transition-colors">
                    <TableCell className="font-mono text-sm">{log.ip_address}</TableCell>
                    <TableCell>
                      <Badge className={getEventBadgeColor(log.event_type)}>
                        {log.event_type.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>{log.attempt_count}</TableCell>
                    <TableCell>
                      {log.is_blocked ? (
                        <Badge variant="destructive">Blocked</Badge>
                      ) : (
                        <Badge variant="secondary">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.blocked_until 
                        ? format(new Date(log.blocked_until), "MMM d, HH:mm")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(log.created_at), "MMM d, HH:mm")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {log.is_blocked && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUnblock(log.id)}
                          >
                            <ShieldOff className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(log.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default SecurityLogsManagement;
