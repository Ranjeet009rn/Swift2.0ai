import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Search, Download, UserCheck, UserX } from 'lucide-react';

const DownlineReport = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLevel, setSelectedLevel] = useState('All');

    const [downline, setDownline] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('authToken');
                const response = await fetch('http://localhost/mlm/backend/api/user/downline_report.php', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (data.success) {
                    setDownline(data.data);
                }
            } catch (error) {
                console.error("Failed to fetch downline", error);
            }
        };
        fetchData();
    }, []);

    const filteredData = downline.filter(member => {
        const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.userId.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLevel = selectedLevel === 'All' || member.level === parseInt(selectedLevel);
        return matchesSearch && matchesLevel;
    });

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Total Downline</h1>
                        <p className="text-gray-500 text-sm mt-1"> Overview of your entire team structure</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl font-bold text-sm border border-blue-100">
                            Total Members: {downline.length}
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors">
                            <Download size={18} /> CSV
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search Name or ID..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto items-center">
                        <span className="text-sm text-gray-500 font-medium">Filter by Level:</span>
                        <select
                            className="px-4 py-2 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-gray-700 cursor-pointer"
                            value={selectedLevel}
                            onChange={(e) => setSelectedLevel(e.target.value)}
                        >
                            <option value="All">All Levels</option>
                            <option value="1">Level 1</option>
                            <option value="2">Level 2</option>
                            <option value="3">Level 3</option>
                            <option value="4">Level 4</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Member Details</th>
                                    <th className="px-6 py-4">Level</th>
                                    <th className="px-6 py-4">Sponsor</th>
                                    <th className="px-6 py-4">Package</th>
                                    <th className="px-6 py-4">Role</th>
                                    <th className="px-6 py-4">Join Date</th>
                                    <th className="px-6 py-4 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredData.map((member) => (
                                    <tr key={member.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                                    {member.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{member.name}</p>
                                                    <p className="text-xs text-gray-500">{member.userId}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-bold border border-gray-200">
                                                Level {member.level}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{member.directSponsor}</td>
                                        <td className="px-6 py-4">
                                            <span className={`text-xs font-bold ${member.package === 'None' ? 'text-gray-400' : 'text-indigo-600'
                                                }`}>
                                                {member.package}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${member.is_team_leader
                                                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
                                                    : 'bg-gray-200 text-gray-600'
                                                }`}>
                                                {member.is_team_leader ? 'Team Leader' : 'Member'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{member.joinDate}</td>
                                        <td className="px-6 py-4 text-right">
                                            {member.status === 'Active' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-bold border border-green-100">
                                                    <UserCheck size={12} /> Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-xs font-bold border border-red-100">
                                                    <UserX size={12} /> Inactive
                                                </span>
                                            )}
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

export default DownlineReport;
