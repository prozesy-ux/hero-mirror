import { useState, useEffect } from 'react';
import { Shield, Search, Filter, Download, RefreshCw, User, Clock, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAdminData } from '@/hooks/useAdminData';

interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, any>;
  ip_address: string | null;
  created_at: string;
}

const AdminAuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const { fetchData } = useAdminData();

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    const result = await fetchData('admin_audit_logs', {
      order: { column: 'created_at', ascending: false },
      limit: 100
    });
    if (result?.data) {
      setLogs(result.data);
    }
    setLoading(false);
  };

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      create: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      update: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      delete: 'bg-red-500/20 text-red-400 border-red-500/30',
      login: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
      logout: 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    };
    const actionType = action.split('_')[0].toLowerCase();
    return colors[actionType] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.admin_id.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (actionFilter === 'all') return matchesSearch;
    return matchesSearch && log.action.toLowerCase().startsWith(actionFilter);
  });

  const exportLogs = () => {
    const csv = [
      ['Timestamp', 'Admin ID', 'Action', 'Entity Type', 'Entity ID', 'IP Address'].join(','),
      ...filteredLogs.map(log => [
        format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
        log.admin_id,
        log.action,
        log.entity_type || '',
        log.entity_id || '',
        log.ip_address || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    toast.success('Audit logs exported');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48 bg-white/5" />
          <Skeleton className="h-10 w-32 bg-white/5" />
        </div>
        <Skeleton className="h-96 rounded-2xl bg-white/5" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Audit Logs</h1>
            <p className="text-sm text-slate-400">{logs.length} actions recorded</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchLogs}
            className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button 
            size="sm" 
            onClick={exportLogs}
            className="bg-emerald-600 hover:bg-emerald-700 rounded-xl"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 rounded-xl"
          />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-full sm:w-[160px] bg-white/5 border-white/10 text-white rounded-xl">
            <Filter className="w-4 h-4 mr-2 text-slate-400" />
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-white/10">
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="create">Creates</SelectItem>
            <SelectItem value="update">Updates</SelectItem>
            <SelectItem value="delete">Deletes</SelectItem>
            <SelectItem value="login">Logins</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900/50 rounded-2xl border border-white/5 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-slate-400 font-semibold">Timestamp</TableHead>
              <TableHead className="text-slate-400 font-semibold">Admin</TableHead>
              <TableHead className="text-slate-400 font-semibold">Action</TableHead>
              <TableHead className="text-slate-400 font-semibold">Entity</TableHead>
              <TableHead className="text-slate-400 font-semibold">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <Shield className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No audit logs found</p>
                  <p className="text-sm text-slate-500">Admin actions will be recorded here</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id} className="border-white/5 hover:bg-white/5">
                  <TableCell className="text-slate-300">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <div>
                        <p className="text-sm">{format(new Date(log.created_at), 'MMM d, yyyy')}</p>
                        <p className="text-xs text-slate-500">{format(new Date(log.created_at), 'HH:mm:ss')}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-slate-400" />
                      </div>
                      <span className="text-sm text-slate-300 font-mono">{log.admin_id.slice(0, 8)}...</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`${getActionBadge(log.action)} border`}>
                      {log.action.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {log.entity_type && (
                      <div className="text-sm">
                        <span className="text-slate-300">{log.entity_type}</span>
                        {log.entity_id && (
                          <span className="text-slate-500 font-mono text-xs ml-2">
                            #{log.entity_id.slice(0, 8)}
                          </span>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {log.details && Object.keys(log.details).length > 0 && (
                      <code className="text-xs text-slate-500 bg-white/5 px-2 py-1 rounded">
                        {JSON.stringify(log.details).slice(0, 50)}...
                      </code>
                    )}
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

export default AdminAuditLogs;
