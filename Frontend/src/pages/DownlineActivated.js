import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Search, UserCheck, Calendar } from 'lucide-react';

const DownlineActivated = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const [activeMembers, setActiveMembers] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('authToken');
                const response = await fetch('http://localhost/mlm/backend/api/user/downline_activated.php', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (data.success) {
                    setActiveMembers(data.data);
                }
            } catch (error) {
                console.error("Failed to fetch activated members", error);
            }
        };
        fetchData();
    }, []);

    const filteredData = activeMembers.filter(member =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.userId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Activated Members</h1>
                        <p className="text-gray-500 text-sm mt-1">List of active team members contributing to business</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="bg-green-50 text-green-700 px-4 py-2 rounded-xl font-bold text-sm border border-green-100 flex items-center gap-2">
                            <UserCheck size={18} /> Active Count: {activeMembers.length}
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <div className="relative max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search Active Members..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Member</th>
                                    <th className="px-6 py-4">Package</th>
                                    <th className="px-6 py-4">Investment</th>
                                    <th className="px-6 py-4">Activation Date</th>
                                    <th className="px-6 py-4">Sponsor</th>
                                    <th className="px-6 py-4">Role</th>
                                    <th className="px-6 py-4 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredData.map((member) => (
                                    <tr key={member.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-bold text-gray-900">{member.name}</p>
                                                <p className="text-xs text-gray-500">{member.userId}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-xs font-bold uppercase ${member.package === 'Business' ? 'text-purple-600' : 'text-blue-600'
                                                }`}>
                                                {member.package}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-900">₹ {member.amount.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar size={14} /> {member.activationDate}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{member.sponsor}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${member.is_team_leader
                                                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
                                                    : 'bg-gray-200 text-gray-600'
                                                }`}>
                                                {member.is_team_leader ? 'Team Leader' : 'Member'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                                                Active
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default DownlineActivated;
