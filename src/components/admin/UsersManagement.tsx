import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Crown, User as UserIcon, Trash2, Search, Loader2, ToggleLeft, ToggleRight, Eye } from 'lucide-react';
import { toast } from 'sonner';
import UserDetailView from './UserDetailView';

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  is_pro: boolean;
  created_at: string;
}

const UsersManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    setUsers(data || []);
    setLoading(false);
  };

  const handleDeleteUser = async (userId: string, userIdAuth: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    setDeletingId(userId);
    
    try {
      // Delete from user_roles first
      await supabase.from('user_roles').delete().eq('user_id', userIdAuth);
      
      // Delete from profiles
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      
      if (error) {
        toast.error('Failed to delete user');
        console.error(error);
      } else {
        toast.success('User deleted successfully');
        fetchUsers();
      }
    } catch (err) {
      toast.error('An error occurred');
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleTogglePro = async (userId: string, currentStatus: boolean) => {
    setTogglingId(userId);
    
    const { error } = await supabase
      .from('profiles')
      .update({ is_pro: !currentStatus })
      .eq('id', userId);
    
    if (error) {
      toast.error('Failed to update user status');
    } else {
      toast.success(`User ${!currentStatus ? 'upgraded to Pro' : 'downgraded to Free'}`);
      fetchUsers();
    }
    
    setTogglingId(null);
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const proCount = users.filter(u => u.is_pro).length;
  const freeCount = users.filter(u => !u.is_pro).length;

  const handleUserClick = (user: UserProfile) => {
    setSelectedUser(user);
  };

  const handleBackToList = () => {
    setSelectedUser(null);
  };

  const handleUserDeleted = () => {
    setSelectedUser(null);
    fetchUsers();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-white animate-spin" />
      </div>
    );
  }

  // Show user detail view if a user is selected
  if (selectedUser) {
    return (
      <UserDetailView
        userId={selectedUser.id}
        userIdAuth={selectedUser.user_id}
        onBack={handleBackToList}
        onUserDeleted={handleUserDeleted}
      />
    );
  }

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-[#111113] border border-[#27272a] rounded-xl p-4 hover:border-[#3f3f46] transition-colors">
          <div className="text-zinc-400 text-sm font-medium">Total Users</div>
          <div className="text-2xl font-bold text-white">{users.length}</div>
        </div>
        <div className="bg-[#111113] border border-[#27272a] rounded-xl p-4 hover:border-[#3f3f46] transition-colors">
          <div className="text-zinc-400 text-sm font-medium">Pro Users</div>
          <div className="text-2xl font-bold text-amber-400">{proCount}</div>
        </div>
        <div className="bg-[#111113] border border-[#27272a] rounded-xl p-4 hover:border-[#3f3f46] transition-colors">
          <div className="text-zinc-400 text-sm font-medium">Free Users</div>
          <div className="text-2xl font-bold text-zinc-400">{freeCount}</div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full bg-[#0c0c0e] border border-[#27272a] rounded-xl pl-12 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#3f3f46]"
        />
      </div>

      <div className="bg-[#111113] border border-[#27272a] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#18181b]">
            <tr>
              <th className="text-left px-6 py-4 text-zinc-400 font-medium text-sm">User</th>
              <th className="text-left px-6 py-4 text-zinc-400 font-medium text-sm">Email</th>
              <th className="text-left px-6 py-4 text-zinc-400 font-medium text-sm">Plan</th>
              <th className="text-left px-6 py-4 text-zinc-400 font-medium text-sm">Joined</th>
              <th className="text-right px-6 py-4 text-zinc-400 font-medium text-sm">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr 
                key={user.id} 
                className="border-t border-[#27272a] hover:bg-[#1a1a1e] transition-colors cursor-pointer"
                onClick={() => handleUserClick(user)}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {user.avatar_url ? (
                      <img 
                        src={user.avatar_url} 
                        alt={user.full_name || 'User'} 
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                        {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                      </div>
                    )}
                    <span className="text-white font-medium">{user.full_name || 'No name'}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-400">{user.email}</td>
                <td className="px-6 py-4">
                  {user.is_pro ? (
                    <span className="flex items-center gap-1 px-3 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full w-fit">
                      <Crown size={12} /> Pro
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-3 py-1 bg-white/10 text-gray-300 text-xs rounded-full w-fit">
                      <UserIcon size={12} /> Free
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-gray-400">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleUserClick(user); }}
                      className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all"
                      title="View Details"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleTogglePro(user.id, user.is_pro); }}
                      disabled={togglingId === user.id}
                      className={`p-2 rounded-lg transition-all ${
                        user.is_pro 
                          ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' 
                          : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                      }`}
                      title={user.is_pro ? 'Downgrade to Free' : 'Upgrade to Pro'}
                    >
                      {togglingId === user.id ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : user.is_pro ? (
                        <ToggleRight size={18} />
                      ) : (
                        <ToggleLeft size={18} />
                      )}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteUser(user.id, user.user_id); }}
                      disabled={deletingId === user.id}
                      className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-all"
                      title="Delete User"
                    >
                      {deletingId === user.id ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Trash2 size={18} />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            {searchQuery ? 'No users found matching your search' : 'No users found'}
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersManagement;
